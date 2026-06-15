import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GovernanceService } from './governance.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('governance')
@UseGuards(AuthGuard('jwt'))
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('logs')
  async listLogs(
    @CurrentUser() user: { tenantId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.governanceService.listLogs(user.tenantId, {
      page: parseInt(page || '1'),
      limit: parseInt(limit || '50'),
    });
  }

  @Get('violations')
  async listViolations(
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.governanceService.listViolations(user.tenantId);
  }
}
