import { redirect } from 'next/navigation';
import CatPilotApp from '../components/CatPilotApp';
import { createClient } from '../lib/supabase/server';
import { getOrCreateProfile, isProEntitled } from '../lib/profile';

export const metadata = {
  title: 'Application — CatPilot',
};

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ pres?: string }>;
}) {
  const supabase = await createClient();
  const { pres } = await searchParams;

  // The Pro entitlement is the SERVER's source of truth: own subscription or
  // a named seat on a team subscription (mirrored from Stripe via webhook).
  let pro = false;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const profile = await getOrCreateProfile(supabase, user);
    pro = await isProEntitled(supabase, profile);
  }

  // Local preview escape hatch (off by default). Lets you demo Pro features
  // without a live Stripe subscription. NOT a client toggle — set server-side.
  if (process.env.NEXT_PUBLIC_DEV_FORCE_PRO === '1') {
    pro = true;
  }

  return <CatPilotApp pro={pro} presentationId={pres ?? null} />;
}
