import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string, options: { cursor?: string; limit: number }) {
    const where: Record<string, unknown> = { tenantId };
    if (options.cursor) {
      where.id = { lt: options.cursor };
    }

    const events = await this.prisma.feedEvent.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take: options.limit,
    });

    return {
      data: events,
      meta: {
        cursor: events.length > 0 ? events[events.length - 1].id : null,
        hasMore: events.length === options.limit,
      },
    };
  }

  async createEvent(data: {
    tenantId: string;
    userId?: string;
    type: string;
    category: string;
    title: string;
    description?: string;
    targetType?: string;
    targetId?: string;
  }) {
    return this.prisma.feedEvent.create({ data: data as any });
  }
}
