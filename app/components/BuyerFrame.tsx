'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { BuyerFrame as BuyerFrameData, DeckEdit } from '../lib/types';
import { T, useLocale } from '../lib/i18n';

/**
 * Buyer presentation deck. Pro users can edit every section before export —
 * edits are kept per strategy variant and saved with the presentation.
 */
export default function BuyerFrame({
  frame,
  locked,
  editable = false,
  onSaveEdits,
}: {
  frame: BuyerFrameData;
  locked: boolean;
  editable?: boolean;
  onSaveEdits?: (edit: DeckEdit) => void;
}) {
  const { locale } = useLocale();
  const t = T[locale].app;
  const [editMode, setEditMode] = useState(false);
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [moves, setMoves] = useState('');
  const [novelties, setNovelties] = useState('');
  const [impact, setImpact] = useState('');

  function startEdit() {
    setHeadline(frame.headline);
    setSummary(frame.categorySummary);
    setMoves(frame.keyMoves.join('\n'));
    setNovelties(frame.noveltyPitch.join('\n'));
    setImpact(frame.expectedImpact.join('\n'));
    setEditMode(true);
  }

  function saveEdit() {
    const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
    onSaveEdits?.({
      headline: headline.trim() || frame.headline,
      categorySummary: summary.trim() || frame.categorySummary,
      keyMoves: lines(moves),
      noveltyPitch: lines(novelties),
      expectedImpact: lines(impact),
    });
    setEditMode(false);
  }

  return (
    <div className={`trame ${locked ? 'is-locked' : ''}`}>
      <div className="trame-head">
        <h3>{t.trame}</h3>
        <span className="trame-head-actions">
          {editable && !editMode && (
            <button className="btn btn-ghost btn-sm" onClick={startEdit}>{t.deckEdit}</button>
          )}
          {locked && <span className="lock-pill">🔒 Pro</span>}
        </span>
      </div>

      {editMode ? (
        <div className="trame-editor">
          <label>{t.trameEyebrow}</label>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
          <div className="trame-editor-cols">
            <div>
              <label>{t.trameMoves}</label>
              <textarea rows={7} value={moves} onChange={(e) => setMoves(e.target.value)} />
            </div>
            <div>
              <label>{t.trameNov}</label>
              <textarea rows={7} value={novelties} onChange={(e) => setNovelties(e.target.value)} />
            </div>
            <div>
              <label>{t.trameImpact}</label>
              <textarea rows={7} value={impact} onChange={(e) => setImpact(e.target.value)} />
            </div>
          </div>
          <div className="trame-editor-actions">
            <span className="muted">{t.deckHint}</span>
            <span>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>{t.deckCancel}</button>{' '}
              <button className="btn btn-primary btn-sm" onClick={saveEdit}>{t.deckSave}</button>
            </span>
          </div>
        </div>
      ) : (
        <div className="trame-body">
          <div className="trame-slide">
            <p className="trame-eyebrow">{t.trameEyebrow}</p>
            <h4>{frame.headline}</h4>
            <p>{frame.categorySummary}</p>
          </div>

          <div className="trame-cols">
            <div>
              <h5>{t.trameMoves}</h5>
              <ul>
                {frame.keyMoves.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5>{t.trameNov}</h5>
              <ul>
                {frame.noveltyPitch.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5>{t.trameImpact}</h5>
              <ul>
                {frame.expectedImpact.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
