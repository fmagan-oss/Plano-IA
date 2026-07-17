import { redirect } from 'next/navigation';
import CatPilotApp from '../components/CatPilotApp';
import { createClient } from '../lib/supabase/server';
import { getOrCreateProfile } from '../lib/profile';

export const metadata = {
  title: 'Application — CatPilot',
};

export default async function AppPage() {
  const supabase = await createClient();

  // When Supabase is configured, the app is a protected route: unauthenticated
  // visitors are sent to the magic-link sign-in. When it is NOT configured
  // (e.g. before env vars are set locally), the app stays open so it remains
  // demoable — the guard activates automatically once auth is wired.
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    // Ensure the profile row exists (also created by a DB trigger on signup).
    await getOrCreateProfile(supabase, user);
  }

  return <CatPilotApp />;
}
