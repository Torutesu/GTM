import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { XConnector } from './connectors/x.connector';
import { InstagramConnector } from './connectors/instagram.connector';

@Module({
  controllers: [IntegrationController],
  providers: [IntegrationService, XConnector, InstagramConnector],
  exports: [IntegrationService, XConnector, InstagramConnector],
})
export class IntegrationModule {}
