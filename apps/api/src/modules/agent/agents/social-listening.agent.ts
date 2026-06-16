import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SYSTEM_PROMPT = `You are GON's Social Listening Agent, an expert in social media monitoring and trend analysis.

Your role is to analyze social media conversations, identify emerging trends, and provide actionable sentiment insights.

## Instructions
1. Analyze the provided posts and engagement data
2. Identify conversation patterns and trending topics
3. Assess overall sentiment toward the brand and key topics
4. Detect potential crises or reputational risks early
5. Recommend engagement strategies based on listening insights

## Output Format (JSON only)
{
  "trends": [
    {
      "topic": "Trending topic name",
      "momentum": "rising" | "stable" | "declining",
      "volume": "high" | "medium" | "low",
      "sentiment": "positive" | "negative" | "neutral" | "mixed",
      "keyDrivers": ["driver1", "driver2"],
      "recommendedAction": "What to do about this trend"
    }
  ],
  "sentimentOverview": {
    "overall": "positive" | "negative" | "neutral",
    "score": 0-100,
    "shiftFromLastPeriod": "improving" | "declining" | "stable",
    "topPositiveTopics": ["topic1"],
    "topNegativeTopics": ["topic2"]
  },
  "risks": [
    {
      "risk": "Description of potential risk",
      "severity": "low" | "medium" | "high" | "critical",
      "signal": "What triggered this alert",
      "recommendedResponse": "How to address"
    }
  ],
  "recommendations": [
    {
      "action": "Specific action",
      "rationale": "Why this matters",
      "priority": 1
    }
  ]
}`;

@Injectable()
export class SocialListeningAgent {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: {
      keywords?: string[];
      platforms?: string[];
      timeframe?: string;
    },
    context: { tenantId: string; userId: string; taskId: string },
  ) {
    const recentPosts = await this.prisma.post.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { contentText: true, platform: true, engagementMetrics: true },
    });

    const feedEvents = await this.prisma.feedEvent.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const prompt = this.buildPrompt(
      input.keywords || [],
      input.platforms || [],
      input.timeframe || '7d',
      recentPosts,
      feedEvents,
    );

    const result = await this.callLLM(prompt);
    const parsed = this.safeParseJSON(result, this.fallback());

    for (const risk of parsed.risks || []) {
      if (risk.severity === 'high' || risk.severity === 'critical') {
        await this.prisma.task.create({
          data: {
            tenantId: context.tenantId,
            assignedUserId: context.userId,
            agentType: 'SOCIAL_LISTENING',
            title: `[${risk.severity.toUpperCase()}] ${risk.risk}`,
            description: `Signal: ${risk.signal}\nRecommended: ${risk.recommendedResponse}`,
            priority: risk.severity === 'critical' ? 'high' : 'medium',
            status: 'PENDING',
          },
        });
      }
    }

    return parsed;
  }

  private buildPrompt(
    keywords: string[],
    platforms: string[],
    timeframe: string,
    posts: { contentText: string | null; platform: string; engagementMetrics: any }[],
    feedEvents: any[],
  ): string {
    const postSummary = posts
      .map((p) => `[${p.platform}] "${(p.contentText || '').slice(0, 80)}"`)
      .join('\n');
    const feedSummary = feedEvents
      .map((e) => `[${e.type}] ${e.title}`)
      .join('\n');

    return `${SYSTEM_PROMPT}\n\n## Context
- Keywords: ${keywords.join(', ') || 'N/A'}
- Platforms: ${platforms.join(', ') || 'All connected'}
- Timeframe: ${timeframe}
- Recent posts:\n${postSummary || 'No recent posts'}
- Feed events:\n${feedSummary || 'No recent events'}

Analyze the social listening data and provide insights.`;
  }

  private fallback() {
    return {
      trends: [
        {
          topic: 'Platform activity detected',
          momentum: 'stable',
          volume: 'low',
          sentiment: 'neutral',
          keyDrivers: ['Limited data available'],
          recommendedAction: 'Connect more social accounts and post regularly to enable trend detection',
        },
      ],
      sentimentOverview: {
        overall: 'neutral',
        score: 50,
        shiftFromLastPeriod: 'stable',
        topPositiveTopics: [],
        topNegativeTopics: [],
      },
      risks: [],
      recommendations: [
        { action: 'Enable OPENAI_API_KEY for AI-powered analysis', rationale: 'LLM provides deeper insights', priority: 1 },
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
