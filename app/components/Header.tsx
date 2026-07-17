'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { T, useLocale, type Locale } from '../lib/i18n';

export default function Header() {
  const { locale, setLocale } = useLocale();
  const t = T[locale];
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
        <Link href="/" className="logo" aria-label="CatPilot">
          <span className="logo-mark" aria-hidden>◧</span>
          <span className="logo-text">CatPilot</span>
        </Link>

        <nav className="header-nav">
          <Link href="/">{t.nav.home}</Link>
          <Link href="/#offres">{t.nav.offers}</Link>
          <Link href="/app">{t.nav.app}</Link>
        </nav>

        <div className="header-session">
          <div className="lang-switch" role="group" aria-label="Language">
            {(['fr', 'en'] as Locale[]).map((l) => (
              <button
                key={l}
                className={locale === l ? 'active' : ''}
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {configured && authReady && email && (
            <span className={`plan-badge ${pro ? 'is-pro' : 'is-free'}`}>
              {pro ? t.header.pro : t.header.free}
            </span>
          )}

          {configured && authReady && (
            email ? (
              <div className="session-user">
                <Link href="/compte" className="session-email" title={email}>{email}</Link>
                <form action="/auth/signout" method="post">
                  <button className="btn btn-ghost btn-sm" type="submit">{t.header.signout}</button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">{t.header.signin}</Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
