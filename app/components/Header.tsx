'use client';

import Link from 'next/link';
import { usePro } from '../providers';

export default function Header() {
  const { pro, setPro } = usePro();

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
          {/* M1: session state is simulated. M2 replaces this with the real
              Supabase auth state (magic link) and a "Se connecter" button. */}
          <label className="pro-toggle" title="Simulation du statut Pro (remplacé par la session serveur en M4)">
            <input
              type="checkbox"
              checked={pro}
              onChange={(e) => setPro(e.target.checked)}
            />
            <span>Simuler&nbsp;Pro</span>
          </label>
          <span className={`plan-badge ${pro ? 'is-pro' : 'is-free'}`}>{pro ? 'Pro' : 'Démo'}</span>
        </div>
      </div>
    </header>
  );
}
