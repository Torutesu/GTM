import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SYSTEM_PROMPT = `You are GON's Outreach Agent, an expert in partnership development, influencer marketing, and strategic outreach.

Your role is to identify outreach opportunities, craft messaging strategies, and manage partnership pipelines.

## Instructions
1. Analyze brand positioning and content themes from recent posts
2. Identify potential outreach targets (influencers, partners, media)
3. For each target, define the value proposition and approach
4. Draft outreach messaging templates
5. Prioritize targets by potential impact and alignment

## Output Format (JSON only)
{
  "outreachPlan": [
    {
      "targetType": "influencer" | "partner" | "media" | "expert",
      "name": "Target name or description",
      "rationale": "Why this target is valuable",
      "approach": "outbound" | "warm_intro" | "mutual_benefit",
      "valueProposition": "What we offer them",
      "ask": "What we want from them",
      "priority": 1
    }
  ],
  "messagingStrategy": {
    "tone": "Description of recommended tone",
    "keyAngles": ["angle1", "angle2"],
    "template_intro": "Draft introduction message",
    "template_followUp": "Draft follow-up message"
  },
  "pipelinePriorities": [
    {
      "action": "Next step to take",
      "timeline": "immediate" | "this-week" | "this-month",
      "expectedOutcome": "What success looks like"
    }
  ],
  "summary": "One-paragraph outreach strategy summary"
}`;

@Injectable()
export class OutreachAgent {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: {
      goal?: string;
      targets?: { type: string; name: string }[];
      brandTone?: string;
    },
    context: { tenantId: string; userId: string; taskId: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: context.userId } });
    const settings = user?.settings as Record<string, unknown> || {};

    const recentPosts = await this.prisma.post.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { contentText: true, platform: true },
    });

    const integrations = await this.prisma.integrationAccount.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
    });

    const prompt = this.buildPrompt(
      input.goal || (settings.outreachGoal as string) || 'brand_awareness',
      input.targets || [],
      input.brandTone || (settings.brandTone as string) || 'professional',
      recentPosts,
      integrations.map((i) => `${i.platform} (@${i.platformUserName})`),
    );

    const result = await this.callLLM(prompt);
    const parsed = this.safeParseJSON(result, this.fallback());

    for (const item of parsed.pipelinePriorities || []) {
      if (item.timeline === 'immediate') {
        await this.prisma.task.create({
          data: {
            tenantId: context.tenantId,
            assignedUserId: context.userId,
            agentType: 'OUTREACH',
            title: item.action,
            description: `Expected: ${item.expectedOutcome}`,
            priority: 'high',
            status: 'PENDING',
          },
        });
      }
    }

    return parsed;
  }

  private buildPrompt(
    goal: string,
    targets: { type: string; name: string }[],
    brandTone: string,
    posts: { contentText: string | null; platform: string }[],
    connectedAccounts: string[],
  ): string {
    const targetList = targets.length
      ? targets.map((t) => `  - ${t.type}: ${t.name}`).join('\n')
      : '  No specific targets provided. Suggest targets based on brand context.';

    return `${SYSTEM_PROMPT}\n\n## Context
- Outreach goal: ${goal}
- Brand tone: ${brandTone}
- Connected accounts: ${connectedAccounts.join(', ') || 'None'}
- Recent content:\n${posts.map((p) => `  [${p.platform}] "${(p.contentText || '').slice(0, 60)}"`).join('\n')}
- Potential targets:\n${targetList}

Develop an outreach strategy.`;
  }

  private fallback() {
    return {
      outreachPlan: [
        {
          targetType: 'influencer',
          name: 'Industry micro-influencers',
          rationale: 'High engagement, niche audience alignment',
          approach: 'warm_intro',
          valueProposition: 'Early access to product / exclusive content',
          ask: 'Authentic content collaboration',
          priority: 1,
        },
      ],
      messagingStrategy: {
        tone: 'Professional yet approachable',
        keyAngles: ['Mutual value creation', 'Shared audience interests'],
        template_intro: 'Set OPENAI_API_KEY for AI-generated outreach templates',
        template_followUp: 'Set OPENAI_API_KEY for AI-generated follow-ups',
      },
      pipelinePriorities: [
        { action: 'Enable OpenAI integration for outreach strategy', timeline: 'this-week', expectedOutcome: 'Full AI-powered outreach' },
      ],
      summary: 'Configure OPENAI_API_KEY to enable Outreach Agent.',
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
        temperature: 0.5,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${await response.text()}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
