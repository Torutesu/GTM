import {
  Controller, Get, Post, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationService } from './integration.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get()
  async list(@CurrentUser() user: { tenantId: string }) {
    return this.integrationService.findByTenant(user.tenantId);
  }

  @Post('auth-url')
  async getAuthUrl(
    @CurrentUser() user: { id: string; tenantId: string },
    @Body('platform') platform: string,
    @Body('redirectUri') redirectUri: string,
  ) {
    return this.integrationService.getAuthUrl(user.tenantId, user.id, platform, redirectUri);
  }

  @Post('callback')
  async handleCallback(
    @CurrentUser() user: { tenantId: string },
    @Body('platform') platform: string,
    @Body('code') code: string,
    @Body('state') state: string,
  ) {
    return this.integrationService.handleCallback(user.tenantId, platform, code, state);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.integrationService.findById(id);
  }

  @Delete(':id')
  async disconnect(@Param('id') id: string) {
    await this.integrationService.disconnect(id);
    return { success: true };
  }

  @Post(':id/sync')
  async sync(@Param('id') id: string) {
    return this.integrationService.sync(id);
  }
}
