import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { XConnector } from './connectors/x.connector';
import { InstagramConnector } from './connectors/instagram.connector';
import { TikTokConnector } from './connectors/tiktok.connector';
import { YouTubeConnector } from './connectors/youtube.connector';
import { LinkedInConnector } from './connectors/linkedin.connector';
import { ThreadsConnector } from './connectors/threads.connector';

@Module({
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    XConnector,
    InstagramConnector,
    TikTokConnector,
    YouTubeConnector,
    LinkedInConnector,
    ThreadsConnector,
  ],
  exports: [
    IntegrationService,
    XConnector,
    InstagramConnector,
    TikTokConnector,
    YouTubeConnector,
    LinkedInConnector,
    ThreadsConnector,
  ],
})
export class IntegrationModule {}
