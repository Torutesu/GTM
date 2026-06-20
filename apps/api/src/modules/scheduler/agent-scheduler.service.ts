import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';

interface AgentSchedule {
  agentType: string;
  cron: string;
  defaultInput: Record<string, unknown>;
  description: string;
}

const SCHEDULES: AgentSchedule[] = [
  { agentType: 'INDUSTRY_NEWS', cron: '0 8 * * 1-5', defaultInput: { topic: 'latest marketing trends' }, description: 'Daily industry news digest (weekdays 8am)' },
  { agentType: 'SOCIAL_LISTENING', cron: '0 */4 * * *', defaultInput: { keywords: ['brand mentions', 'competitor'], maxResults: 50 }, description: 'Social listening every 4 hours' },
  { agentType: 'COMPETITOR_INTELLIGENCE', cron: '0 9 * * 1', defaultInput: { competitors: [], depth: 'standard' }, description: 'Weekly competitor analysis (Monday 9am)' },
  { agentType: 'SEO_GEO', cron: '0 10 1 * *', defaultInput: { targetMarkets: ['US', 'JP'], focus: 'organic growth' }, description: 'Monthly SEO/GEO audit (1st of month 10am)' },
  { agentType: 'GROWTH_STRATEGY', cron: '0 7 * * 1', defaultInput: { timeframe: 'weekly', focus: 'growth opportunities' }, description: 'Weekly growth strategy (Monday 7am)' },
];

@Injectable()
export class AgentSchedulerService {
  private readonly logger = new Logger(AgentSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
  ) {}

  @Cron('0 6 * * 1-5')
  async runIndustryNews() {
    await this.runScheduledAgent('INDUSTRY_NEWS');
  }

  @Cron('0 */4 * * *')
  async runSocialListening() {
    await this.runScheduledAgent('SOCIAL_LISTENING');
  }

  @Cron('0 9 * * 1')
  async runCompetitorIntel() {
    await this.runScheduledAgent('COMPETITOR_INTELLIGENCE');
  }

  @Cron('0 10 1 * *')
  async runSeoGeo() {
    await this.runScheduledAgent('SEO_GEO');
  }

  @Cron('0 7 * * 1')
  async runGrowthStrategy() {
    await this.runScheduledAgent('GROWTH_STRATEGY');
  }

  private async runScheduledAgent(agentType: string) {
    const schedule = SCHEDULES.find((s) => s.agentType === agentType);
    if (!schedule) return;

    this.logger.log(`Running scheduled agent: ${agentType}`);

    const tenants = await this.prisma.tenant.findMany({ where: { deletedAt: null } });

    for (const tenant of tenants) {
      try {
        const result = await this.agentService.execute(
          tenant.id, '', agentType, schedule.defaultInput,
        );
        this.logger.log(`Agent ${agentType} completed for tenant ${tenant.id}: task ${result.taskId}`);

        await this.prisma.feedEvent.create({
          data: {
            tenantId: tenant.id,
            type: 'agent_completed',
            category: 'agent',
            title: `Scheduled: ${schedule.description}`,
            metadata: { agentType, taskId: result.taskId },
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: any) {
        this.logger.error(`Scheduled agent ${agentType} failed for tenant ${tenant.id}: ${err.message}`);
      }
    }
  }

  getSchedules() {
    return SCHEDULES;
  }
}
