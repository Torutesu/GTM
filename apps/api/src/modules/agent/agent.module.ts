import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { GrowthStrategyAgent } from './agents/growth-strategy.agent';
import { SocialMediaAgent } from './agents/social-media.agent';
import { CompetitorIntelligenceAgent } from './agents/competitor-intelligence.agent';
import { SeoGeoAgent } from './agents/seo-geo.agent';
import { SocialListeningAgent } from './agents/social-listening.agent';
import { IndustryNewsAgent } from './agents/industry-news.agent';
import { OutreachAgent } from './agents/outreach.agent';
import { CvrOptimizationAgent } from './agents/cvr-optimization.agent';

@Module({
  controllers: [AgentController],
  providers: [
    AgentService,
    GrowthStrategyAgent,
    SocialMediaAgent,
    CompetitorIntelligenceAgent,
    SeoGeoAgent,
    SocialListeningAgent,
    IndustryNewsAgent,
    OutreachAgent,
    CvrOptimizationAgent,
  ],
  exports: [AgentService],
})
export class AgentModule {}
