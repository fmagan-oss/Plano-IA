'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '../lib/types';
import { deterministicInsights } from '../lib/planogram';

export default function Copilot({ products, pro }: { products: Product[]; pro: boolean }) {
  const insights = deterministicInsights(products);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // M5 will point this at the server proxy /api/copilot (Anthropic key kept
  // server-side). For now the connected copilot is a Pro teaser.
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!pro || !question.trim()) return;
    setLoading(true);
    setAnswer(null);
    // Placeholder until M5 wires /api/copilot.
    setTimeout(() => {
      setAnswer(
        "Le copilote IA connecté sera branché au jalon M5 (proxy serveur /api/copilot, clé Anthropic côté serveur uniquement). En attendant, appuyez-vous sur les recommandations déterministes ci-dessus."
      );
      setLoading(false);
    }, 400);
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
            <Link href="/#offres" className="btn btn-ghost">
              Débloquer avec Pro
            </Link>
          </div>
        )}
        {answer && <p className="copilot-answer">{answer}</p>}
      </div>
    </div>
  );
}
