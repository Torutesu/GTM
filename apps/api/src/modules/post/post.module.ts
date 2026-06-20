import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { IntegrationModule } from '../integration/integration.module';
import { PlatformFormatter } from './platform-formatter.service';

@Module({
  imports: [IntegrationModule],
  controllers: [PostController],
  providers: [PostService, PlatformFormatter],
  exports: [PostService, PlatformFormatter],
})
export class PostModule {}
