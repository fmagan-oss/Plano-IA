import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '../../../lib/stripe';
import { createAdminClient } from '../../../lib/supabase/admin';
import { syncSubscriptionToProfile } from '../../../lib/stripe-sync';

export const runtime = 'nodejs';
// Never cache; must read the raw body for signature verification.
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook. Verifies the signature, is idempotent (dedupes on event id
 * via the `stripe_events` table), and mirrors subscription status into
 * `profiles` using the service-role admin client.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const admin = createAdminClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !admin || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'signature invalide';
    return NextResponse.json({ error: `Signature invalide : ${message}` }, { status: 400 });
  }

  // Idempotency: record the event id; if it already exists, skip processing.
  const { error: insertError } = await admin.from('stripe_events').insert({ id: event.id });
  if (insertError) {
    // Duplicate primary key → already processed. Any other error → surface it.
    if (insertError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: 'Erreur idempotence.' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId =
            typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          // Carry the user id from the checkout onto the subscription metadata.
          if (session.client_reference_id && !subscription.metadata?.supabase_user_id) {
            subscription.metadata = { ...subscription.metadata, supabase_user_id: session.client_reference_id };
          }
          await syncSubscriptionToProfile(admin, stripe, subscription);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToProfile(admin, stripe, subscription);
        break;
      }
      default:
        // Unhandled event types are acknowledged without action.
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erreur inconnue';
    return NextResponse.json({ error: `Traitement échoué : ${message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
