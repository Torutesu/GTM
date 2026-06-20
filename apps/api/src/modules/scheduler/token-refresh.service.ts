import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { XConnector } from '../integration/connectors/x.connector';
import { InstagramConnector } from '../integration/connectors/instagram.connector';

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xConnector: XConnector,
    private readonly instagramConnector: InstagramConnector,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshExpiringTokens() {
    this.logger.debug('Checking for expiring tokens...');

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const expiring = await this.prisma.integrationAccount.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        tokenExpiresAt: { lte: sevenDaysFromNow },
        refreshToken: { not: null },
      },
    });

    if (expiring.length === 0) return;
    this.logger.log(`Refreshing ${expiring.length} expiring tokens`);

    for (const account of expiring) {
      try {
        switch (account.platform) {
          case 'X': {
            const tokens = await this.xConnector.refreshToken(account.refreshToken || '');
            await this.prisma.integrationAccount.update({
              where: { id: account.id },
              data: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              },
            });
            this.logger.log(`Refreshed X token for account ${account.platformUserName}`);
            break;
          }
          case 'INSTAGRAM': {
            const tokens = await this.instagramConnector.handleCallback(account.accessToken);
            if (tokens) {
              await this.prisma.integrationAccount.update({
                where: { id: account.id },
                data: {
                  accessToken: tokens.accessToken,
                  tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                },
              });
              this.logger.log(`Refreshed Instagram token for account ${account.platformUserName}`);
            }
            break;
          }
          default:
            break;
        }
      } catch (err: any) {
        this.logger.error(`Failed to refresh token for ${account.platform} ${account.id}: ${err.message}`);
        await this.prisma.integrationAccount.update({
          where: { id: account.id },
          data: { status: 'EXPIRED' },
        });
      }
    }
  }

  @Cron('0 3 * * *')
  async cleanupExpiredTokens() {
    const expired = await this.prisma.integrationAccount.findMany({
      where: {
        status: 'EXPIRED',
        deletedAt: null,
        tokenExpiresAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    for (const account of expired) {
      await this.prisma.integrationAccount.update({
        where: { id: account.id },
        data: { deletedAt: new Date() },
      });
      this.logger.log(`Cleaned up expired token for ${account.platform} ${account.id}`);
    }
  }
}
