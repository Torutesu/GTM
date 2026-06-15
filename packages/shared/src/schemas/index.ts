import { z } from 'zod';

export const GrowthStrategyOutputSchema = z.object({
  analysis: z.object({
    currentState: z.string().max(500),
    strengths: z.array(z.string()).max(10),
    weaknesses: z.array(z.string()).max(10),
    growthRate: z.string(),
  }),
  growthLevers: z
    .array(
      z.object({
        lever: z.string().max(200),
        rationale: z.string().max(500),
        action: z.string().max(500),
        expectedImpact: z.string().max(200),
        effort: z.enum(['low', 'medium', 'high']),
        priority: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(10),
  summary: z.string().max(1000),
});

export const SocialMediaOutputSchema = z.object({
  weeklyPlan: z
    .array(
      z.object({
        day: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string(),
        contentType: z.enum([
          'educational',
          'engagement',
          'social_proof',
          'personality',
          'promotional',
        ]),
        goal: z.enum(['Awareness', 'Engagement', 'Conversion', 'Authority']),
        text: z.string().max(500),
        hashtags: z.array(z.string()).max(5),
        cta: z.string().optional(),
      }),
    )
    .min(1)
    .max(28),
  contentMix: z.record(z.number().int().min(0).max(100)),
  notes: z.string().max(1000).optional(),
});
