import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GrowthStrategyAgent } from './agents/growth-strategy.agent';
import { SocialMediaAgent } from './agents/social-media.agent';
import { CompetitorIntelligenceAgent } from './agents/competitor-intelligence.agent';
import { SeoGeoAgent } from './agents/seo-geo.agent';
import { SocialListeningAgent } from './agents/social-listening.agent';
import { IndustryNewsAgent } from './agents/industry-news.agent';
import { OutreachAgent } from './agents/outreach.agent';
import { CvrOptimizationAgent } from './agents/cvr-optimization.agent';

@Injectable()
export class AgentService {
  private agents: Record<string, { execute: (input: any, context: any) => Promise<any> }>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly growthStrategyAgent: GrowthStrategyAgent,
    private readonly socialMediaAgent: SocialMediaAgent,
    private readonly competitorIntelligenceAgent: CompetitorIntelligenceAgent,
    private readonly seoGeoAgent: SeoGeoAgent,
    private readonly socialListeningAgent: SocialListeningAgent,
    private readonly industryNewsAgent: IndustryNewsAgent,
    private readonly outreachAgent: OutreachAgent,
    private readonly cvrOptimizationAgent: CvrOptimizationAgent,
  ) {
    this.agents = {
      growth_strategy: growthStrategyAgent,
      social_media: socialMediaAgent,
      competitor_intelligence: competitorIntelligenceAgent,
      seo_geo: seoGeoAgent,
      social_listening: socialListeningAgent,
      industry_news: industryNewsAgent,
      outreach: outreachAgent,
      cvr_optimization: cvrOptimizationAgent,
    };
  }

  async execute(
    tenantId: string,
    userId: string,
    agentType: string,
    input: Record<string, unknown>,
    campaignId?: string,
  ) {
    const agent = this.agents[agentType];
    if (!agent) throw new BadRequestException(`Unknown agent type: ${agentType}`);

    const task = await this.prisma.task.create({
      data: {
        tenantId,
        assignedUserId: userId,
        agentType: agentType.toUpperCase() as any,
        title: `Execute ${agentType}`,
        status: 'IN_PROGRESS',
        campaignId,
      },
    });

    try {
      const result = await agent.execute(input, { tenantId, userId, taskId: task.id });

      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: 'COMPLETED' },
      });

      return { taskId: task.id, result };
    } catch (error) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: 'CANCELLED' },
      });
      throw error;
    }
  }

  async listTasks(tenantId: string) {
    return this.prisma.task.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async cancelTask(taskId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'CANCELLED' },
    });
  }
}
