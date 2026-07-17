import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { getOrCreateProfile } from '../../../lib/profile';
import { getStripe } from '../../../lib/stripe';

export const runtime = 'nodejs';

/** Opens the Stripe Customer Portal so the user can manage/cancel their plan. */
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

  const profile = await getOrCreateProfile(supabase, user);
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'Aucun abonnement à gérer.' }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/compte`,
  });

  return NextResponse.json({ url: session.url });
}
