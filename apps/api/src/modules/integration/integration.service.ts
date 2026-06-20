import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { XConnector } from './connectors/x.connector';
import { InstagramConnector } from './connectors/instagram.connector';
import { TikTokConnector } from './connectors/tiktok.connector';
import { YouTubeConnector } from './connectors/youtube.connector';
import { LinkedInConnector } from './connectors/linkedin.connector';
import { ThreadsConnector } from './connectors/threads.connector';

@Injectable()
export class IntegrationService {
  private stateStore = new Map<string, { tenantId: string; userId: string; platform: string; codeVerifier?: string }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly xConnector: XConnector,
    private readonly instagramConnector: InstagramConnector,
    private readonly tiktokConnector: TikTokConnector,
    private readonly youtubeConnector: YouTubeConnector,
    private readonly linkedinConnector: LinkedInConnector,
    private readonly threadsConnector: ThreadsConnector,
  ) {}

  async findByTenant(tenantId: string) {
    return this.prisma.integrationAccount.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        platformUserName: true,
        status: true,
        lastSyncedAt: true,
        connectedAt: true,
        tokenExpiresAt: true,
      },
    });
  }

  async findById(id: string) {
    const account = await this.prisma.integrationAccount.findUnique({ where: { id } });
    if (!account || account.deletedAt) throw new NotFoundException('Integration not found');
    return account;
  }

  private getConnector(platform: string) {
    switch (platform) {
      case 'X': return this.xConnector;
      case 'INSTAGRAM': return this.instagramConnector;
      case 'TIKTOK': return this.tiktokConnector;
      case 'YOUTUBE': return this.youtubeConnector;
      case 'LINKEDIN': return this.linkedinConnector;
      case 'THREADS': return this.threadsConnector;
      default: return null;
    }
  }

  getRequiredEnv(platform: string): { clientId: string; clientSecret: string } | null {
    switch (platform) {
      case 'X': return { clientId: process.env.X_CLIENT_ID || '', clientSecret: process.env.X_CLIENT_SECRET || '' };
      case 'INSTAGRAM': return { clientId: process.env.INSTAGRAM_CLIENT_ID || '', clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '' };
      case 'TIKTOK': return { clientId: process.env.TIKTOK_CLIENT_ID || '', clientSecret: process.env.TIKTOK_CLIENT_SECRET || '' };
      case 'YOUTUBE': return { clientId: process.env.YOUTUBE_CLIENT_ID || '', clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '' };
      case 'LINKEDIN': return { clientId: process.env.LINKEDIN_CLIENT_ID || '', clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '' };
      case 'THREADS': return { clientId: process.env.THREADS_CLIENT_ID || '', clientSecret: process.env.THREADS_CLIENT_SECRET || '' };
      default: return null;
    }
  }

  async getAuthUrl(tenantId: string, userId: string, platform: string, redirectUri: string) {
    const connector = this.getConnector(platform);
    if (!connector) throw new BadRequestException(`Unsupported platform: ${platform}`);

    const env = this.getRequiredEnv(platform);
    if (!env?.clientId || !env?.clientSecret) {
      throw new BadRequestException(
        `${platform} API keys not configured. Set ${platform}_CLIENT_ID and ${platform}_CLIENT_SECRET in .env`,
      );
    }

    const raw = crypto.randomUUID();
    const state = `${platform}:${raw}`;
    const authUrl = connector.getAuthUrl(state, redirectUri);

    const connectorAny = connector as any;
    const codeVerifier = connectorAny.pkceStore?.get(state)?.codeVerifier;
    this.stateStore.set(state, { tenantId, userId, platform, codeVerifier });
    this.clearStateAfter(state, 10 * 60 * 1000);

    return { authUrl, state };
  }

  async handleCallback(tenantId: string, platform: string, code: string, state: string) {
    const stored = this.stateStore.get(state);
    if (!stored) throw new BadRequestException('Invalid or expired state');
    this.stateStore.delete(state);

    const connector = this.getConnector(platform);
    if (!connector) throw new BadRequestException(`Unsupported platform: ${platform}`);

    let tokens: { accessToken: string; refreshToken: string; platformUserId: string; platformUserName: string; scope: string[] };

    if (platform === 'X') {
      tokens = await this.xConnector.handleCallback(code, stored.codeVerifier || '');
    } else if (platform === 'INSTAGRAM') {
      tokens = await this.instagramConnector.handleCallback(code);
    } else {
      tokens = await (connector as any).handleCallback(code);
    }

    const existing = await this.prisma.integrationAccount.findFirst({
      where: {
        tenantId: stored.tenantId,
        platform: platform as any,
        platformUserId: tokens.platformUserId,
        deletedAt: null,
      },
    });

    if (existing) {
      return this.prisma.integrationAccount.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          status: 'ACTIVE',
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return this.prisma.integrationAccount.create({
      data: {
        tenantId: stored.tenantId,
        userId: stored.userId,
        platform: platform as any,
        platformUserId: tokens.platformUserId,
        platformUserName: tokens.platformUserName,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        scope: tokens.scope,
        status: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async disconnect(id: string) {
    await this.findById(id);
    await this.prisma.integrationAccount.update({
      where: { id },
      data: { status: 'REVOKED', deletedAt: new Date() },
    });
  }

  async sync(id: string) {
    const account = await this.findById(id);
    return { message: `Sync queued for ${account.platform}`, accountId: id };
  }

  getPlatformStatus() {
    return {
      X: { configured: !!process.env.X_CLIENT_ID && !!process.env.X_CLIENT_SECRET, demoAvailable: true },
      INSTAGRAM: { configured: !!process.env.INSTAGRAM_CLIENT_ID && !!process.env.INSTAGRAM_CLIENT_SECRET, demoAvailable: true },
      TIKTOK: { configured: !!process.env.TIKTOK_CLIENT_ID && !!process.env.TIKTOK_CLIENT_SECRET, demoAvailable: true },
      YOUTUBE: { configured: !!process.env.YOUTUBE_CLIENT_ID && !!process.env.YOUTUBE_CLIENT_SECRET, demoAvailable: true },
      LINKEDIN: { configured: !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET, demoAvailable: true },
      THREADS: { configured: !!process.env.THREADS_CLIENT_ID && !!process.env.THREADS_CLIENT_SECRET, demoAvailable: true },
    };
  }

  async createDemoConnection(tenantId: string, userId: string, platform: string) {
    const existing = await this.prisma.integrationAccount.findFirst({
      where: { tenantId, platform: platform as any, deletedAt: null },
    });
    if (existing) return existing;

    return this.prisma.integrationAccount.create({
      data: {
        tenantId, userId,
        platform: platform as any,
        platformUserId: `demo_${platform.toLowerCase()}`,
        platformUserName: `Demo ${platform}`,
        accessToken: 'demo_token',
        refreshToken: 'demo_refresh',
        scope: ['read', 'write'],
        status: 'ACTIVE',
        tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private clearStateAfter(state: string, ms: number) {
    setTimeout(() => this.stateStore.delete(state), ms);
  }
}
