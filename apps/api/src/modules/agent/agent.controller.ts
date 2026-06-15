import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgentService } from './agent.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('agents')
@UseGuards(AuthGuard('jwt'))
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('execute')
  async execute(
    @CurrentUser() user: { id: string; tenantId: string },
    @Body() body: { agentType: string; input: Record<string, unknown>; campaignId?: string },
  ) {
    return this.agentService.execute(user.tenantId, user.id, body.agentType, body.input, body.campaignId);
  }

  @Get('tasks')
  async listTasks(
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.agentService.listTasks(user.tenantId);
  }

  @Post('tasks/:id/cancel')
  async cancelTask(@Param('id') id: string) {
    return this.agentService.cancelTask(id);
  }
}
