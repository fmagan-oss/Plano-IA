'use client';

import { useMemo } from 'react';
import type { Planogram, Product } from '../lib/types';
import { productivityDiagnostic } from '../lib/linear-diagnostic';
import type { Locale } from '../lib/i18n';
import { useLocale } from '../lib/i18n';

/**
 * Diagnostic linéaire (R10) affiché à l'écran : le signal d'arbitrage est la
 * PRODUCTIVITÉ par facing (CA / facing), pas le CA brut — car le CA observé est
 * déjà le produit de l'implantation actuelle (circularité). Forte productivité +
 * peu de facings = sous-linéarisé (potentiel bridé par l'espace).
 *
 * R9 (part de linéaire sur le linéaire DÉVELOPPÉ = facings × largeur) et R11
 * (plancher anti-rupture par la rotation) exigent des colonnes que le fichier ne
 * porte pas toujours (largeur, rotation, capacité, réappro) : on le signale
 * plutôt que d'inventer.
 */
const TXT: Record<Locale, Record<string, string>> = {
  fr: {
    title: 'Diagnostic linéaire — productivité',
    sub: 'Signal non biaisé : le CA par facing, pas le CA brut. Une marque très productive avec peu de facings est bridée par l’espace, pas par la demande (R10).',
    brand: 'Marque', prod: 'CA / facing', vs: 'vs moyenne', facings: 'Facings', verdict: 'Lecture',
    under: 'sous-linéarisée', over: 'sur-linéarisée', aligned: 'alignée',
    underHint: 'à renforcer', overHint: 'à réduire', alignedHint: 'cohérente',
    floorHint: 'déjà au plancher (1 facing)',
    mean: 'Productivité moyenne du rayon',
    note9: 'R9 — part de linéaire sur le linéaire développé (facings × largeur) : la largeur des facings n’est pas dans ce fichier. Le plan raisonne en facings ; la conclusion peut s’inverser d’une marque large à une marque étroite.',
    note11: 'R11 — plancher anti-rupture : rotation, capacité par facing et délai de réappro absents du fichier. Le facing minimum imposé par la rotation ne peut pas être calculé ici.',
    add: 'Ajoutez ces colonnes à l’export pour activer R9 et R11.',
  },
  en: {
    title: 'Shelf diagnostic — productivity',
    sub: 'Unbiased signal: value per facing, not raw value. A highly productive brand with few facings is capped by space, not demand (R10).',
    brand: 'Brand', prod: 'Value / facing', vs: 'vs mean', facings: 'Facings', verdict: 'Reading',
    under: 'under-spaced', over: 'over-spaced', aligned: 'aligned',
    underHint: 'reinforce', overHint: 'reduce', alignedHint: 'consistent',
    floorHint: 'already at floor (1 facing)',
    mean: 'Shelf mean productivity',
    note9: 'R9 — shelf share on developed linear (facings × width): facing widths are not in this file. The plan reasons in facings; the conclusion can flip between a wide and a narrow brand.',
    note11: 'R11 — anti-stockout floor: rotation, per-facing capacity and replenishment lead time are missing. The rotation-driven minimum facing cannot be computed here.',
    add: 'Add these columns to the export to enable R9 and R11.',
  },
};

export default function LinearDiagnostic({ plano, products }: { plano: Planogram; products: Product[] }) {
  const { locale } = useLocale();
  const t = TXT[locale];

  const diag = useMemo(() => {
    // CA par marque (depuis les produits) + facings par marque (depuis le plan).
    const revByBrand = new Map<string, number>();
    for (const p of products) revByBrand.set(p.brand, (revByBrand.get(p.brand) ?? 0) + Math.max(p.revenue, 0));
    const rows = plano.brandBlocks.map((b) => ({
      label: b.brand,
      revenue: revByBrand.get(b.brand) ?? 0,
      facings: b.facings,
    }));
    return productivityDiagnostic(rows);
  }, [plano, products]);

  const fmtEur = (n: number) => Math.round(n).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB');
  // Marques les plus significatives d'abord (par CA), pour une lecture rapide.
  const rows = [...diag.rows].sort((a, b) => b.revenue - a.revenue);

  // Un « sur-linéarisé » déjà à 1 facing ne peut pas être réduit (c'est le
  // plancher que R11 protège) : on le dit au lieu de conseiller de réduire.
  const statusMeta = (s: string, facings: number) =>
    s === 'sous-linéarisé'
      ? { cls: 'under', label: t.under, hint: t.underHint }
      : s === 'sur-linéarisé'
      ? { cls: 'over', label: t.over, hint: facings <= 1 ? t.floorHint : t.overHint }
      : { cls: 'aligned', label: t.aligned, hint: t.alignedHint };

  return (
    <div className="card diag-card">
      <div className="card-head">
        <h2>{t.title}</h2>
        <span className="ctx">{t.mean} : <b>{fmtEur(diag.meanProductivity)} €</b></span>
      </div>
      <p className="hint" style={{ marginTop: '.2rem' }}>{t.sub}</p>

      <div className="tbl-scroll">
        <table className="mini2 diag-table">
          <thead>
            <tr>
              <th>{t.brand}</th>
              <th style={{ textAlign: 'right' }}>{t.prod}</th>
              <th style={{ textAlign: 'right' }}>{t.vs}</th>
              <th style={{ textAlign: 'right' }}>{t.facings}</th>
              <th>{t.verdict}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const m = statusMeta(r.status, r.facings);
              return (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmtEur(r.productivity)} €</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.ratioToMean.toFixed(2)}×</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.facings}</td>
                  <td>
                    <span className={`diag-chip diag-${m.cls}`}>{m.label}</span>
                    <span className="muted" style={{ marginLeft: '.4rem', fontSize: '.8rem' }}>{m.hint}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="diag-limits">
        <p className="hint">⚠ {t.note9}</p>
        <p className="hint">⚠ {t.note11}</p>
        <p className="hint"><b>{t.add}</b></p>
      </div>
    </div>
  );
}
