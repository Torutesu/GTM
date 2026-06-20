import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { PostModule } from '../post/post.module';
import { AgentModule } from '../agent/agent.module';
import { IntegrationModule } from '../integration/integration.module';
import { PostSchedulerService } from './post-scheduler.service';
import { TokenRefreshService } from './token-refresh.service';
import { AgentSchedulerService } from './agent-scheduler.service';
import { RetryQueueService } from './retry-queue.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    PostModule,
    AgentModule,
    IntegrationModule,
  ],
  providers: [
    PostSchedulerService,
    TokenRefreshService,
    AgentSchedulerService,
    RetryQueueService,
  ],
  exports: [RetryQueueService],
})
export class SchedulerModule {}
