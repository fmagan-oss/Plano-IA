import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Privileged Supabase client using the service_role key. **Server only.**
 * Bypasses RLS — used exclusively by Stripe webhooks to write subscription
 * status to `profiles`. Never import this into a client component.
 *
 * Returns null when the service role key or URL is missing.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
