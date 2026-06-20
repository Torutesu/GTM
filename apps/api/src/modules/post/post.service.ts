import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { XConnector } from '../integration/connectors/x.connector';
import { InstagramConnector } from '../integration/connectors/instagram.connector';
import { TikTokConnector } from '../integration/connectors/tiktok.connector';
import { YouTubeConnector } from '../integration/connectors/youtube.connector';
import { LinkedInConnector } from '../integration/connectors/linkedin.connector';
import { ThreadsConnector } from '../integration/connectors/threads.connector';
import { PlatformFormatter } from './platform-formatter.service';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xConnector: XConnector,
    private readonly instagramConnector: InstagramConnector,
    private readonly tiktokConnector: TikTokConnector,
    private readonly youtubeConnector: YouTubeConnector,
    private readonly linkedinConnector: LinkedInConnector,
    private readonly threadsConnector: ThreadsConnector,
    private readonly formatter: PlatformFormatter,
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
    const formatted = this.formatter.formatContent(data.platform, data.contentText);
    const limits = this.formatter.getLimits(data.platform);

    if (formatted.length > limits.maxChars) {
      throw new BadRequestException(`${data.platform} posts max ${limits.maxChars} characters`);
    }

    const post = await this.prisma.post.create({
      data: {
        tenantId,
        integrationAccountId: data.integrationAccountId || null,
        platform: data.platform as any,
        contentText: formatted,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        isAiGenerated: false,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return { data: post };
  }

  async update(id: string, data: { contentText?: string; scheduledAt?: string }) {
    const post = await this.findById(id);
    const formatted = data.contentText ? this.formatter.formatContent(post.data.platform, data.contentText) : undefined;
    return this.prisma.post.update({
      where: { id },
      data: {
        ...(formatted && { contentText: formatted }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt), status: 'SCHEDULED' }),
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

    if (p.status !== 'APPROVED' && p.status !== 'SCHEDULED' && p.status !== 'DRAFT' && p.status !== 'PUBLISHING') {
      throw new BadRequestException(`Cannot publish post with status ${p.status}`);
    }

    await this.prisma.post.update({ where: { id }, data: { status: 'PUBLISHING' } });

    try {
      let result: { postId: string };

      if (p.integrationAccountId) {
        const account = await this.prisma.integrationAccount.findUnique({
          where: { id: p.integrationAccountId },
        });
        if (!account) throw new NotFoundException('Integration account not found');

        const formatted = this.formatter.formatContent(p.platform, p.contentText);

        switch (p.platform) {
          case 'X':
            result = await this.xConnector.publishPost(account.accessToken, formatted);
            break;
          case 'INSTAGRAM':
            result = await this.instagramConnector.publishPost(
              account.accessToken, account.platformUserId || '', formatted,
            );
            break;
          case 'TIKTOK':
            result = await this.tiktokConnector.publishPost(account.accessToken, formatted);
            break;
          case 'YOUTUBE':
            result = await this.youtubeConnector.publishPost(account.accessToken, formatted);
            break;
          case 'LINKEDIN':
            result = await this.linkedinConnector.publishPost(account.accessToken, formatted);
            break;
          case 'THREADS':
            result = await this.threadsConnector.publishPost(account.accessToken, formatted);
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
    } catch (err: any) {
      await this.prisma.post.update({
        where: { id },
        data: { status: 'FAILED' },
      });
      throw err;
    }
  }

  async schedule(id: string, scheduledAt: Date) {
    await this.findById(id);
    return this.prisma.post.update({
      where: { id },
      data: { scheduledAt, status: 'SCHEDULED' },
    });
  }

  getPlatformLimits(platform: string) {
    return this.formatter.getLimits(platform);
  }
}
