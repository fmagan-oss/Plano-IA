'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const configured = supabase !== null;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setStatus('sending');
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo" aria-hidden>◧</div>
        <h1>Se connecter à CatPilot</h1>
        <p className="muted auth-sub">
          Entrez votre e-mail : nous vous envoyons un lien de connexion sécurisé (magic link), sans mot de passe.
        </p>

        {!configured ? (
          <div className="alert alert-warn auth-alert">
            L’authentification n’est pas encore configurée sur cet environnement (variables Supabase manquantes).
            Renseignez <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, puis
            rechargez.
          </div>
        ) : status === 'sent' ? (
          <div className="auth-sent">
            <div className="auth-check" aria-hidden>✓</div>
            <h2>Vérifiez votre boîte mail</h2>
            <p className="muted">
              Un lien de connexion a été envoyé à <strong>{email}</strong>. Cliquez dessus pour accéder à
              l’application.
            </p>
            <button className="btn btn-ghost" onClick={() => setStatus('idle')}>
              Utiliser une autre adresse
            </button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="auth-form">
            <label htmlFor="email">Adresse e-mail professionnelle</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="prenom.nom@enseigne.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {status === 'error' && <p className="auth-error">{message || 'Une erreur est survenue.'}</p>}
            <button className="btn btn-primary btn-block" disabled={status === 'sending'}>
              {status === 'sending' ? 'Envoi…' : 'Recevoir mon lien de connexion'}
            </button>
          </form>
        )}

        <p className="auth-back">
          <Link href="/">← Retour à l’accueil</Link>
        </p>
      </div>
    </div>
  );
}
