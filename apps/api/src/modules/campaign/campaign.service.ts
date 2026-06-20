import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    return this.prisma.campaign.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true, tasks: true } } },
    });
  }

  async findById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        posts: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        _count: { select: { posts: true, tasks: true } },
      },
    });
    if (!campaign || campaign.deletedAt) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(tenantId: string, data: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        tenantId,
        name: data.name,
        goal: data.goal || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget || null,
        kpiTargets: data.kpiTargets || {},
      },
    });
  }

  async update(id: string, data: UpdateCampaignDto) {
    await this.findById(id);
    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.goal !== undefined && { goal: data.goal }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.kpiTargets !== undefined && { kpiTargets: data.kpiTargets }),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.campaign.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
