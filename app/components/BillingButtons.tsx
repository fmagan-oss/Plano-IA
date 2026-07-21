'use client';

import { useState } from 'react';

async function post(url: string, body?: unknown): Promise<{ url?: string; error?: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json().catch(() => ({ error: 'Réponse invalide.' }));
}

/** Starts a Stripe Checkout session. Redirects to /login if not signed in. */
export function CheckoutButton({
  plan,
  seats = 1,
  className = 'btn btn-primary btn-block',
  children,
}: {
  plan: 'monthly' | 'yearly';
  seats?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, seats }),
    });
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    const data = await res.json().catch(() => ({ error: 'Réponse invalide.' }));
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || 'Impossible de démarrer le paiement.');
      setLoading(false);
    }
  }

  return (
    <>
      <button className={className} onClick={go} disabled={loading}>
        {loading ? 'Redirection…' : children}
      </button>
      {error && <p className="billing-error">{error}</p>}
    </>
  );
}

/** Opens the Stripe Customer Portal to manage/cancel the subscription. */
export function ManageBillingButton({
  className = 'btn btn-ghost',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    const data = await post('/api/stripe/portal');
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || 'Portail indisponible.');
      setLoading(false);
    }
  }

  return (
    <>
      <button className={className} onClick={go} disabled={loading}>
        {loading ? 'Ouverture…' : children}
      </button>
      {error && <p className="billing-error">{error}</p>}
    </>
  );
}
