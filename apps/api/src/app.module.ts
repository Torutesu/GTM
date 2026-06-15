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
  ],
})
export class AppModule {}
