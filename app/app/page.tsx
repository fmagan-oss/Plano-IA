import { redirect } from 'next/navigation';
import CatPilotApp from '../components/CatPilotApp';
import { createClient } from '../lib/supabase/server';
import { getOrCreateProfile, isProActive } from '../lib/profile';

export const metadata = {
  title: 'Application — CatPilot',
};

export default async function AppPage() {
  const supabase = await createClient();

  // The Pro entitlement is the SERVER's source of truth (Supabase profile,
  // mirrored from Stripe via webhook). No client-side simulation.
  let pro = false;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const profile = await getOrCreateProfile(supabase, user);
    pro = isProActive(profile);
  }

  // Local preview escape hatch (off by default). Lets you demo Pro features
  // without a live Stripe subscription. NOT a client toggle — set server-side.
  if (process.env.NEXT_PUBLIC_DEV_FORCE_PRO === '1') {
    pro = true;
  }

  return <CatPilotApp pro={pro} />;
}
