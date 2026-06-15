import {
  Controller, Get, Post, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationService } from './integration.service';
import { GetAuthUrlDto, CallbackDto } from './dto';
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
    @Body() dto: GetAuthUrlDto,
  ) {
    return this.integrationService.getAuthUrl(user.tenantId, user.id, dto.platform, dto.redirectUri);
  }

  @Post('callback')
  async handleCallback(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: CallbackDto,
  ) {
    return this.integrationService.handleCallback(user.tenantId, dto.platform, dto.code, dto.state);
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
