'use client';

import { useMemo } from 'react';
import type { Planogram, Product } from '../lib/types';
import { productivityDiagnostic, pdlDiagnostic, ruptureFloor } from '../lib/linear-diagnostic';
import type { Locale } from '../lib/i18n';
import { useLocale } from '../lib/i18n';

/**
 * Diagnostics linéaire à l'écran, par règle :
 *  - R10 (toujours) : sur/sous-linéarisation lue sur la PRODUCTIVITÉ par facing
 *    (CA/facing), pas le CA brut — car le CA observé est déjà le produit de
 *    l'implantation (circularité).
 *  - R9 (si largeur + facings actuels dans le fichier) : part de linéaire sur le
 *    linéaire DÉVELOPPÉ (facings × largeur), pas le nombre de facings.
 *  - R11 (si rotation + capacité + réappro) : plancher anti-rupture par la
 *    rotation. Sans ces colonnes, la déclinaison N'EST PAS proposée (rien inventé).
 *  - Divergence : quand deux méthodes indépendantes se contredisent, on le dit.
 */
const TXT: Record<Locale, Record<string, string>> = {
  fr: {
    title: 'Diagnostic linéaire — productivité',
    sub: 'Signal non biaisé : le CA par facing, pas le CA brut. Une marque très productive avec peu de facings est bridée par l’espace, pas par la demande (R10).',
    brand: 'Marque', prod: 'CA / facing', vs: 'vs moyenne', facings: 'Facings', verdict: 'Lecture',
    under: 'sous-linéarisée', over: 'sur-linéarisée', aligned: 'alignée',
    underHint: 'à renforcer', overHint: 'à réduire', alignedHint: 'cohérente', floorHint: 'déjà au plancher (1 facing)',
    mean: 'Productivité moyenne du rayon',
    // Audit
    auditTitle: 'Audit du relevé linéaire',
    auditSub: 'Le fichier porte des colonnes de relevé (facings actuels, largeur, rotation) : on audite l’implantation existante.',
    r9title: 'R9 — part de linéaire sur le linéaire développé',
    r9sub: 'PDL calculée sur facings × largeur, pas sur le nombre de facings — la conclusion peut s’inverser d’une marque large à une marque étroite.',
    ref: 'Référence', pdm: 'PDM (CA)', pdlf: 'PDL facings', pdll: 'PDL développée', gap: 'Écart',
    r11title: 'R11 — plancher anti-rupture (rotation)',
    r11sub: 'La rotation, pas le CA, fixe le nombre minimum de facings. Contrainte, jamais critère : on ne descend pas dessous ; si l’espace manque, on déréférence.',
    need: 'Besoin', floor: 'Facings mini', cur: 'Actuels', state: 'État',
    rupture: 'rupture', overstock: 'sur-stocké', ok: 'ok',
    divTitle: 'Convergence des méthodes',
    divConverge: 'Productivité et rotation désignent la MÊME référence — attribution solide :',
    divDiverge: 'Les deux méthodes se contredisent sur ces références — à trancher à la main, pas au hasard :',
    reinforce: 'à renforcer', reduce: 'à réduire',
  },
  en: {
    title: 'Shelf diagnostic — productivity',
    sub: 'Unbiased signal: value per facing, not raw value. A highly productive brand with few facings is capped by space, not demand (R10).',
    brand: 'Brand', prod: 'Value / facing', vs: 'vs mean', facings: 'Facings', verdict: 'Reading',
    under: 'under-spaced', over: 'over-spaced', aligned: 'aligned',
    underHint: 'reinforce', overHint: 'reduce', alignedHint: 'consistent', floorHint: 'already at floor (1 facing)',
    mean: 'Shelf mean productivity',
    auditTitle: 'Shelf audit',
    auditSub: 'The file carries audit columns (current facings, width, rotation): we audit the existing layout.',
    r9title: 'R9 — shelf share on developed linear',
    r9sub: 'Share on facings × width, not facing count — the conclusion can flip between a wide and a narrow brand.',
    ref: 'Item', pdm: 'Value share', pdlf: 'Facing share', pdll: 'Developed share', gap: 'Gap',
    r11title: 'R11 — anti-stockout floor (rotation)',
    r11sub: 'Rotation, not value, sets the minimum facings. A constraint, never a criterion: never go below; if space is short, delist.',
    need: 'Need', floor: 'Min facings', cur: 'Current', state: 'State',
    rupture: 'stockout', overstock: 'overstocked', ok: 'ok',
    divTitle: 'Method convergence',
    divConverge: 'Productivity and rotation point to the SAME item — solid call:',
    divDiverge: 'The two methods disagree on these items — decide by hand, not at random:',
    reinforce: 'reinforce', reduce: 'reduce',
  },
};

