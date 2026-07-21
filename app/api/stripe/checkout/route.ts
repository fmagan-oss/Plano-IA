import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { getOrCreateProfile } from '../../../lib/profile';
import { getStripe, priceIdForPlan } from '../../../lib/stripe';

export const runtime = 'nodejs';

/**
 * Creates a Stripe Checkout session (subscription mode) for the signed-in user.
 * `client_reference_id` = Supabase user id. Stripe Tax + VAT id collection are
 * enabled for B2B EU reverse-charge invoicing.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Paiements non configurés.' }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Authentification non configurée.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { plan?: 'monthly' | 'yearly'; seats?: number };
  const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
  // Per-seat licensing: quantity = named seats (1..100).
  const seats = Math.min(100, Math.max(1, Math.floor(Number(body.seats) || 1)));
  const price = priceIdForPlan(plan);
  if (!price) {
    return NextResponse.json({ error: `Prix Stripe « ${plan} » non configuré.` }, { status: 503 });
  }

  const profile = await getOrCreateProfile(supabase, user);

  // Ensure a Stripe customer exists for this user.
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price, quantity: seats }],
    subscription_data: { metadata: { supabase_user_id: user.id } },
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },
    customer_update: { address: 'auto', name: 'auto' },
    allow_promotion_codes: true,
    success_url: `${origin}/compte?checkout=success`,
    cancel_url: `${origin}/compte?checkout=cancel`,
  });

  return NextResponse.json({ url: session.url });
}
