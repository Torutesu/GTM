import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'gon-dev-secret',
    });
  }

  async validate(payload: { sub: string; tenantId: string; role: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt) throw new UnauthorizedException('User not found');
    return { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
  }
}
