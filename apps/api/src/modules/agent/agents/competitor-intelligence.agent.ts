import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SYSTEM_PROMPT = `You are GON's Competitor Intelligence Agent, an expert in competitive analysis and market positioning.

Your role is to analyze a set of competitors and identify actionable intelligence that gives the user a strategic advantage.

## Instructions
1. Analyze the provided competitor profiles
2. For each competitor, evaluate:
   - Content strategy (themes, formats, frequency)
   - Engagement patterns and what's working
   - Positioning and messaging differentiation
3. Identify gaps and opportunities
4. Produce concrete, ranked recommendations

## Output Format (JSON only)
{
  "competitors": [
    {
      "name": "Competitor name",
      "contentStrategy": "Brief description of their content approach",
      "topics": ["topic1", "topic2"],
      "strengths": ["strength1"],
      "weaknesses": ["weakness1"],
      "postingFrequency": "e.g., Daily, 3x/week",
      "avgEngagement": "e.g., High, Medium, Low"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Description of the gap or opportunity",
      "exploitStrategy": "How to take advantage",
      "expectedImpact": "Potential outcome",
      "effort": "low" | "medium" | "high",
      "priority": 1
    }
  ],
  "positioningAdvice": "One-paragraph recommendation on positioning and differentiation",
  "priorityActions": ["action1", "action2"]
}`;

@Injectable()
export class CompetitorIntelligenceAgent {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: {
      competitors?: { name: string; platform?: string; handle?: string }[];
      industry?: string;
    },
    context: { tenantId: string; userId: string; taskId: string },
  ) {
    const competitors = input.competitors || [];
    const industry = input.industry || (await this.inferIndustry(context.tenantId));

    const prompt = this.buildPrompt(competitors, industry);
    const result = await this.callLLM(prompt);
    const parsed = this.safeParseJSON(result, {
      competitors: competitors.map((c) => ({
        name: c.name,
        contentStrategy: 'Analysis pending',
        topics: [],
        strengths: [],
        weaknesses: [],
        postingFrequency: 'Unknown',
        avgEngagement: 'Unknown',
      })),
      opportunities: [
        {
          opportunity: 'Enable AI-powered competitor analysis',
          exploitStrategy: 'Set OPENAI_API_KEY and provide competitor data',
          expectedImpact: 'Data-driven competitive strategy',
          effort: 'low',
          priority: 1,
        },
      ],
      positioningAdvice: 'Configure OPENAI_API_KEY to receive positioning advice.',
      priorityActions: ['Set up LLM integration'],
    });

    await this.prisma.task.create({
      data: {
        tenantId: context.tenantId,
        assignedUserId: context.userId,
        agentType: 'COMPETITOR_INTELLIGENCE',
        title: 'Competitor Intelligence Analysis',
        description: JSON.stringify(parsed.opportunities?.slice(0, 3)),
        priority: 'high',
        status: 'COMPLETED',
      },
    });

    return parsed;
  }

  private async inferIndustry(tenantId: string): Promise<string> {
    const posts = await this.prisma.post.findMany({
      where: { tenantId, deletedAt: null },
      take: 10,
      select: { contentText: true },
    });
    if (posts.length === 0) return 'Unknown';
    const texts = posts.map((p) => p.contentText).filter(Boolean).join(' ');
    return texts.length > 50 ? texts.slice(0, 200) : 'Unknown';
  }

  private buildPrompt(competitors: { name: string; platform?: string; handle?: string }[], industry: string): string {
    const competitorList = competitors.length
      ? competitors.map((c) => `- ${c.name} (${c.platform || 'N/A'}, @${c.handle || 'N/A'})`).join('\n')
      : 'No specific competitors provided. Analyze likely competitors based on the industry context.';

    return `${SYSTEM_PROMPT}\n\n## Context\n- Industry: ${industry}\n- Competitors:\n${competitorList}\n\nAnalyze these competitors and identify actionable opportunities.`;
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
    if (!apiKey) {
      return JSON.stringify({
        competitors: [],
        opportunities: [
          {
            opportunity: 'Connect OpenAI for real competitive analysis',
            exploitStrategy: 'Set OPENAI_API_KEY in environment variables',
            expectedImpact: 'AI-powered competitor intelligence',
            effort: 'low',
            priority: 1,
          },
        ],
        positioningAdvice: 'Configure OPENAI_API_KEY to enable Competitor Intelligence Agent.',
        priorityActions: ['Set up LLM integration'],
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
        max_tokens: 2500,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
