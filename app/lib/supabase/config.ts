/**
 * Central check for Supabase configuration.
 *
 * Both values are public (safe to expose in the client bundle):
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * The privileged SUPABASE_SERVICE_ROLE_KEY is *never* read here — it stays
 * server-only and is used later (Stripe webhooks, M3+) via a dedicated admin
 * client.
 */
export function supabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return supabaseConfig() !== null;
}
