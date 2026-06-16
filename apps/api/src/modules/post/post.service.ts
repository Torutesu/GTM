import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { XConnector } from '../integration/connectors/x.connector';
import { InstagramConnector } from '../integration/connectors/instagram.connector';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xConnector: XConnector,
    private readonly instagramConnector: InstagramConnector,
  ) {}

  async findByTenant(tenantId: string, options: {
    status?: string;
    platform?: string;
    page: number;
    limit: number;
  }) {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (options.status) where.status = options.status;
    if (options.platform) where.platform = options.platform;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        include: { integrationAccount: { select: { platformUserName: true } } },
      }),
      this.prisma.post.count({ where: where as any }),
    ]);

    return {
      data: posts,
      meta: { total, page: options.page, limit: options.limit, hasMore: options.page * options.limit < total },
    };
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { integrationAccount: { select: { platformUserName: true } } },
    });
    if (!post || post.deletedAt) throw new NotFoundException('Post not found');
    return { data: post };
  }

  async create(tenantId: string, userId: string, data: {
    contentText: string;
    platform: string;
    integrationAccountId?: string;
    scheduledAt?: string;
  }) {
    if (data.contentText.length > 280 && data.platform === 'X') {
      throw new BadRequestException('X posts max 280 characters');
    }

    const post = await this.prisma.post.create({
      data: {
        tenantId,
        integrationAccountId: data.integrationAccountId || null,
        platform: data.platform as any,
        contentText: data.contentText,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        isAiGenerated: false,
        status: 'DRAFT',
      },
    });

    return { data: post };
  }

  async update(id: string, data: { contentText?: string; scheduledAt?: string }) {
    await this.findById(id);
    return this.prisma.post.update({
      where: { id },
      data: {
        ...(data.contentText && { contentText: data.contentText }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.post.update({ where: { id }, data: { status: status as any } });
  }

  async publish(id: string) {
    const post = await this.findById(id);
    const p = post.data;

    if (p.status !== 'APPROVED' && p.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot publish post with status ${p.status}`);
    }

    if (p.integrationAccountId) {
      const account = await this.prisma.integrationAccount.findUnique({
        where: { id: p.integrationAccountId },
      });
      if (!account) throw new NotFoundException('Integration account not found');

      let result: { postId: string };

      switch (p.platform) {
        case 'X':
          result = await this.xConnector.publishPost(account.accessToken, p.contentText);
          break;
        case 'INSTAGRAM':
          result = await this.instagramConnector.publishPost(
            account.accessToken,
            account.platformUserId || '',
            p.contentText,
          );
          break;
        default:
          throw new BadRequestException(`Publishing not supported for platform: ${p.platform}`);
      }

      return this.prisma.post.update({
        where: { id },
        data: { status: 'PUBLISHED', postedAt: new Date(), platformPostId: result.postId },
      });
    }

    return this.prisma.post.update({
      where: { id },
      data: { status: 'PUBLISHED', postedAt: new Date() },
    });
  }

  async schedule(id: string, scheduledAt: Date) {
    await this.findById(id);
    return this.prisma.post.update({
      where: { id },
      data: { scheduledAt, status: 'SCHEDULED' },
    });
  }
}
