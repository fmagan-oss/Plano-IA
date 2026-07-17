'use client';

import Link from 'next/link';
import type { Planogram } from '../lib/types';
import { T, useLocale } from '../lib/i18n';

export default function BuyerFrame({ plano, locked }: { plano: Planogram; locked: boolean }) {
  const { locale } = useLocale();
  const t = T[locale].app;
  const f = plano.buyerFrame;

  return (
    <div className={`trame ${locked ? 'is-locked' : ''}`}>
      <div className="trame-head">
        <h3>{t.trame}</h3>
        {locked && <span className="lock-pill">🔒 Pro</span>}
      </div>

      <div className="trame-body">
        <div className="trame-slide">
          <p className="trame-eyebrow">{t.trameEyebrow}</p>
          <h4>{f.headline}</h4>
          <p>{f.categorySummary}</p>
        </div>

        <div className="trame-cols">
          <div>
            <h5>{t.trameMoves}</h5>
            <ul>
              {f.keyMoves.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5>{t.trameNov}</h5>
            <ul>
              {f.noveltyPitch.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5>{t.trameImpact}</h5>
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
            <h4>{t.trameLockTitle}</h4>
            <p>{t.trameLockText}</p>
            <Link href="/compte" className="btn btn-primary">
              {t.lockCta}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
