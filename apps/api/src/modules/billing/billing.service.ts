import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const PLANS = {
  free: { name: 'Free', price: 0, postsPerMonth: 5, maxAccounts: 1, agents: 1 },
  pro: { name: 'Pro', price: 29, postsPerMonth: -1, maxAccounts: 5, agents: 8 },
  enterprise: { name: 'Enterprise', price: 99, postsPerMonth: -1, maxAccounts: -1, agents: 8 },
};

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscription(tenantId: string) {
    let sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub) {
      sub = await this.prisma.subscription.create({
        data: { tenantId, plan: 'free', status: 'active' },
      });
    }
    const plan = PLANS[sub.plan as keyof typeof PLANS] || PLANS.free;
    return { ...sub, planDetails: plan };
  }

  async getPlans() {
    return Object.entries(PLANS).map(([id, details]) => ({ id, ...details }));
  }

  async upgrade(tenantId: string, plan: string) {
    if (!PLANS[plan as keyof typeof PLANS]) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }
    const existing = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!existing) {
      return this.prisma.subscription.create({
        data: { tenantId, plan, status: plan === 'free' ? 'active' : 'trialing' },
      });
    }
    return this.prisma.subscription.update({
      where: { tenantId },
      data: { plan, status: plan === 'free' ? 'active' : 'active' },
    });
  }

  async createCheckoutSession(tenantId: string, plan: string) {
    if (!PLANS[plan as keyof typeof PLANS]) {
      throw new BadRequestException(`Invalid plan: ${plan}`);
    }
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { url: null, demoUpgraded: true, message: 'Stripe not configured. Demo upgrade applied.' };
    }

    const sub = await this.getSubscription(tenantId);
    const customerId = (sub as any).stripeCustomerId;
    // Stripe checkout session creation would go here
    return { url: 'https://checkout.stripe.com/pay/...', demoUpgraded: false };
  }
}
