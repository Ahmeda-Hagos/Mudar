import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { IBillingService } from './billing.service.interface';
import { PrismaService } from '../../database/prisma.service';
import { Subscription, SubscriptionPlan } from '@visaflow/types';

@Injectable()
export class StripeBillingService implements IBillingService {
  private readonly logger = new Logger(StripeBillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCheckoutSession(
    tenantId: string,
    plan: string,
    cycle: 'MONTHLY' | 'ANNUAL',
  ): Promise<string> {
    this.logger.log(`Mocking Stripe checkout session creation for tenant: ${tenantId}, plan: ${plan}, cycle: ${cycle}`);
    // Generates a mock Stripe payment session URL
    return `https://checkout.stripe.com/pay/mock_session_${tenantId}`;
  }

  async getSubscription(tenantId: string): Promise<Subscription | null> {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) return null;

    return {
      id: sub.id,
      tenantId: sub.tenantId,
      plan: sub.plan as SubscriptionPlan,
      status: sub.status as any,
      billingCycle: sub.billingCycle as any,
      trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
      currentPeriodStart: sub.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    };
  }

  async cancelSubscription(tenantId: string): Promise<void> {
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
    });

    if (!sub) {
      throw new NotFoundException('No active subscription found to cancel');
    }

    this.logger.log(`Cancelling Stripe subscription contract for tenant: ${tenantId}`);

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }
}
