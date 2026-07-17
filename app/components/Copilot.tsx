'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '../lib/types';
import { deterministicInsights } from '../lib/planogram';

/** Compact, token-light summary of the dataset sent to the server proxy. */
function buildContext(products: Product[]): string {
  const byBrand = new Map<string, { rev: number; vol: number; n: number; nw: number }>();
  for (const p of products) {
    const b = byBrand.get(p.brand) ?? { rev: 0, vol: 0, n: 0, nw: 0 };
    b.rev += p.revenue;
    b.vol += p.volume;
    b.n += 1;
    if (p.isNew) b.nw += 1;
    byBrand.set(p.brand, b);
  }
  const lines = [...byBrand.entries()]
    .sort((a, b) => b[1].rev - a[1].rev)
    .map(([brand, s]) => `- ${brand}: CA ${Math.round(s.rev)}€, ${s.n} réf, ${s.nw} nouveauté(s)`);
  return `Rayon de ${products.length} références sur ${byBrand.size} marques.\n${lines.join('\n')}`;
}

export default function Copilot({ products, pro }: { products: Product[]; pro: boolean }) {
  const insights = deterministicInsights(products);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!pro || !question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setError(null);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), context: buildContext(products) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Le copilote est indisponible.');
      } else {
        setAnswer(data.answer);
      }
    } catch {
      setError('Impossible de contacter le copilote.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="copilot">
      <div className="copilot-head">
        <h3>Copilote</h3>
        <span className="muted">Lecture automatique du rayon</span>
      </div>

      <ul className="copilot-insights">
        {insights.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>

      <div className={`copilot-ai ${pro ? '' : 'is-locked'}`}>
        <div className="copilot-ai-head">
          <span>Copilote IA connecté</span>
          {!pro && <span className="lock-pill sm">🔒 Pro</span>}
        </div>
        {pro ? (
          <form onSubmit={ask} className="copilot-form">
            <input
              type="text"
              placeholder="Ex. Comment défendre la nouveauté Prime face à l’acheteur ?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="btn btn-primary" disabled={loading}>
              {loading ? '…' : 'Demander'}
            </button>
          </form>
        ) : (
          <div className="copilot-locked">
            <p>Posez vos questions à un copilote IA connecté à vos données (analyse, argumentaire acheteur).</p>
            <Link href="/compte" className="btn btn-ghost">
              Débloquer avec Pro
            </Link>
          </div>
        )}
        {error && <p className="copilot-answer copilot-error">{error}</p>}
        {answer && <p className="copilot-answer">{answer}</p>}
      </div>
    </div>
  );
}
