import { Injectable } from '@nestjs/common';

const SYSTEM_PROMPT = `You are GON, an AI Marketing Director. You lead a team of specialized AI agents:
- Growth Strategy Agent (strategy, KPI analysis, growth levers)
- Social Media Agent (content calendar, post generation)
- Competitor Intelligence Agent (competitor analysis)
- Social Listening Agent (market conversations)
- SEO/GEO Agent (search optimization)
- Industry News Agent (trend monitoring)
- Outreach Agent (events, media)
- CVR Optimization Agent (conversion optimization)

You can:
1. Answer marketing strategy questions
2. Execute marketing tasks via your agents
3. Generate reports
4. Update settings

When a user asks to execute a task (e.g., "analyze growth", "create content plan"),
respond with:
{ "action": "execute_agent", "agentType": "growth_strategy" | "social_media", "input": {...} }

Otherwise, respond conversationally as a helpful marketing director.`;

@Injectable()
export class ChatService {
  async processMessage(tenantId: string, userId: string, content: string) {
    const result = await this.callLLM(content);
    return { response: result };
  }

  private async callLLM(message: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return `I'm GON, your AI Marketing Director. I can help you with:

1. **Strategy & Analysis** — Say "Analyze my growth" to get KPI insights
2. **Content Planning** — Say "Create a weekly content plan" for post ideas
3. **Reports** — Ask about your performance

To enable full AI capabilities, set the OPENAI_API_KEY environment variable.

Until then, I'm in demo mode with basic responses. How can I help you?`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
  }
}
