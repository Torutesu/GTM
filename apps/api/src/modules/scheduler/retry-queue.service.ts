import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface RetryJob {
  id: string;
  type: 'PUBLISH_POST' | 'EXECUTE_AGENT' | 'SYNC_INTEGRATION';
  targetId: string;
  payload: Record<string, unknown>;
  attempt: number;
  maxAttempts: number;
  lastError: string;
  nextRetryAt: Date;
}

@Injectable()
export class RetryQueueService {
  private readonly logger = new Logger(RetryQueueService.name);
  private queue: RetryJob[] = [];
  private processing = false;

  constructor(private readonly prisma: PrismaService) {}

  enqueue(job: Omit<RetryJob, 'id' | 'attempt' | 'nextRetryAt'>) {
    const entry: RetryJob = {
      ...job,
      id: `${job.type}_${job.targetId}_${Date.now()}`,
      attempt: 0,
      nextRetryAt: new Date(Date.now() + this.backoff(0)),
    };
    this.queue.push(entry);
    this.logger.warn(`Retry queued: ${job.type} ${job.targetId} — ${job.lastError}`);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    const now = new Date();
    const due = this.queue.filter((j) => j.nextRetryAt <= now && j.attempt < j.maxAttempts);

    for (const job of due) {
      job.attempt++;
      try {
        this.logger.log(`Retrying ${job.type} ${job.targetId} (attempt ${job.attempt}/${job.maxAttempts})`);
        await this.executeJob(job);
        this.queue = this.queue.filter((j) => j.id !== job.id);
      } catch (err: any) {
        job.lastError = err.message;
        if (job.attempt >= job.maxAttempts) {
          this.logger.error(`Retry exhausted for ${job.type} ${job.targetId}: ${job.lastError}`);
          this.queue = this.queue.filter((j) => j.id !== job.id);
        } else {
          job.nextRetryAt = new Date(Date.now() + this.backoff(job.attempt));
        }
      }
    }

    this.processing = false;
  }

  private async executeJob(job: RetryJob) {
    switch (job.type) {
      case 'PUBLISH_POST':
        await this.prisma.post.update({
          where: { id: job.targetId },
          data: { status: 'PUBLISHING' },
        });
        break;
      default:
        break;
    }
  }

  private backoff(attempt: number): number {
    const base = 30_000;
    const max = 3_600_000;
    const delay = Math.min(base * Math.pow(2, attempt), max);
    return delay + Math.random() * 10_000;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getFailedJobs(): RetryJob[] {
    return this.queue.filter((j) => j.attempt >= j.maxAttempts);
  }
}
