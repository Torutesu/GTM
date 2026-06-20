import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { PostModule } from './modules/post/post.module';
import { AgentModule } from './modules/agent/agent.module';
import { ChatModule } from './modules/chat/chat.module';
import { FeedModule } from './modules/feed/feed.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { BillingModule } from './modules/billing/billing.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    UserModule,
    IntegrationModule,
    PostModule,
    AgentModule,
    ChatModule,
    FeedModule,
    GovernanceModule,
    BillingModule,
    CampaignModule,
    SchedulerModule,
    MonitoringModule,
  ],
})
export class AppModule {}
