/**
 * Point 4 — LECTEUR DE PLAN OFFICIEL (distributeur).
 *
 * Un plan officiel (ex. « Assouplissants T3 » Carrefour) porte, par référence :
 * position, désignation, typo, nombre de facings, et un EAN (imprimé sous le
 * code-barres). Le meuble et le sens trafic sont dans l'en-tête. C'est le
 * squelette RÉEL du rayon : on le lit tel quel, puis on re-pondère les facings à
 * la SKU selon les performances (étape ultérieure).
 *
 * Ce module est la LOGIQUE DE DOMAINE (pure, testable) : parse du meuble,
 * alignement EAN ↔ lignes, garde-fous, validation EAN-13. L'EXTRACTION brute
 * (texte du PDF + décodage des codes-barres images) est une couche adaptateur
 * injectée — elle a besoin de libs (pdf + barcode) et vit hors de ce module ;
 * ici on reçoit déjà des `rows` et des `eans` (ordre haut→bas = ordre des lignes).
 *
 * Règle d'or : on ne devine jamais. Meuble illisible, nombre d'EAN ≠ nombre de
 * lignes, EAN au checksum invalide → on signale (motif clair), on n'invente pas.
 */

export interface OfficialFixture {
  /** Typologie déclarée (ex. « TYPOLOGIE 3 » → 3), ou null si absente. */
  typologie: number | null;
  /** Nombre de niveaux (planches). */
  shelves: number;
  /** Largeur d'un élément de meuble, en cm. */
  elementWidthCm: number;
}

export interface OfficialSku {
  position: number;
  name: string;
  /** Typologie de la réf. (colonne « Typo »), ou null. */
  typo: number | null;
  facings: number;
  /** EAN-13 validé, ou null si absent/illisible/checksum invalide. */
  ean: string | null;
  /** Bloc segment d'appartenance (ex. « DILUES »), si connu. */
  segment?: string;
}

export interface OfficialPlan {
  retailer?: string;
  category?: string;
  date?: string;
  fixture: OfficialFixture;
  /** Sens trafic gauche → droite (entrée de rayon à gauche). */
  trafficLeftToRight: boolean;
  /** Blocs segments déclarés dans le plan (ordre de lecture). */
  segments: string[];
  skus: OfficialSku[];
  /** Anomalies non bloquantes (ex. EAN illisibles) signalées, jamais masquées. */
  warnings: string[];
}

export interface OfficialPlanInput {
  retailer?: string;
  category?: string;
  date?: string;
  /** Ligne meuble brute, ex. « TYPOLOGIE 3 - 5 x 133 cm ». */
  fixtureLine: string;
  trafficLeftToRight?: boolean;
  segments?: string[];
  /** Lignes du tableau, dans l'ordre du plan. */
  rows: { position: number; name: string; typo: number | null; facings: number }[];
  /** EAN décodés (haut→bas = ordre des lignes). Longueur DOIT égaler rows. */
  eans?: (string | null)[];
}

export interface OfficialPlanResult {
  plan: OfficialPlan | null;
  /** Motif clair si le plan n'est pas produit (règle d'or). */
  error: string | null;
}

/** Valide un EAN-13 par sa clé de contrôle (rejette un décodage/OCR douteux). */
export function isValidEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const d = code.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += d[i] * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return check === d[12];
}

/**
 * Parse la ligne meuble « TYPOLOGIE 3 - 5 x 133 cm » → { typologie, shelves,
 * elementWidthCm }. Retourne null si les cotes essentielles (niveaux × largeur)
 * sont introuvables — on ne devine pas un meuble.
 */
export function parseFixtureLine(line: string): OfficialFixture | null {
  if (!line) return null;
  const s = line.toLowerCase().replace(/\s+/g, ' ').trim();
  // « 5 x 133 cm » (niveaux x largeur cm)
  const m = s.match(/(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/);
  if (!m) return null;
  const shelves = parseInt(m[1], 10);
  const elementWidthCm = parseFloat(m[2].replace(',', '.'));
  if (!(shelves > 0) || !(elementWidthCm > 0)) return null;
  const typoM = s.match(/typologie\s*(\d+)/);
  return {
    typologie: typoM ? parseInt(typoM[1], 10) : null,
    shelves,
    elementWidthCm,
  };
}

/**
 * Assemble un plan officiel structuré à partir des primitives déjà extraites.
 * Garde-fous (règle d'or) :
 *  - meuble illisible → pas de plan, motif ;
 *  - EAN fournis mais nombre ≠ nombre de lignes → pas de plan (alignement non
 *    fiable, on ne devine pas l'association) ;
 *  - EAN au checksum invalide → mis à null + signalé (jamais attaché en silence).
 */
export function assembleOfficialPlan(input: OfficialPlanInput): OfficialPlanResult {
  const fixture = parseFixtureLine(input.fixtureLine);
  if (!fixture) {
    return { plan: null, error: `Meuble illisible : « ${input.fixtureLine || '—'} » (niveaux × largeur introuvables). Aucun plan produit.` };
  }
  if (!input.rows.length) {
    return { plan: null, error: 'Aucune ligne de référence lue dans le plan officiel. Aucun plan produit.' };
  }
  const hasEans = Array.isArray(input.eans);
  if (hasEans && input.eans!.length !== input.rows.length) {
    return {
      plan: null,
      error: `Alignement codes-barres ↔ lignes non fiable : ${input.eans!.length} EAN pour ${input.rows.length} lignes. `
        + `On ne devine pas l'association — aucun plan produit.`,
    };
  }

  const warnings: string[] = [];
  let invalidEan = 0;
  const skus: OfficialSku[] = input.rows.map((r, i) => {
    let ean: string | null = null;
    if (hasEans) {
      const raw = (input.eans![i] ?? '').replace(/\D+/g, '');
      if (raw && isValidEan13(raw)) ean = raw;
      else if (raw) invalidEan++; // décodé mais checksum KO → non attaché
    }
    return { position: r.position, name: r.name, typo: r.typo, facings: r.facings, ean };
  });

  if (invalidEan > 0) {
    warnings.push(`${invalidEan} code(s)-barres décodé(s) au checksum EAN-13 invalide — non attaché(s) (à revérifier), jamais deviné(s).`);
  }

  return {
    plan: {
      retailer: input.retailer,
      category: input.category,
      date: input.date,
      fixture,
      trafficLeftToRight: input.trafficLeftToRight ?? true,
      segments: input.segments ?? [],
      skus,
      warnings,
    },
    error: null,
  };
}
