import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('campaigns')
@UseGuards(AuthGuard('jwt'))
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async list(@CurrentUser() user: { tenantId: string }) {
    return this.campaignService.findByTenant(user.tenantId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  @Post()
  async create(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignService.create(user.tenantId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.campaignService.delete(id);
    return { success: true };
  }
}
