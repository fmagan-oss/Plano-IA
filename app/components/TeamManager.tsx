'use client';

import { useEffect, useState } from 'react';

interface Member { id: string; email: string; created_at: string }

/** Named-seat management (owner side): list, invite, remove. */
export default function TeamManager() {
  const [seats, setSeats] = useState(1);
  const [used, setUsed] = useState(1);
  const [pro, setPro] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    const res = await fetch('/api/team');
    if (!res.ok) { setLoaded(true); return; }
    const data = await res.json();
    setSeats(data.seats); setUsed(data.used); setMembers(data.members); setPro(data.pro);
    setLoaded(true);
  }
  useEffect(() => { refresh(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setError(null);
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || 'Erreur.');
    else setEmail('');
    await refresh();
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true); setError(null);
    await fetch('/api/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await refresh();
    setBusy(false);
  }

  if (!loaded || !pro) return null;

  return (
    <div className="account-card">
      <h2>Sièges de l’équipe</h2>
      <p className="muted">
        {used} siège(s) utilisé(s) sur {seats}. Chaque siège est nominatif : chaque membre se connecte avec sa
        propre adresse e-mail (magic link) et bénéficie du Pro. Pour ajouter des sièges, passez par
        « Gérer mon abonnement ».
      </p>

      <ul className="team-list">
        <li>
          <span className="team-email">Vous (titulaire)</span>
          <span className="team-role">Siège 1</span>
        </li>
        {members.map((m, i) => (
          <li key={m.id}>
            <span className="team-email">{m.email}</span>
            <span className="team-actions">
              <span className="team-role">Siège {i + 2}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => remove(m.id)} disabled={busy}>
                Retirer
              </button>
            </span>
          </li>
        ))}
      </ul>

      {used < seats ? (
        <form onSubmit={invite} className="team-form">
          <input
            type="email"
            required
            placeholder="prenom.nom@entreprise.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary" disabled={busy}>Ajouter un siège nominatif</button>
        </form>
      ) : (
        <p className="muted">Tous les sièges sont attribués.</p>
      )}
      {error && <p className="billing-error">{error}</p>}
    </div>
  );
}
