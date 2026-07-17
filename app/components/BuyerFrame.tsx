import Link from 'next/link';
import type { Planogram } from '../lib/types';

export default function BuyerFrame({ plano, locked }: { plano: Planogram; locked: boolean }) {
  const f = plano.buyerFrame;

  return (
    <div className={`trame ${locked ? 'is-locked' : ''}`}>
      <div className="trame-head">
        <h3>Trame de présentation acheteur</h3>
        {locked && <span className="lock-pill">🔒 Pro</span>}
      </div>

      <div className="trame-body">
        <div className="trame-slide">
          <p className="trame-eyebrow">Synthèse catégorie</p>
          <h4>{f.headline}</h4>
          <p>{f.categorySummary}</p>
        </div>

        <div className="trame-cols">
          <div>
            <h5>Moves clés</h5>
            <ul>
              {f.keyMoves.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5>Nouveautés</h5>
            <ul>
              {f.noveltyPitch.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5>Impact attendu</h5>
            <ul>
              {f.expectedImpact.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {locked && (
        <div className="trame-overlay">
          <div className="overlay-card">
            <h4>Trame acheteur réservée au Pro</h4>
            <p>Débloquez la trame de présentation prête à défendre en rendez-vous enseigne, et les 4 variantes stratégiques.</p>
            <Link href="/compte" className="btn btn-primary">
              Passer en Pro
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
