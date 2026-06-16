import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PostService } from '../post.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { XConnector } from '../../integration/connectors/x.connector';
import { InstagramConnector } from '../../integration/connectors/instagram.connector';

describe('PostService', () => {
  let service: PostService;
  let prisma: any;

  const mockPrisma = {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    integrationAccount: {
      findUnique: jest.fn(),
    },
  };

  const mockXConnector = {
    publishPost: jest.fn(),
  };

  const mockInstagramConnector = {
    publishPost: jest.fn(),
    getAuthUrl: jest.fn(),
    handleCallback: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: XConnector, useValue: mockXConnector },
        { provide: InstagramConnector, useValue: mockInstagramConnector },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('creates a post draft', async () => {
      mockPrisma.post.create.mockResolvedValue({
        id: 'post-1',
        tenantId: 'tenant-1',
        contentText: 'Hello world!',
        platform: 'X',
        status: 'DRAFT',
      });

      const result = await service.create('tenant-1', 'user-1', {
        contentText: 'Hello world!',
        platform: 'X',
      });

      expect(result.data.contentText).toBe('Hello world!');
      expect(result.data.status).toBe('DRAFT');
      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            contentText: 'Hello world!',
            platform: 'X',
            status: 'DRAFT',
          }),
        }),
      );
    });

    it('rejects X posts over 280 chars', async () => {
      const longText = 'x'.repeat(281);
      await expect(
        service.create('tenant-1', 'user-1', { contentText: longText, platform: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('returns post by id', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post-1',
        contentText: 'Test post',
        deletedAt: null,
      });

      const result = await service.findById('post-1');
      expect(result.data.id).toBe('post-1');
    });

    it('throws on non-existent post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws on soft-deleted post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post-1',
        deletedAt: new Date(),
      });
      await expect(service.findById('post-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('publishes approved X post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post-1',
        status: 'APPROVED',
        platform: 'X',
        contentText: 'Tweet content',
        integrationAccountId: 'account-1',
        deletedAt: null,
      });
      mockPrisma.integrationAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        accessToken: 'x-access-token',
      });
      mockXConnector.publishPost.mockResolvedValue({ postId: 'x-post-123' });
      mockPrisma.post.update.mockResolvedValue({
        id: 'post-1',
        status: 'PUBLISHED',
        platformPostId: 'x-post-123',
        postedAt: new Date(),
      });

      const result = await service.publish('post-1');

      expect(result.status).toBe('PUBLISHED');
      expect(result.platformPostId).toBe('x-post-123');
      expect(mockXConnector.publishPost).toHaveBeenCalledWith('x-access-token', 'Tweet content');
    });

    it('fails to publish SCHEDULED post without approval', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post-1',
        status: 'SCHEDULED',
        platform: 'X',
        contentText: 'Test',
        integrationAccountId: null,
        deletedAt: null,
      });

      await expect(service.publish('post-1')).rejects.toThrow(BadRequestException);
    });

    it('can publish DRAFT post directly', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({
        id: 'post-1',
        status: 'DRAFT',
        platform: 'X',
        contentText: 'Test',
        integrationAccountId: null,
        deletedAt: null,
      });
      mockPrisma.post.update.mockResolvedValue({
        id: 'post-1',
        status: 'PUBLISHED',
        postedAt: new Date(),
      });

      const result = await service.publish('post-1');
      expect(result.status).toBe('PUBLISHED');
    });
  });

  describe('findByTenant', () => {
    it('returns paginated posts', async () => {
      mockPrisma.post.findMany.mockResolvedValue([{ id: 'post-1', contentText: 'Test' }]);
      mockPrisma.post.count.mockResolvedValue(1);

      const result = await service.findByTenant('tenant-1', { page: 1, limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.hasMore).toBe(false);
    });

    it('filters by status', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      await service.findByTenant('tenant-1', { status: 'DRAFT', page: 1, limit: 50 });

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DRAFT' }),
        }),
      );
    });
  });
});
