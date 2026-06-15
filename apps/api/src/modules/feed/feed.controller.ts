import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedService } from './feed.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('feed')
@UseGuards(AuthGuard('jwt'))
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async list(
    @CurrentUser() user: { tenantId: string },
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedService.findByTenant(user.tenantId, {
      cursor,
      limit: parseInt(limit || '50'),
    });
  }
}
