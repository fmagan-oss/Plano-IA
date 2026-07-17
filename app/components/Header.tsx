'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePro } from '../providers';
import { createClient } from '../lib/supabase/client';

export default function Header() {
  const { pro, setPro } = usePro();
  const [email, setEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const configured = typeof window !== 'undefined' && createClient() !== null;

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
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
          {/* Pro simulation — still needed until payments (M3) and the real
              server entitlement (M4) are wired. */}
          <label className="pro-toggle" title="Simulation du statut Pro (remplacé par la session serveur en M4)">
            <input type="checkbox" checked={pro} onChange={(e) => setPro(e.target.checked)} />
            <span>Simuler&nbsp;Pro</span>
          </label>
          <span className={`plan-badge ${pro ? 'is-pro' : 'is-free'}`}>{pro ? 'Pro' : 'Démo'}</span>

          {configured && authReady && (
            email ? (
              <div className="session-user">
                <span className="session-email" title={email}>{email}</span>
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
