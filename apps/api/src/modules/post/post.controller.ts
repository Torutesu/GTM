import {
  Controller, Get, Post as HttpPost, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostService } from './post.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('posts')
@UseGuards(AuthGuard('jwt'))
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async list(
    @CurrentUser() user: { tenantId: string },
    @Query('status') status?: string,
    @Query('platform') platform?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.findByTenant(user.tenantId, {
      status,
      platform,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @HttpPost()
  async create(
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() data: { contentText: string; platform: string; integrationAccountId?: string; scheduledAt?: string },
  ) {
    return this.postService.create(user.tenantId, user.id, data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: { contentText?: string; scheduledAt?: string },
  ) {
    return this.postService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.postService.delete(id);
    return { success: true };
  }

  @HttpPost(':id/approve')
  async approve(@Param('id') id: string) {
    return this.postService.updateStatus(id, 'APPROVED');
  }

  @HttpPost(':id/publish')
  async publish(@Param('id') id: string) {
    return this.postService.publish(id);
  }

  @HttpPost(':id/schedule')
  async schedule(@Param('id') id: string, @Body('scheduledAt') scheduledAt: string) {
    return this.postService.schedule(id, new Date(scheduledAt));
  }
}
