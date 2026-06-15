import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { XConnector } from './connectors/x.connector';

@Injectable()
export class IntegrationService {
  private stateStore = new Map<string, { tenantId: string; userId: string; platform: string; codeVerifier?: string }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly xConnector: XConnector,
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
      },
    });
  }

  async findById(id: string) {
    const account = await this.prisma.integrationAccount.findUnique({ where: { id } });
    if (!account || account.deletedAt) throw new NotFoundException('Integration not found');
    return account;
  }

  async getAuthUrl(tenantId: string, userId: string, platform: string, redirectUri: string) {
    switch (platform) {
      case 'X': {
        const state = crypto.randomUUID();
        const authResult = this.xConnector.getAuthUrl(state, redirectUri);
        const stored = this.xConnector.pkceStore.get(state);
        this.stateStore.set(state, {
          tenantId,
          userId,
          platform,
          codeVerifier: stored?.codeVerifier,
        });
        setTimeout(() => {
          this.stateStore.delete(state);
          this.xConnector.pkceStore.delete(state);
        }, 10 * 60 * 1000);
        return { authUrl: authResult, state };
      }
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  async handleCallback(tenantId: string, platform: string, code: string, state: string) {
    const stored = this.stateStore.get(state);
    if (!stored) throw new BadRequestException('Invalid or expired state');
    this.stateStore.delete(state);

    let tokens;
    switch (platform) {
      case 'X':
        tokens = await this.xConnector.handleCallback(code, stored.codeVerifier || '');
        break;
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
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
        data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, status: 'ACTIVE' },
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
      },
    });
  }

  async disconnect(id: string) {
    const account = await this.findById(id);
    await this.prisma.integrationAccount.update({
      where: { id },
      data: { status: 'REVOKED', deletedAt: new Date() },
    });
  }

  async sync(id: string) {
    const account = await this.findById(id);
    return { message: `Sync queued for ${account.platform}`, accountId: id };
  }
}
