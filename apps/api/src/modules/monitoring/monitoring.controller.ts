import { Controller, Get } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  health() {
    return this.monitoringService.getHealth();
  }

  @Get('stats')
  stats() {
    return this.monitoringService.getStats();
  }
}
