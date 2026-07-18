'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { parseWorkbook, FIELD_LABELS } from '../lib/parse';
import { generatePlanogram, STRATEGY_TEXT, DEFAULT_FIXTURE } from '../lib/planogram';
import { SAMPLE_PRODUCTS, SAMPLE_FILENAME } from '../lib/sample';
import type { Fixture, ParsedDataset, StrategyKey } from '../lib/types';
import { T, useLocale } from '../lib/i18n';
import { createClient } from '../lib/supabase/client';
import PlanogramView from './PlanogramView';
import PlanDeMasse from './PlanDeMasse';
import BuyerFrame from './BuyerFrame';
import Copilot from './Copilot';

const STRATEGY_ORDER: StrategyKey[] = ['balanced', 'rotation', 'margin', 'revenue'];

export default function CatPilotApp({ pro, presentationId = null }: { pro: boolean; presentationId?: string | null }) {
  const { locale } = useLocale();
  const t = T[locale].app;
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<StrategyKey>('balanced');
  const [fixture, setFixture] = useState<Fixture>(DEFAULT_FIXTURE);
  const inputRef = useRef<HTMLInputElement>(null);
  const [canSave, setCanSave] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const maxVariants = pro ? 4 : 1;

  // "Mes présentations": saving requires a signed-in Supabase user.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setCanSave(!!data.user));
  }, []);

  // Reopen a saved presentation (?pres=<id>) — RLS restricts to the owner.
  useEffect(() => {
    if (!presentationId) return;
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .from('presentations')
      .select('name, payload')
      .eq('id', presentationId)
      .single()
      .then(({ data }) => {
        const pl = data?.payload as { dataset?: ParsedDataset; fileName?: string; fixture?: Fixture; active?: StrategyKey } | undefined;
        if (pl?.dataset?.products?.length) {
          setDataset(pl.dataset);
          setFileName(pl.fileName || data?.name || '');
          if (pl.fixture) setFixture(pl.fixture);
          if (pl.active) setActive(pl.active);
        }
      });
  }, [presentationId]);

  async function savePresentation() {
    const supabase = createClient();
    if (!supabase || !dataset) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const name = window.prompt(t.savePrompt, fileName || 'CatPilot');
    if (!name) return;
    setSaveState('saving');
    const { error: err } = await supabase.from('presentations').insert({
      user_id: user.id,
      name,
      payload: { fileName, dataset, fixture, active },
    });
    setSaveState(err ? 'error' : 'saved');
    setTimeout(() => setSaveState('idle'), 2500);
  }

  // Expose the server-derived entitlement for debugging (read-only mirror).
  useEffect(() => {
    (window as unknown as { PRO: boolean }).PRO = pro;
  }, [pro]);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!['xlsx', 'xls', 'csv', 'txt'].includes(ext)) {
        throw new Error(
          locale === 'fr'
            ? `Extension « .${ext} » non prise en charge. Formats acceptés : Excel (.xlsx, .xls) ou CSV.`
            : `Unsupported “.${ext}” extension. Accepted formats: Excel (.xlsx, .xls) or CSV.`
        );
      }
      const buf = await file.arrayBuffer();
      // parseWorkbook lève des erreurs précises (fichier illisible, feuille
      // vide, colonnes d'identification absentes…) affichées telles quelles.
      const parsed = parseWorkbook(buf, file.name, locale);
      setDataset(parsed);
      setFileName(file.name);
      setActive('balanced');
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Erreur de lecture.');
    } finally {
      setBusy(false);
    }
  }

  function loadSample() {
    setError(null);
    setDataset({
      products: SAMPLE_PRODUCTS,
      detectedColumns: {
        brand: 'Marque',
        ean: 'EAN',
        name: 'Produit',
        segment: 'Segment',
        revenue: 'CA (€)',
        volume: 'Volume',
        margin: 'Marge (€)',
        price: 'Prix',
        isNew: 'Nouveauté',
      },
      warnings: [],
    });
    setFileName(SAMPLE_FILENAME);
    setActive('balanced');
  }

  const products = dataset?.products ?? [];

  const activeLocked = STRATEGY_ORDER.indexOf(active) >= maxVariants;

  const plano = useMemo(() => {
    if (!products.length) return null;
    return generatePlanogram(products, active, fixture, locale);
  }, [products, active, fixture, locale]);

  return (
    <div className="app">
      <div className="app-head">
        <div>
          <h1>{t.title}</h1>
          <p className="muted">{t.sub}</p>
        </div>
        <span className={`plan-badge ${pro ? 'is-pro' : 'is-free'}`}>{pro ? t.pro : t.demo}</span>
      </div>

      {!dataset && (
        <Uploader
          busy={busy}
          onPick={() => inputRef.current?.click()}
          onFile={handleFile}
          onSample={loadSample}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      {error && <div className="alert alert-error">{error}</div>}

      {dataset && (
        <>
          <div className="dataset-bar">
            <div className="dataset-info">
              <strong>{fileName}</strong>
              <span className="muted">
                {t.dsRefs(products.length, new Set(products.map((p) => p.brand)).size, products.filter((p) => p.isNew).length)}
              </span>
            </div>
            <div className="dataset-actions">
              <div className="fixture-controls">
                <label>
                  {t.shelves}
                  <select
                    value={fixture.shelves}
                    onChange={(e) => setFixture({ ...fixture, shelves: Number(e.target.value) })}
                  >
                    {[3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.facingsPerShelf}
                  <select
                    value={fixture.facingsPerShelf}
                    onChange={(e) => setFixture({ ...fixture, facingsPerShelf: Number(e.target.value) })}
                  >
                    {[8, 10, 12, 14, 16, 20].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
              {canSave && (
                <button className="btn btn-primary" onClick={savePresentation} disabled={saveState === 'saving'}>
                  {saveState === 'saving' ? t.saving : saveState === 'saved' ? t.savedOk : saveState === 'error' ? t.saveError : t.save}
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => inputRef.current?.click()}>
                {t.changeFile}
              </button>
            </div>
          </div>

          {dataset.warnings.length > 0 && (
            <div className="alert alert-warn">
              {dataset.warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}

          <details className="mapping">
            <summary>{t.mapping}</summary>
            <ul className="mapping-list">
              {Object.entries(FIELD_LABELS[locale]).map(([field, label]) => {
                const header = dataset.detectedColumns[field];
                return (
                  <li key={field} className={header ? '' : 'is-missing'}>
                    <span className="mapping-field">{label}</span>
                    <span className="mapping-header">{header ? `« ${header} »` : t.notDetected}</span>
                  </li>
                );
              })}
            </ul>
          </details>

          {/* Variant tabs */}
          <div className="variants">
            {STRATEGY_ORDER.map((key, i) => {
              const s = STRATEGY_TEXT[locale][key];
              const locked = i >= maxVariants;
              return (
                <button
                  key={key}
                  className={`variant-tab ${active === key ? 'active' : ''} ${locked ? 'locked' : ''}`}
                  onClick={() => setActive(key)}
                >
                  {s.label}
                  {locked && <span className="lock-mini">🔒</span>}
                </button>
              );
            })}
          </div>
          <p className="variant-desc">{STRATEGY_TEXT[locale][active].description}</p>

          {activeLocked ? (
            <div className="variant-lock">
              <div className="overlay-card">
                <h4>{t.lockTitle}</h4>
                <p>{t.lockText}</p>
                <Link href="/compte" className="btn btn-primary">{t.lockCta}</Link>
              </div>
            </div>
          ) : (
            plano && (
              <div className="results">
                <div className="results-grid">
                  <PlanDeMasse plano={plano} />
                  <Copilot products={products} pro={pro} />
                </div>
                <PlanogramView plano={plano} />
                <BuyerFrame plano={plano} locked={!pro} />
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

function Uploader({
  busy,
  onPick,
  onFile,
  onSample,
}: {
  busy: boolean;
  onPick: () => void;
  onFile: (f: File) => void;
  onSample: () => void;
}) {
  const { locale } = useLocale();
  const t = T[locale].app;
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`uploader ${drag ? 'drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <div className="uploader-icon" aria-hidden>⬆</div>
      <h2>{t.upTitle}</h2>
      <p className="muted">{t.upText}</p>
      <div className="uploader-actions">
        <button className="btn btn-primary" onClick={onPick} disabled={busy}>
          {busy ? t.upBusy : t.upBtn}
        </button>
        <button className="btn btn-ghost" onClick={onSample} disabled={busy}>
          {t.upSample}
        </button>
      </div>
      <p className="uploader-formats">{t.upFormats}</p>
    </div>
  );
}
