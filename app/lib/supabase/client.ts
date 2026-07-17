'use client';

import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from './config';

/** Browser Supabase client. Returns null when Supabase is not configured yet. */
export function createClient() {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  return createBrowserClient(cfg.url, cfg.anonKey);
}
