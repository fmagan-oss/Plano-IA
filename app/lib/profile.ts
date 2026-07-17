import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string | null;
  stripe_customer_id: string | null;
  plan: 'free' | 'pro';
  subscription_status: string | null;
  current_period_end: string | null;
}

/**
 * Loads the current user's profile, creating it on first access.
 *
 * A DB trigger (see supabase/migrations) also auto-creates the row on signup;
 * this upsert is a belt-and-braces fallback and keeps the email in sync.
 */
export async function getOrCreateProfile(
  supabase: SupabaseClient,
  user: User
): Promise<Profile | null> {
  // Upsert (id is the auth user id; RLS allows the owner to write their row).
  await supabase
    .from('profiles')
    .upsert({ id: user.id, email: user.email ?? null }, { onConflict: 'id' });

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, stripe_customer_id, plan, subscription_status, current_period_end')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data as Profile;
}

/** Whether a profile currently entitles the user to Pro features. */
export function isProActive(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.plan === 'pro' && profile.subscription_status === 'active';
}
