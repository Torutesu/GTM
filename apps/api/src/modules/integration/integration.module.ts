import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { XConnector } from './connectors/x.connector';

@Module({
  controllers: [IntegrationController],
  providers: [IntegrationService, XConnector],
  exports: [IntegrationService],
})
export class IntegrationModule {}
