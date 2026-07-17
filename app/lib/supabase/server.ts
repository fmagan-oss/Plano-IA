import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

/**
 * Server Supabase client bound to the request cookies (App Router).
 * Returns null when Supabase is not configured, so callers can degrade
 * gracefully (e.g. keep the app demoable before env vars are set).
 */
export async function createClient() {
  const cfg = supabaseConfig();
  if (!cfg) return null;

  const cookieStore = await cookies();

  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — safe to ignore; the middleware
          // refreshes the session cookies.
        }
      },
    },
  });
}
