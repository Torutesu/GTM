import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';

@Controller('billing')
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  async get(@Req() req: any) {
    return this.billingService.getSubscription(req.user.tenantId);
  }

  @Get('plans')
  async plans() {
    return this.billingService.getPlans();
  }

  @Post('upgrade')
  async upgrade(@Body() body: { plan: string }, @Req() req: any) {
    return this.billingService.upgrade(req.user.tenantId, body.plan);
  }

  @Post('create-checkout-session')
  async createCheckout(@Body() body: { plan: string }, @Req() req: any) {
    return this.billingService.createCheckoutSession(req.user.tenantId, body.plan);
  }
}
