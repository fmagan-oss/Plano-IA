import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';

/**
 * Magic-link / OAuth callback. Supabase redirects here with a `code` that we
 * exchange for a session (PKCE), then send the user to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=1`);
}
