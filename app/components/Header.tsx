'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const [pro, setPro] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    setConfigured(true);

    async function load() {
      const {
        data: { user },
      } = await supabase!.auth.getUser();
      setEmail(user?.email ?? null);
      if (user) {
        const { data: profile } = await supabase!
          .from('profiles')
          .select('plan, subscription_status')
          .eq('id', user.id)
          .single();
        setPro(profile?.plan === 'pro' && profile?.subscription_status === 'active');
      } else {
        setPro(false);
      }
      setAuthReady(true);
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo" aria-label="Accueil CatPilot">
          <span className="logo-mark" aria-hidden>◧</span>
          <span className="logo-text">CatPilot</span>
        </Link>

        <nav className="header-nav">
          <Link href="/">Accueil</Link>
          <Link href="/#offres">Offres</Link>
          <Link href="/app">Application</Link>
        </nav>

        <div className="header-session">
          {configured && authReady && email && (
            <span className={`plan-badge ${pro ? 'is-pro' : 'is-free'}`}>{pro ? 'Pro' : 'Gratuit'}</span>
          )}

          {configured && authReady && (
            email ? (
              <div className="session-user">
                <Link href="/compte" className="session-email" title={email}>{email}</Link>
                <form action="/auth/signout" method="post">
                  <button className="btn btn-ghost btn-sm" type="submit">Se déconnecter</button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">Se connecter</Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
