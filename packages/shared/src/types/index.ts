export enum Platform {
  X = 'X',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export enum AgentType {
  GROWTH_STRATEGY = 'GROWTH_STRATEGY',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  COMPETITOR_INTELLIGENCE = 'COMPETITOR_INTELLIGENCE',
  SOCIAL_LISTENING = 'SOCIAL_LISTENING',
  SEO_GEO = 'SEO_GEO',
  INDUSTRY_NEWS = 'INDUSTRY_NEWS',
  OUTREACH = 'OUTREACH',
  CVR_OPTIMIZATION = 'CVR_OPTIMIZATION',
}

export interface UserSettings {
  brandTone: string;
  postFrequency: number;
  ngKeywords: string[];
  kpiTargets: Record<string, number>;
}

export interface AgentInput {
  tenantId: string;
  userId: string;
  campaignId?: string;
  data: Record<string, unknown>;
}

export interface AgentOutput {
  type: 'strategy' | 'task' | 'draft' | 'report';
  content: string | Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
