import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { PostService } from '../post/post.service';
import { RetryQueueService } from './retry-queue.service';

@Injectable()
export class PostSchedulerService {
  private readonly logger = new Logger(PostSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly postService: PostService,
    private readonly retryQueue: RetryQueueService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledPosts() {
    const now = new Date();
    this.logger.debug(`Checking scheduled posts at ${now.toISOString()}`);

    const due = await this.prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
        deletedAt: null,
      },
      include: { integrationAccount: true },
    });

    if (due.length === 0) return;
    this.logger.log(`Found ${due.length} scheduled posts due for publication`);

    for (const post of due) {
      try {
        await this.postService.publish(post.id);
        this.logger.log(`Auto-published post ${post.id} on ${post.platform}`);
      } catch (err: any) {
        this.logger.error(`Failed to auto-publish post ${post.id}: ${err.message}`);
        await this.prisma.post.update({
          where: { id: post.id },
          data: { status: 'FAILED' },
        });
        this.retryQueue.enqueue({
          type: 'PUBLISH_POST',
          targetId: post.id,
          payload: { platform: post.platform },
          maxAttempts: 5,
          lastError: err.message,
        });
      }
    }
  }
}
