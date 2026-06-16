import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SYSTEM_PROMPT = `You are GON's CVR Optimization Agent, an expert in conversion rate optimization and marketing funnel analysis.

Your role is to analyze post and campaign performance data to identify conversion bottlenecks and recommend data-driven improvements.

## Instructions
1. Analyze recent posts and their engagement/conversion data
2. Map posts to funnel stages (awareness → interest → consideration → conversion)
3. Identify which stages have the biggest drop-off
4. Recommend specific improvements for each funnel stage
5. Suggest A/B test ideas with measurable hypotheses

## Output Format (JSON only)
{
  "funnelAnalysis": {
    "stages": [
      {
        "stage": "awareness" | "interest" | "consideration" | "conversion",
        "impressions": "Number or range",
        "engagement": "Number or range",
        "conversion": "Number or range",
        "dropOff": "Percentage or range",
        "status": "healthy" | "needs_improvement" | "critical"
      }
    ],
    "bottleneck": "The stage with the biggest drop-off and why"
  },
  "optimizationIdeas": [
    {
      "area": "What to optimize",
      "hypothesis": "If we change X, then Y will happen",
      "recommendedChange": "Specific change to make",
      "expectedImprovement": "Estimated impact",
      "effort": "low" | "medium" | "high",
      "confidence": "low" | "medium" | "high"
    }
  ],
  "contentGaps": [
    {
      "funnelStage": "Which stage is missing content",
      "gap": "What's missing",
      "contentSuggestion": "Type of content that fills the gap"
    }
  ],
  "abTestSuggestions": [
    {
      "testName": "Name of the test",
      "variant": "What to test",
      "metric": "Success metric",
      "duration": "Recommended test duration"
    }
  ],
  "summary": "One-paragraph optimization recommendation"
}`;

@Injectable()
export class CvrOptimizationAgent {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: {
      campaignId?: string;
      targetMetric?: string;
    },
    context: { tenantId: string; userId: string; taskId: string },
  ) {
    const posts = await this.prisma.post.findMany({
      where: {
        tenantId: context.tenantId,
        deletedAt: null,
        postedAt: { not: null },
      },
      orderBy: { postedAt: 'desc' },
      take: 30,
    });

    const campaign = input.campaignId
      ? await this.prisma.campaign.findUnique({ where: { id: input.campaignId } })
      : null;

    const tasks = await this.prisma.task.findMany({
      where: { tenantId: context.tenantId, deletedAt: null, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const prompt = this.buildPrompt(posts, campaign, tasks, input.targetMetric);
    const result = await this.callLLM(prompt);
    const parsed = this.safeParseJSON(result, this.fallback());

    for (const idea of parsed.optimizationIdeas || []) {
      if (idea.confidence === 'high') {
        await this.prisma.task.create({
          data: {
            tenantId: context.tenantId,
            assignedUserId: context.userId,
            agentType: 'CVR_OPTIMIZATION',
            title: `[CVR] ${idea.recommendedChange.slice(0, 80)}`,
            description: `Hypothesis: ${idea.hypothesis}\nExpected: ${idea.expectedImprovement}`,
            priority: 'medium',
            status: 'PENDING',
          },
        });
      }
    }

    return parsed;
  }

  private buildPrompt(
    posts: { contentText: string | null; engagementMetrics: any; platform: string; postedAt: Date | null }[],
    campaign: any | null,
    tasks: any[],
    targetMetric?: string,
  ): string {
    const postSummary = posts
      .map((p) => `[${p.platform}] "${(p.contentText || '').slice(0, 50)}" | metrics: ${JSON.stringify(p.engagementMetrics || {})}`)
      .join('\n');

    return `${SYSTEM_PROMPT}\n\n## Data
- Total posts analyzed: ${posts.length}
- Target metric: ${targetMetric || 'Overall conversion'}
- Campaign: ${campaign ? `${campaign.name} (${campaign.status})` : 'N/A'}
- Recent completed tasks: ${tasks.length}
- Post performance data:\n${postSummary || 'No performance data available'}

Analyze the conversion funnel and recommend optimizations.`;
  }

  private fallback() {
    return {
      funnelAnalysis: {
        stages: [
          { stage: 'awareness', impressions: 'N/A', engagement: 'N/A', conversion: 'N/A', dropOff: 'N/A', status: 'needs_improvement' },
          { stage: 'interest', impressions: 'N/A', engagement: 'N/A', conversion: 'N/A', dropOff: 'N/A', status: 'needs_improvement' },
          { stage: 'consideration', impressions: 'N/A', engagement: 'N/A', conversion: 'N/A', dropOff: 'N/A', status: 'needs_improvement' },
          { stage: 'conversion', impressions: 'N/A', engagement: 'N/A', conversion: 'N/A', dropOff: 'N/A', status: 'needs_improvement' },
        ],
        bottleneck: 'Enable OPENAI_API_KEY and post consistently to get funnel analysis',
      },
      optimizationIdeas: [
        { area: 'Data collection', hypothesis: 'If we collect more engagement data, we can identify bottlenecks', recommendedChange: 'Post regularly and track metrics', expectedImprovement: 'Actionable funnel insights', effort: 'low', confidence: 'high' },
      ],
      contentGaps: [],
      abTestSuggestions: [],
      summary: 'Configure OPENAI_API_KEY to enable CVR Optimization Agent.',
    };
  }

  private safeParseJSON(text: string, fallback: any): any {
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return fallback;
    }
  }

  private async callLLM(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return JSON.stringify(this.fallback());

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
