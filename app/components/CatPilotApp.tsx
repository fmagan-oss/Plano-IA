'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { parseWorkbook } from '../lib/parse';
import { generatePlanogram, STRATEGIES, DEFAULT_FIXTURE } from '../lib/planogram';
import { SAMPLE_PRODUCTS, SAMPLE_FILENAME } from '../lib/sample';
import type { Fixture, ParsedDataset, StrategyKey } from '../lib/types';
import PlanogramView from './PlanogramView';
import PlanDeMasse from './PlanDeMasse';
import BuyerFrame from './BuyerFrame';
import Copilot from './Copilot';

const STRATEGY_ORDER: StrategyKey[] = ['balanced', 'rotation', 'margin', 'revenue'];

export default function CatPilotApp({ pro }: { pro: boolean }) {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<StrategyKey>('balanced');
  const [fixture, setFixture] = useState<Fixture>(DEFAULT_FIXTURE);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxVariants = pro ? 4 : 1;

  // Expose the server-derived entitlement for debugging (read-only mirror).
  useEffect(() => {
    (window as unknown as { PRO: boolean }).PRO = pro;
  }, [pro]);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseWorkbook(buf, file.name);
      if (!parsed.products.length) {
        setError('Aucune donnée exploitable dans ce fichier. Vérifiez qu’il contient au moins une colonne marque ou produit.');
        setBusy(false);
        return;
      }
      setDataset(parsed);
      setFileName(file.name);
      setActive('balanced');
    } catch (e) {
      setError('Impossible de lire le fichier. Formats acceptés : .xlsx, .xls, .csv.');
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
    return generatePlanogram(products, active, fixture);
  }, [products, active, fixture]);

  return (
    <div className="app">
      <div className="app-head">
        <div>
          <h1>Application CatPilot</h1>
          <p className="muted">Générateur de planogrammes au facing à partir d’un export panel.</p>
        </div>
        <span className={`plan-badge ${pro ? 'is-pro' : 'is-free'}`}>{pro ? 'Pro' : 'Démo'}</span>
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
                {products.length} références · {new Set(products.map((p) => p.brand)).size} marques ·{' '}
                {products.filter((p) => p.isNew).length} nouveauté(s)
              </span>
            </div>
            <div className="dataset-actions">
              <FixtureControls fixture={fixture} setFixture={setFixture} />
              <button className="btn btn-ghost" onClick={() => inputRef.current?.click()}>
                Changer de fichier
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

          {/* Variant tabs */}
          <div className="variants">
            {STRATEGY_ORDER.map((key, i) => {
              const s = STRATEGIES[key];
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
          <p className="variant-desc">{STRATEGIES[active].description}</p>

          {activeLocked ? (
            <VariantLock />
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
      <h2>Importez votre export panel</h2>
      <p className="muted">Glissez un fichier Excel/CSV (Nielsen, Circana…) ou parcourez vos fichiers.</p>
      <div className="uploader-actions">
        <button className="btn btn-primary" onClick={onPick} disabled={busy}>
          {busy ? 'Lecture…' : 'Choisir un fichier'}
        </button>
        <button className="btn btn-ghost" onClick={onSample} disabled={busy}>
          Charger le jeu d’exemple
        </button>
      </div>
      <p className="uploader-formats">Colonnes reconnues automatiquement : marque, produit, segment, CA, volume, marge, prix, nouveauté.</p>
    </div>
  );
}

function FixtureControls({ fixture, setFixture }: { fixture: Fixture; setFixture: (f: Fixture) => void }) {
  return (
    <div className="fixture-controls">
      <label>
        Niveaux
        <select
          value={fixture.shelves}
          onChange={(e) => setFixture({ ...fixture, shelves: Number(e.target.value) })}
        >
          {[3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label>
        Facings/niveau
        <select
          value={fixture.facingsPerShelf}
          onChange={(e) => setFixture({ ...fixture, facingsPerShelf: Number(e.target.value) })}
        >
          {[8, 10, 12, 14, 16, 20].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function VariantLock() {
  return (
    <div className="variant-lock">
      <div className="overlay-card">
        <h4>Variante réservée au Pro</h4>
        <p>
          La démo donne accès à <strong>1 variante</strong>. Passez en Pro pour comparer les 4 stratégies
          (Équilibré, Rotation, Marge, CA) et débloquer la trame acheteur.
        </p>
        <Link href="/compte" className="btn btn-primary">
          Passer en Pro
        </Link>
      </div>
    </div>
  );
}
