/**
 * Diagnostic linéaire — règles R9, R10, R11 de la formation (le « moteur
 * d'allocation », brique 4). Fonctions PURES : on donne les colonnes lues par le
 * parseur, on obtient un verdict sur/sous-linéarisation, jamais un chiffre
 * « deviné ». Chaque fonction reproduit exactement le corrigé (EX09/EX10/EX11) et
 * signale ce qu'elle ne peut pas faire (largeurs absentes, rotation manquante).
 *
 * Principe commun : on ne descend jamais sous le plancher anti-rupture (R11), la
 * part de linéaire se lit sur le linéaire *développé* (R9), et le signal
 * d'arbitrage est la *productivité par facing*, pas le CA brut (R10) — car le CA
 * observé est déjà le produit de l'implantation actuelle (circularité).
 */

/** R9 — part de marché vs part de linéaire, sur le linéaire DÉVELOPPÉ. */
export interface PdlRow {
  label: string;
  revenue: number;
  facings: number;
  /** Largeur d'un facing (cm). Si absente pour une ligne, R9 ne peut pas se
   * calculer sur le linéaire développé — on le signale et on retombe sur les
   * facings, en avertissant que la conclusion peut s'inverser. */
  width?: number;
}

export interface PdlVerdict {
  label: string;
  pdm: number; // part de marché (CA)
  pdlFacings: number; // part de linéaire, comptée en facings
  pdlLinear: number | null; // part de linéaire, comptée en linéaire développé (null si largeurs absentes)
  /** Écart PDL(linéaire) − PDM en points (positif = sur-linéarisé). */
  gapLinear: number | null;
  gapFacings: number;
  status: 'sur-linéarisé' | 'sous-linéarisé' | 'aligné' | 'indéterminé';
}

export interface PdlResult {
  rows: PdlVerdict[];
  /** Vrai si au moins une largeur manque : PDL développée non fiable. */
  widthsMissing: boolean;
  warnings: string[];
}

const isTotalLabel = (s: string) =>
  /^(sous.?\s*|ss\s+|grand\s+)?total\b|^ensemble\b|^rayon\b/i.test(s.trim());

/** R9 : PDL sur linéaire développé (facings × largeur), pas sur le nb de facings. */
export function pdlDiagnostic(rows: PdlRow[], seuilPt = 5): PdlResult {
  const real = rows.filter((r) => r.label && !isTotalLabel(r.label));
  const totRev = real.reduce((s, r) => s + Math.max(r.revenue, 0), 0) || 1;
  const totFac = real.reduce((s, r) => s + Math.max(r.facings, 0), 0) || 1;
  const widthsMissing = real.some((r) => !(typeof r.width === 'number' && r.width > 0));
  const totLin = real.reduce((s, r) => s + Math.max(r.facings, 0) * (r.width ?? 0), 0);

  const verdicts: PdlVerdict[] = real.map((r) => {
    const pdm = Math.max(r.revenue, 0) / totRev;
    const pdlFacings = Math.max(r.facings, 0) / totFac;
    const pdlLinear = !widthsMissing && totLin > 0 ? (Math.max(r.facings, 0) * (r.width as number)) / totLin : null;
    const gapLinear = pdlLinear == null ? null : pdlLinear - pdm;
    const gapFacings = pdlFacings - pdm;
    // Le verdict s'appuie sur le linéaire développé si disponible, sinon facings.
    const gap = gapLinear ?? gapFacings;
    const status: PdlVerdict['status'] =
      pdlLinear == null && widthsMissing
        ? (Math.abs(gapFacings) * 100 < seuilPt ? 'aligné' : gapFacings > 0 ? 'sur-linéarisé' : 'sous-linéarisé')
        : Math.abs(gap) * 100 < seuilPt
        ? 'aligné'
        : gap > 0
        ? 'sur-linéarisé'
        : 'sous-linéarisé';
    return { label: r.label.trim(), pdm, pdlFacings, pdlLinear, gapLinear, gapFacings, status };
  });

  const warnings: string[] = [];
  if (widthsMissing) {
    warnings.push(
      'Largeurs de facing absentes : la part de linéaire est calculée sur le NOMBRE de facings, ' +
        'pas sur le linéaire développé (facings × largeur). La conclusion peut s’inverser d’une ' +
        'marque large à une marque étroite — fournissez la largeur par référence pour fiabiliser (R9).'
    );
  }
  return { rows: verdicts, widthsMissing, warnings };
}

/** R10 — productivité par facing (CA / facing), pas le CA brut (circularité). */
export interface ProductivityRow {
  label: string;
  revenue: number;
  facings: number;
}

