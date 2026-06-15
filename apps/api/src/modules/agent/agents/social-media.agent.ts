import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SYSTEM_PROMPT = `You are GON's Social Media Agent, an expert social media content strategist and copywriter.

Your role is to create a weekly content calendar with platform-specific posts based on the growth strategy.

## Instructions
1. Create a weekly content plan with {postFrequency} posts
2. Each post should:
   - Align with the growth strategy
   - Be platform-appropriate
   - Have a clear goal (awareness, engagement, conversion, authority)
   - Include relevant hashtags (2-3)
3. Distribute posts across different content types:
   - Educational / Tips
   - Engagement / Questions
   - Social Proof / Case Studies
   - Personality / Behind-the-scenes
   - Promotional (max 20%)
4. Avoid prohibited content and the NG keywords

## Output Format (JSON only)
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "contentType": "educational" | "engagement" | "social_proof" | "personality" | "promotional",
      "goal": "Awareness" | "Engagement" | "Conversion" | "Authority",
      "text": "Full post text",
      "hashtags": ["tag1", "tag2"],
      "cta": "Call to action"
    }
  ],
  "contentMix": {
    "educational": 30,
    "engagement": 25,
    "social_proof": 20,
    "personality": 15,
    "promotional": 10
  },
  "notes": "Strategic notes"
}`;

@Injectable()
export class SocialMediaAgent {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: {
      strategy?: Record<string, unknown>;
      platform?: string;
      frequency?: number;
      brandTone?: string;
      ngKeywords?: string[];
    },
    context: { tenantId: string; userId: string; taskId: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: context.userId } });
    const settings = user?.settings as Record<string, unknown> || {};
    const integrations = await this.prisma.integrationAccount.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
    });

    const topPosts = await this.prisma.post.findMany({
      where: { tenantId: context.tenantId, deletedAt: null, postedAt: { not: null } },
      orderBy: { postedAt: 'desc' },
      take: 5,
    });

    const prompt = this.buildPrompt({
      strategy: input.strategy || {},
      platform: input.platform || integrations[0]?.platform || 'X',
      frequency: input.frequency || (settings.postFrequency as number) || 5,
      brandTone: input.brandTone || (settings.brandTone as string) || 'professional',
      ngKeywords: input.ngKeywords || (settings.ngKeywords as string[]) || [],
      topPosts: topPosts.map((p) => p.contentText).filter(Boolean),
    });

    const result = await this.callLLM(prompt);
    const parsed = JSON.parse(result);

    if (parsed.weeklyPlan) {
      for (const slot of parsed.weeklyPlan) {
        await this.prisma.post.create({
          data: {
            tenantId: context.tenantId,
            integrationAccountId: integrations[0]?.id || null,
            platform: (input.platform?.toUpperCase() || integrations[0]?.platform || 'X') as any,
            contentText: slot.text,
            mediaUrls: [],
            status: 'DRAFT',
            isAiGenerated: true,
          },
        });
      }
    }

    return parsed;
  }

  private buildPrompt(context: {
    strategy: Record<string, unknown>;
    platform: string;
    frequency: number;
    brandTone: string;
    ngKeywords: string[];
    topPosts: string[];
  }): string {
    const systemWithFreq = SYSTEM_PROMPT.replace('{postFrequency}', String(context.frequency));

    return `${systemWithFreq}\n\n## Context\n- Brand tone: ${context.brandTone}\n- Platform: ${context.platform}\n- Strategy context: ${JSON.stringify(context.strategy)}\n- NG keywords: ${context.ngKeywords.join(', ')}\n- Recent top posts:\n${context.topPosts.map((t) => `  - "${t.slice(0, 80)}"`).join('\n')}\n\nCreate a weekly content plan for next week.`;
  }

  private async callLLM(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return JSON.stringify({
        weeklyPlan: [
          {
            day: 'Monday',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: '09:00',
            contentType: 'educational',
            goal: 'Awareness',
            text: 'Configure OPENAI_API_KEY to enable AI-powered content generation.',
            hashtags: ['#GON', '#AIMarketing'],
            cta: 'Set up your API key to get started',
          },
        ],
        contentMix: { educational: 100 },
        notes: 'Demo mode: Set OPENAI_API_KEY for real content generation.',
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
        temperature: 0.7,
        max_tokens: 3000,
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
