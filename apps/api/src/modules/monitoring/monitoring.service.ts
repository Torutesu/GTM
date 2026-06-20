import { Injectable } from '@nestjs/common';

@Injectable()
export class MonitoringService {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;

  incrementRequest() {
    this.requestCount++;
  }

  incrementError() {
    this.errorCount++;
  }

  getHealth() {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      uptimeHuman: this.formatUptime(),
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  getStats() {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: this.requestCount > 0 ? ((this.errorCount / this.requestCount) * 100).toFixed(2) + '%' : '0%',
    };
  }

  private formatUptime(): string {
    const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  }
}
