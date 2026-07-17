import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Source of truth for the plan is Stripe. This helper mirrors a Stripe
 * subscription into the Supabase `profiles` row (via the admin client, which
 * bypasses RLS). Called from the webhook only.
 */
export async function syncSubscriptionToProfile(
  admin: SupabaseClient,
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  const active = subscription.status === 'active' || subscription.status === 'trialing';
  const periodEnd = subscription.items.data[0]?.current_period_end ?? (subscription as unknown as { current_period_end?: number }).current_period_end;

  const update = {
    plan: active ? 'pro' : 'free',
    subscription_status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    stripe_customer_id: customerId,
  };

  // Prefer matching by the user id stored in subscription metadata; otherwise
  // fall back to matching on the Stripe customer id.
  const userId = subscription.metadata?.supabase_user_id;

  if (userId) {
    await admin.from('profiles').update(update).eq('id', userId);
  } else {
    await admin.from('profiles').update(update).eq('stripe_customer_id', customerId);
  }
}