export default function LinearDiagnostic({ plano, products }: { plano: Planogram; products: Product[] }) {
  const { locale } = useLocale();
  const t = TXT[locale];
  const fmt = (n: number) => Math.round(n).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB');
  // Libellé de référence : le vrai nom produit, sinon la marque (pas le « Réf. N »).
  const refLabel = (p: Product) => (p.name && !/^(Réf\.|EAN )/.test(p.name) ? p.name : p.brand);

  // R10 — sur la répartition proposée (blocs marques du plan généré).
  const r10 = useMemo(() => {
    const rev = new Map<string, number>();
    for (const p of products) rev.set(p.brand, (rev.get(p.brand) ?? 0) + Math.max(p.revenue, 0));
    return productivityDiagnostic(plano.brandBlocks.map((b) => ({ label: b.brand, revenue: rev.get(b.brand) ?? 0, facings: b.facings })));
  }, [plano, products]);

  // Colonnes d'audit disponibles ? (sinon on ne propose pas R9 / R11.)
  const hasR9 = products.some((p) => (p.widthCm ?? 0) > 0 && (p.currentFacings ?? 0) > 0);
  const hasR11 = products.some((p) => (p.rotationPerWeek ?? 0) > 0 && (p.capacityPerFacing ?? 0) > 0 && (p.reapproDays ?? 0) > 0);

  const r9 = useMemo(() => {
    if (!hasR9) return null;
    return pdlDiagnostic(
      products.filter((p) => (p.currentFacings ?? 0) > 0).map((p) => ({
        label: refLabel(p), revenue: p.revenue, facings: p.currentFacings as number, width: p.widthCm,
      }))
    );
  }, [products, hasR9]);

  const r11 = useMemo(() => {
    if (!hasR11) return null;
    return ruptureFloor(
      products.filter((p) => (p.rotationPerWeek ?? 0) > 0).map((p) => ({
        label: refLabel(p), rotationPerWeek: p.rotationPerWeek as number,
        facings: p.currentFacings ?? 0, capacityPerFacing: p.capacityPerFacing as number, reapproDays: p.reapproDays as number,
      }))
    );
  }, [products, hasR11]);

  // Divergence EX10+EX11 : productivité (sur relevé) vs plancher rotation.
  const divergence = useMemo(() => {
    if (!r11) return null;
    const withFac = products.filter((p) => (p.currentFacings ?? 0) > 0 && (p.rotationPerWeek ?? 0) > 0);
    if (withFac.length < 2) return null;
    const prod = productivityDiagnostic(withFac.map((p) => ({ label: refLabel(p), revenue: p.revenue, facings: p.currentFacings as number })));
    const rmap = new Map(r11.rows.map((r) => [r.label, r]));
    const converge: string[] = [];
    const diverge: string[] = [];
    for (const pr of prod.rows) {
      const ru = rmap.get(pr.label);
      if (!ru) continue;
      const prodReinforce = pr.status === 'sous-linéarisé'; // forte productivité
      const prodReduce = pr.status === 'sur-linéarisé';
      const ruReinforce = ru.status === 'rupture';
      const ruReduce = ru.status === 'sur-stocké';
      if ((prodReinforce && ruReinforce) || (prodReduce && ruReduce)) converge.push(pr.label);
      else if ((prodReinforce && ruReduce) || (prodReduce && ruReinforce)) diverge.push(pr.label);
    }
    return { converge, diverge };
  }, [products, r11]);

  const statusMeta = (s: string, facings: number) =>
    s === 'sous-linéarisé'
      ? { cls: 'under', label: t.under, hint: t.underHint }
      : s === 'sur-linéarisé'
      ? { cls: 'over', label: t.over, hint: facings <= 1 ? t.floorHint : t.overHint }
      : { cls: 'aligned', label: t.aligned, hint: t.alignedHint };

  const r10rows = [...r10.rows].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="card diag-card">
      <div className="card-head">
        <h2>{t.title}</h2>
        <span className="ctx">{t.mean} : <b>{fmt(r10.meanProductivity)} €</b></span>
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
            {r10rows.map((r) => {
              const m = statusMeta(r.status, r.facings);
              return (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.productivity)} €</td>
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

      {(r9 || r11) && (
        <div className="diag-audit">
          <h3>{t.auditTitle}</h3>
          <p className="hint">{t.auditSub}</p>

          {r9 && (
            <div className="diag-block">
              <h4>{t.r9title}</h4>
              <p className="hint">{t.r9sub}{r9.widthsMissing ? ` ⚠ ${r9.warnings[0] ?? ''}` : ''}</p>
              <div className="tbl-scroll">
                <table className="mini2 diag-table">
                  <thead><tr><th>{t.ref}</th><th style={{ textAlign: 'right' }}>{t.pdm}</th><th style={{ textAlign: 'right' }}>{t.pdlf}</th><th style={{ textAlign: 'right' }}>{t.pdll}</th><th style={{ textAlign: 'right' }}>{t.gap}</th><th>{t.verdict}</th></tr></thead>
                  <tbody>
                    {r9.rows.map((r) => {
                      const cls = r.status === 'sous-linéarisé' ? 'under' : r.status === 'sur-linéarisé' ? 'over' : 'aligned';
                      const g = r.gapLinear ?? r.gapFacings;
                      return (
                        <tr key={r.label}>
                          <td>{r.label}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{(r.pdm * 100).toFixed(1)}%</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{(r.pdlFacings * 100).toFixed(1)}%</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.pdlLinear == null ? '—' : `${(r.pdlLinear * 100).toFixed(1)}%`}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{g >= 0 ? '+' : ''}{(g * 100).toFixed(1)} pt</td>
                          <td><span className={`diag-chip diag-${cls}`}>{r.status === 'sous-linéarisé' ? t.under : r.status === 'sur-linéarisé' ? t.over : t.aligned}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {r11 && (
            <div className="diag-block">
              <h4>{t.r11title}</h4>
              <p className="hint">{t.r11sub}</p>
              <div className="tbl-scroll">
                <table className="mini2 diag-table">
                  <thead><tr><th>{t.ref}</th><th style={{ textAlign: 'right' }}>{t.need}</th><th style={{ textAlign: 'right' }}>{t.floor}</th><th style={{ textAlign: 'right' }}>{t.cur}</th><th>{t.state}</th></tr></thead>
                  <tbody>
                    {r11.rows.map((r) => {
                      const cls = r.status === 'rupture' ? 'under' : r.status === 'sur-stocké' ? 'over' : 'aligned';
                      const cur = products.find((p) => refLabel(p) === r.label)?.currentFacings ?? 0;
                      const label = r.status === 'rupture' ? t.rupture : r.status === 'sur-stocké' ? t.overstock : t.ok;
                      return (
                        <tr key={r.label}>
                          <td>{r.label}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.demandOverLeadTime.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}><b>{r.minFacings}</b></td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{cur}</td>
                          <td><span className={`diag-chip diag-${cls}`}>{label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {divergence && (divergence.converge.length > 0 || divergence.diverge.length > 0) && (
            <div className="diag-block">
              <h4>{t.divTitle}</h4>
              {divergence.converge.length > 0 && (
                <p className="hint"><span className="diag-chip diag-under">✓</span> {t.divConverge} <b>{divergence.converge.join(', ')}</b>.</p>
              )}
              {divergence.diverge.length > 0 && (
                <p className="hint"><span className="diag-chip diag-over">!</span> {t.divDiverge} <b>{divergence.diverge.join(', ')}</b>.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
