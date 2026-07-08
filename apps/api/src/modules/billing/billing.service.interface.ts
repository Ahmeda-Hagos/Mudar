import { Subscription } from '@visaflow/types';

/**
 * Billing Service interface.
 * Decouples Stripe integrations from application modules.
 */
export interface IBillingService {
  /**
   * Generates a billing session URL for Stripe Checkout portal.
   */
  createCheckoutSession(tenantId: string, plan: string, cycle: 'MONTHLY' | 'ANNUAL'): Promise<string>;

  /**
   * Fetches active tenant subscription contracts.
   */
  getSubscription(tenantId: string): Promise<Subscription | null>;

  /**
   * Cancels subscription plan at current billing period end.
   */
  cancelSubscription(tenantId: string): Promise<void>;
}

export const IBillingServiceToken = Symbol('IBillingService');
