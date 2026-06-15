import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { GrowthStrategyAgent } from './agents/growth-strategy.agent';
import { SocialMediaAgent } from './agents/social-media.agent';

@Module({
  controllers: [AgentController],
  providers: [AgentService, GrowthStrategyAgent, SocialMediaAgent],
  exports: [AgentService],
})
export class AgentModule {}
