import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    tenant: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock-token');
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('creates tenant and user on registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue({ id: 'tenant-1', name: "Test's Team" });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        tenantId: 'tenant-1',
        role: 'ADMIN',
      });

      const result = await service.register('test@example.com', 'password123', 'Test');

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('throws on duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'test@example.com' });

      await expect(
        service.register('test@example.com', 'password123', 'Test'),
      ).rejects.toThrow(ConflictException);
    });

    it('generates tokens with correct payload', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue({ id: 'tenant-1', name: "Test's Team" });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        tenantId: 'tenant-1',
        role: 'ADMIN',
      });
      mockJwtService.sign.mockReturnValue('signed-token');

      await service.register('test@example.com', 'password123', 'Test');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', tenantId: 'tenant-1', role: 'ADMIN' },
        expect.objectContaining({ expiresIn: '15m' }),
      );
    });

    it('creates tenant with users name', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue({ id: 'tenant-1', name: "Alice's Team" });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'alice@test.com',
        name: 'Alice',
        tenantId: 'tenant-1',
        role: 'ADMIN',
      });

      await service.register('alice@test.com', 'password123', 'Alice');
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: { name: "Alice's Team" },
      });
    });
  });

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 4);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        tenantId: 'tenant-1',
        role: 'ADMIN',
        password: hashedPassword,
        deletedAt: null,
      });

      const result = await service.login('test@example.com', 'password123');

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('throws on wrong password', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('correct-password', 4);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        deletedAt: null,
      });

      await expect(
        service.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws on non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws on deleted user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'deleted@test.com',
        password: 'hash',
        deletedAt: new Date(),
      });

      await expect(
        service.login('deleted@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('returns new tokens on valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1', tenantId: 'tenant-1', role: 'ADMIN' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        deletedAt: null,
      });

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('throws on invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when user no longer exists', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
