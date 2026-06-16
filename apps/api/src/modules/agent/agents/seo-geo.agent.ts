import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SYSTEM_PROMPT = `You are GON's SEO/GEO Agent, an expert in search engine optimization and Generative Engine Optimization (GEO).

Your role is to optimize content for both traditional search engines AND AI-powered answer engines (ChatGPT, Perplexity, Gemini, etc.).

## Instructions
### SEO Analysis
1. Analyze content for keyword optimization, structure, readability
2. Identify missing semantic signals and topical depth
3. Suggest technical SEO improvements

### GEO Analysis (AI Answer Engine Optimization)
1. Assess whether content would be cited by AI answer engines
2. Evaluate authority signals, citation-worthiness, structured data
3. Suggest improvements for AI-friendly content (clear answers, concise summaries, authoritative sources)

### Content Recommendations
- Primary keywords to target
- Long-tail opportunities
- Question-based content that answers "people also ask" queries
- Schema/structured data recommendations

## Output Format (JSON only)
{
  "seoAnalysis": {
    "overallScore": 0-100,
    "keywordCoverage": {
      "primary": "Current primary keyword status",
      "missing": ["keyword1", "keyword2"],
      "opportunities": ["opportunity1"]
    },
    "technicalIssues": ["issue1"],
    "readabilityScore": "e.g., Good, Needs Improvement"
  },
  "geoAnalysis": {
    "aiAnswerCompatibility": 0-100,
    "citationFactors": ["factor1"],
    "recommendations": ["recommendation1"]
  },
  "contentRecommendations": [
    {
      "type": "seo" | "geo" | "both",
      "recommendation": "Description",
      "expectedImpact": "Potential outcome",
      "priority": 1
    }
  ],
  "summary": "One-paragraph overall recommendation"
}`;

@Injectable()
export class SeoGeoAgent {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: {
      content?: string;
      targetKeywords?: string[];
      platform?: string;
    },
    context: { tenantId: string; userId: string; taskId: string },
  ) {
    const recentPosts = await this.prisma.post.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { contentText: true, platform: true },
    });

    const contentToAnalyze = input.content || recentPosts.map((p) => p.contentText).filter(Boolean).join('\n\n');
    const keywords = input.targetKeywords || [];

    const prompt = this.buildPrompt(contentToAnalyze, keywords, input.platform || 'X');
    const result = await this.callLLM(prompt);
    const parsed = this.safeParseJSON(result, {
      seoAnalysis: {
        overallScore: 50,
        keywordCoverage: { primary: 'Analysis pending', missing: [], opportunities: [] },
        technicalIssues: [],
        readabilityScore: 'Unknown',
      },
      geoAnalysis: {
        aiAnswerCompatibility: 50,
        citationFactors: [],
        recommendations: [],
      },
      contentRecommendations: [
        {
          type: 'both',
          recommendation: 'Enable AI analysis by setting OPENAI_API_KEY',
          expectedImpact: 'Full SEO/GEO optimization',
          priority: 1,
        },
      ],
      summary: 'Configure OPENAI_API_KEY to enable SEO/GEO Agent.',
    });

    await this.prisma.generationLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        providerId: 'openai',
        agentName: 'SEO_GEO',
      },
    });

    return parsed;
  }

  private buildPrompt(content: string, keywords: string[], platform: string): string {
    return `${SYSTEM_PROMPT}\n\n## Content to Analyze\n${content.slice(0, 2000)}\n\n## Context\n${
      keywords.length ? `- Target keywords: ${keywords.join(', ')}\n` : ''
    }- Platform: ${platform}\n\nAnalyze the content and provide SEO/GEO optimization recommendations.`;
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
        seoAnalysis: {
          overallScore: 60,
          keywordCoverage: { primary: 'Demo mode', missing: [], opportunities: ['Set OPENAI_API_KEY'] },
          technicalIssues: [],
          readabilityScore: 'Good',
        },
        geoAnalysis: {
          aiAnswerCompatibility: 50,
          citationFactors: ['No LLM connected'],
          recommendations: ['Set OPENAI_API_KEY to enable GEO analysis'],
        },
        contentRecommendations: [
          { type: 'both', recommendation: 'Set OPENAI_API_KEY environment variable', expectedImpact: 'Full AI-powered SEO/GEO analysis', priority: 1 },
        ],
        summary: 'Configure OPENAI_API_KEY to enable SEO/GEO Agent.',
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
