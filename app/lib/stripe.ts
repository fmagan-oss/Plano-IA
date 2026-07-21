import Stripe from 'stripe';

/**
 * Server-only Stripe client. The secret key never reaches the browser bundle.
 * Returns null when Stripe is not configured yet, so routes can degrade
 * gracefully before the env vars are set.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, {
      appInfo: { name: 'CatPilot' },
    });
  }
  return cached;
}

/** The two paid price IDs (created in the Stripe dashboard, injected via env). */
export const PRICES = {
  get monthly() {
    return process.env.STRIPE_PRICE_PRO_MONTHLY || '';
  },
  get yearly() {
    return process.env.STRIPE_PRICE_PRO_YEARLY || '';
  },
};

export function priceIdForPlan(plan: 'monthly' | 'yearly'): string {
  return plan === 'yearly' ? PRICES.yearly : PRICES.monthly;
}