export interface ProductivityVerdict {
  label: string;
  revenue: number;
  facings: number;
  productivity: number; // CA / facing
  ratioToMean: number; // productivité / productivité moyenne du rayon
  status: 'sous-linéarisé' | 'sur-linéarisé' | 'aligné';
}

export interface ProductivityResult {
  meanProductivity: number;
  rows: ProductivityVerdict[];
  note: string;
}

/**
 * R10 : le CA observé est déjà biaisé par l'implantation (un produit vend
 * beaucoup en partie parce qu'il a beaucoup de facings). Le signal non biaisé est
 * la productivité par facing : au-dessus de la moyenne = sous-linéarisé
 * (potentiel bridé par l'espace), en dessous = sur-linéarisé.
 */
export function productivityDiagnostic(rows: ProductivityRow[], bande = 0.15): ProductivityResult {
  const real = rows.filter((r) => r.label && !isTotalLabel(r.label) && r.facings > 0);
  const totRev = real.reduce((s, r) => s + Math.max(r.revenue, 0), 0);
  const totFac = real.reduce((s, r) => s + Math.max(r.facings, 0), 0) || 1;
  const mean = totRev / totFac;
  const verdicts: ProductivityVerdict[] = real.map((r) => {
    const productivity = Math.max(r.revenue, 0) / r.facings;
    const ratio = mean > 0 ? productivity / mean : 1;
    const status: ProductivityVerdict['status'] =
      ratio > 1 + bande ? 'sous-linéarisé' : ratio < 1 - bande ? 'sur-linéarisé' : 'aligné';
    return { label: r.label.trim(), revenue: r.revenue, facings: r.facings, productivity, ratioToMean: ratio, status };
  });
  return {
    meanProductivity: mean,
    rows: verdicts,
    note:
      'Arbitrage lu sur la productivité par facing, pas sur le CA brut : une référence à forte ' +
      'productivité avec peu de facings est plafonnée par l’espace, pas par la demande (R10).',
  };
}

/** R11 — plancher anti-rupture : facings mini imposés par la rotation. */
export interface RuptureRow {
  label: string;
  /** Rotation en UVC / magasin / semaine. */
  rotationPerWeek: number;
  facings: number;
  /** Capacité (UVC) tenue par un facing. */
  capacityPerFacing: number;
  /** Délai de réappro en jours. */
  reapproDays: number;
}

export interface RuptureVerdict {
  label: string;
  /** Besoin = rotation/jour × jours de réappro × coef de pointe. */
  demandOverLeadTime: number;
  shelfStock: number; // facings × capacité
  minFacings: number; // ceil(besoin / capacité)
  status: 'rupture' | 'sur-stocké' | 'ok';
}

export interface RuptureResult {
  rows: RuptureVerdict[];
  coefPointe: number;
  note: string;
}

/**
 * R11 : la rotation, pas le CA, fixe le nombre MINIMUM de facings. Le plancher
 * est une contrainte, jamais un critère : on ne descend pas dessous — si l'espace
 * ne le permet pas, la décision est le déréférencement, pas le sous-facing.
 * `coefPointe` est un paramètre à calibrer par catégorie/enseigne (défaut 1),
 * jamais une constante universelle.
 */
export function ruptureFloor(rows: RuptureRow[], coefPointe = 1): RuptureResult {
  const real = rows.filter((r) => r.label && !isTotalLabel(r.label));
  const verdicts: RuptureVerdict[] = real.map((r) => {
    const perDay = r.rotationPerWeek / 7;
    const demand = perDay * r.reapproDays * coefPointe;
    const stock = r.facings * r.capacityPerFacing;
    const minFacings = r.capacityPerFacing > 0 ? Math.ceil(demand / r.capacityPerFacing) : Infinity;
    // Rupture si le stock rayon ne couvre pas le besoin sur le délai de réappro.
    // Sur-stocké seulement si l'on tient au moins DEUX fois le plancher : un
    // facing au-dessus du plancher reste « OK » (marge de sécurité normale) ;
    // c'est l'excès franc qui devient un candidat à la réduction (paramétrable).
    const status: RuptureVerdict['status'] =
      stock < demand ? 'rupture' : r.facings >= 2 * minFacings ? 'sur-stocké' : 'ok';
    return { label: r.label.trim(), demandOverLeadTime: demand, shelfStock: stock, minFacings, status };
  });
  return {
    rows: verdicts,
    coefPointe,
    note:
      'Plancher anti-rupture appliqué AVANT toute pondération : facings_mini = arrondi_sup( ' +
      '(rotation/jour × jours_réappro × coef_pointe) / capacité_par_facing ). On ne descend jamais ' +
      'sous ce plancher ; si l’espace manque, on déréférence (R11).',
  };
}
