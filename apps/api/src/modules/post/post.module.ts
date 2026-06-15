import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [IntegrationModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
