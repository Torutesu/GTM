import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SYSTEM_PROMPT = `You are GON's Growth Strategy Agent, an expert marketing strategist.

Your role is to analyze the user's social media performance data and identify the highest-leverage growth opportunities.

## Instructions
1. Analyze the post performance data focusing on:
   - Which content types/topics drive the most engagement
   - Which days/times perform best
   - Current growth trajectory vs target
2. Identify 3-5 specific growth levers (the highest-impact changes they can make)
3. For each lever, suggest a concrete action with expected impact
4. Prioritize actions by effort-to-impact ratio

## Output Format (JSON only)
{
  "analysis": {
    "currentState": "Brief summary of current performance (1-2 sentences)",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "growthRate": "Current weekly follower/engagement growth rate"
  },
  "growthLevers": [
    {
      "lever": "Name of the lever",
      "rationale": "Why this works (data-backed)",
      "action": "Specific actionable recommendation",
      "expectedImpact": "Estimated improvement",
      "effort": "low" | "medium" | "high",
      "priority": 1
    }
  ],
  "summary": "One-paragraph strategic recommendation"
}`;

@Injectable()
export class GrowthStrategyAgent {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: { targetKpi?: Record<string, number>; brandTone?: string },
    context: { tenantId: string; userId: string; taskId: string },
  ) {
    const recentPosts = await this.prisma.post.findMany({
      where: { tenantId: context.tenantId, deletedAt: null, postedAt: { not: null } },
      orderBy: { postedAt: 'desc' },
      take: 30,
    });

    const user = await this.prisma.user.findUnique({ where: { id: context.userId } });
    const settings = user?.settings as Record<string, unknown> || {};
    const integrations = await this.prisma.integrationAccount.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
    });

    const postSummary = this.summarizePosts(recentPosts);
    const prompt = this.buildPrompt({
      postSummary,
      brandTone: (input.brandTone || settings.brandTone || 'professional') as string,
      kpiTargets: input.targetKpi || (settings.kpiTargets as Record<string, number>) || {},
      connectedPlatforms: integrations.map((i) => i.platform),
    });

    const result = await this.callLLM(prompt);
    const parsed = this.safeParseJSON(result, {
      analysis: {
        currentState: 'Analysis completed but JSON parsing failed.',
        strengths: [],
        weaknesses: [],
        growthRate: 'Unable to determine',
      },
      growthLevers: [
        {
          lever: 'Review raw analysis output',
          rationale: 'The AI output could not be parsed',
          action: 'Check the OpenAI response format',
          expectedImpact: 'Fixed analysis pipeline',
          effort: 'low',
          priority: 1,
        },
      ],
      summary: 'Analysis parsing error. Please try again.',
    });

    if (parsed.growthLevers) {
      for (const lever of parsed.growthLevers) {
        await this.prisma.task.create({
          data: {
            tenantId: context.tenantId,
            assignedUserId: context.userId,
            agentType: 'GROWTH_STRATEGY',
            title: lever.lever,
            description: `${lever.action}\n\nExpected impact: ${lever.expectedImpact}`,
            priority: lever.priority <= 2 ? 'high' : lever.priority <= 4 ? 'medium' : 'low',
            status: 'PENDING',
          },
        });
      }
    }

    return parsed;
  }

  private summarizePosts(posts: any[]): string {
    if (posts.length === 0) return 'No recent posts available.';
    const total = posts.length;
    const avgEngagement = posts.reduce((a, p) => {
      const m = p.engagementMetrics as Record<string, number> || {};
      return a + (m.engagementRate || 0);
    }, 0) / total;

    const last5 = posts.slice(0, 5).map(
      (p) => `"${(p.contentText || '').slice(0, 50)}"`,
    ).join(' | ');

    return `Total posts: ${total}\nAvg engagement: ${(avgEngagement * 100).toFixed(1)}%\nLast 5: ${last5}`;
  }

  private buildPrompt(context: {
    postSummary: string;
    brandTone: string;
    kpiTargets: Record<string, number>;
    connectedPlatforms: string[];
  }): string {
    return `${SYSTEM_PROMPT}\n\n## Context\n- Brand tone: ${context.brandTone}\n- Target KPIs: ${JSON.stringify(context.kpiTargets)}\n- Connected platforms: ${context.connectedPlatforms.join(', ')}\n- Recent posts (last 30):\n${context.postSummary}\n\nAnalyze my current performance and suggest growth levers.`;
  }

  private safeParseJSON(text: string, fallback: any): any {
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      console.warn('Failed to parse LLM JSON output, using fallback');
      return fallback;
    }
  }

  private async callLLM(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return JSON.stringify({
        analysis: {
          currentState: 'LLM not configured. Set OPENAI_API_KEY.',
          strengths: ['Demo mode'],
          weaknesses: ['No LLM connected'],
          growthRate: 'N/A',
        },
        growthLevers: [
          {
            lever: 'Connect OpenAI to get real analysis',
            rationale: 'GPT-4o-mini provides data-driven insights',
            action: 'Set OPENAI_API_KEY in environment variables',
            expectedImpact: 'Full AI-powered strategy',
            effort: 'low',
            priority: 1,
          },
        ],
        summary: 'Configure OPENAI_API_KEY to enable Growth Strategy Agent.',
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
