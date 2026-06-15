import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedGateway } from './feed.gateway';

@Module({
  controllers: [FeedController],
  providers: [FeedService, FeedGateway],
  exports: [FeedService, FeedGateway],
})
export class FeedModule {}
