import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 12);

    const tenant = await this.prisma.tenant.create({
      data: { name: `${name}'s Team` },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        tenantId: tenant.id,
        role: 'ADMIN',
        settings: {
          brandTone: 'professional',
          postFrequency: 5,
          ngKeywords: [],
          kpiTargets: { followers: 1000, engagement: 3 },
        },
      },
    });

    const tokens = this.generateTokens(user.id, user.tenantId, user.role);
    return { user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId, settings: user.settings }, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(password, user.password || '');
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.generateTokens(user.id, user.tenantId, user.role);
    return { user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId, settings: user.settings }, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.deletedAt) throw new UnauthorizedException('User not found');

      const tokens = this.generateTokens(user.id, user.tenantId, user.role);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(userId: string, tenantId: string, role: string) {
    const payload = { sub: userId, tenantId, role };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
