import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SYSTEM_PROMPT = `You are GON's Industry News Agent, an expert in monitoring and analyzing industry news and market developments.

Your role is to track news relevant to the user's industry, summarize key developments, and identify strategic implications.

## Instructions
1. Analyze the provided industry context and recent activity
2. Identify key developments, announcements, and shifts
3. Assess the potential impact on the user's business
4. Recommend actions to capitalize on opportunities or mitigate risks
5. Flag competitor moves and market signals

## Output Format (JSON only)
{
  "headlines": [
    {
      "topic": "News headline",
      "category": "market" | "competitive" | "regulatory" | "technology" | "trend",
      "relevanceScore": 0-100,
      "implication": "What this means for the user",
      "suggestedResponse": "Action to take"
    }
  ],
  "marketShifts": [
    {
      "shift": "Description of the shift",
      "direction": "positive" | "negative" | "neutral",
      "timeframe": "short-term" | "medium-term" | "long-term",
      "actionRequired": "Yes" | "No" | "Monitor"
    }
  ],
  "strategicBrief": "One-paragraph strategic brief summarizing the news landscape and recommended focus areas",
  "priorityActions": [
    {
      "action": "Action description",
      "deadline": "immediate" | "this-week" | "this-month" | "this-quarter",
      "impact": "high" | "medium" | "low"
    }
  ]
}`;

@Injectable()
export class IndustryNewsAgent {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: {
      industry?: string;
      topics?: string[];
      market?: string;
    },
    context: { tenantId: string; userId: string; taskId: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: context.userId } });
    const settings = user?.settings as Record<string, unknown> || {};
    const industry = input.industry || (settings.industry as string) || await this.inferIndustry(context.tenantId);

    const recentPosts = await this.prisma.post.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { contentText: true },
    });

    const prompt = this.buildPrompt(
      industry,
      input.topics || [],
      input.market || 'global',
      recentPosts.map((p) => p.contentText).filter(Boolean),
    );

    const result = await this.callLLM(prompt);
    const parsed = this.safeParseJSON(result, this.fallback(industry));

    for (const action of parsed.priorityActions || []) {
      if (action.impact === 'high') {
        await this.prisma.task.create({
          data: {
            tenantId: context.tenantId,
            assignedUserId: context.userId,
            agentType: 'INDUSTRY_NEWS',
            title: action.action,
            priority: action.deadline === 'immediate' ? 'high' : 'medium',
            status: 'PENDING',
          },
        });
      }
    }

    return parsed;
  }

  private async inferIndustry(tenantId: string): Promise<string> {
    const posts = await this.prisma.post.findMany({
      where: { tenantId, deletedAt: null },
      take: 10,
      select: { contentText: true },
    });
    const texts = posts.map((p) => p.contentText).filter(Boolean).join(' ');
    return texts.length > 30 ? texts.slice(0, 200) : 'Technology';
  }

  private buildPrompt(
    industry: string,
    topics: string[],
    market: string,
    recentContent: string[],
  ): string {
    return `${SYSTEM_PROMPT}\n\n## Context
- Industry: ${industry}
- Focus topics: ${topics.join(', ') || 'General industry coverage'}
- Market: ${market}
- Recent content:\n${recentContent.map((t) => `  - "${t.slice(0, 80)}"`).join('\n') || 'No recent content'}

Analyze the current news landscape and provide strategic insights.`;
  }

  private fallback(industry: string) {
    return {
      headlines: [
        {
          topic: `${industry} industry monitoring active`,
          category: 'trend',
          relevanceScore: 60,
          implication: 'Connect OpenAI API key for real industry news analysis',
          suggestedResponse: 'Set OPENAI_API_KEY to enable AI-powered news monitoring',
        },
      ],
      marketShifts: [
        { shift: 'AI adoption accelerating across industries', direction: 'positive', timeframe: 'long-term', actionRequired: 'Monitor' },
      ],
      strategicBrief: `Configure OPENAI_API_KEY to enable Industry News Agent for ${industry}.`,
      priorityActions: [
        { action: 'Enable LLM integration for news analysis', deadline: 'this-week', impact: 'high' },
      ],
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
    if (!apiKey) return JSON.stringify(this.fallback('Your'));

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
