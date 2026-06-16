import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    return user;
  }

  async findByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  async update(id: string, data: { name?: string; settings?: Prisma.JsonValue }) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.settings && { settings: data.settings as Prisma.InputJsonValue }),
      },
    });
  }
}
