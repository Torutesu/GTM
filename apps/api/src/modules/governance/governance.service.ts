import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GovernanceService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(tenantId: string, options: { page: number; limit: number }) {
    const [logs, total] = await Promise.all([
      this.prisma.generationLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.generationLog.count({ where: { tenantId } }),
    ]);

    return {
      data: logs,
      meta: { total, page: options.page, limit: options.limit },
    };
  }

  async listViolations(tenantId: string) {
    return this.prisma.policyViolation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
