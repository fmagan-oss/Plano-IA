import * as XLSX from 'xlsx';
import type { ParsedDataset, Product } from './types';
import type { Locale } from './i18n';
import ALIASES_JSON from './column-aliases.json';
import SIGN_JSON from './column-signatures.json';

/**
 * Fuzzy column detection for Nielsen / Circana style exports.
 * The alias dictionary lives in column-aliases.json — it is the file enriched
 * by the nightly training routine (scripts/train-parser.mjs) and by
 * user "bad read" reports. Matching is accent/case-insensitive, substring.
 */
const COLUMN_ALIASES: Record<string, string[]> = ALIASES_JSON as Record<string, string[]>;

/** Fields the AI mapping fallback and reports operate on. */
export const MAPPABLE_FIELDS = Object.keys(COLUMN_ALIASES);

/** Libellés métier utilisés dans les diagnostics et l'affichage du mapping. */
export const FIELD_LABELS: Record<Locale, Record<string, string>> = {
  fr: {
    brand: 'Marque', ean: 'EAN / gencod', name: 'Libellé produit', segment: 'Segment',
    revenue: 'CA', volume: 'Volume', margin: 'Marge', price: 'Prix', isNew: 'Nouveauté',
  },
  en: {
    brand: 'Brand', ean: 'EAN / barcode', name: 'Product label', segment: 'Segment',
    revenue: 'Value', volume: 'Volume', margin: 'Margin', price: 'Price', isNew: 'Novelty',
  },
};

/** Messages de diagnostic localisés. */
const DIAG: Record<Locale, Record<string, string>> = {
  fr: {
    unreadable: "n'a pas pu être lu comme un classeur. Formats pris en charge : .xlsx, .xls, .csv.",
    noSheet: 'ne contient aucune feuille de calcul.',
    emptySheet: 'est vide : aucune ligne trouvée.',
    eanAndNameMissing: 'Vision à l’EAN manquante : aucune colonne EAN/gencod ni libellé produit détectée — les références ne peuvent pas être identifiées individuellement.',
    eanMissing: 'Vision à l’EAN manquante : colonne EAN/gencod non détectée — l’identification des références se fait par libellé produit.',
    brandMissing: 'Colonne « Marque / fabricant » non détectée — regroupement par blocs marque impossible.',
    noKpi: 'Ni CA ni volume détectés — l’allocation de facing sera uniforme (non pondérée).',
    revenueMissing: 'Colonne « CA » non détectée — la variante CA et l’écart linéaire/CA seront indisponibles.',
    volumeMissing: 'Colonne « Volume » non détectée — la variante Rotation sera moins fiable.',
    marginMissing: 'Colonne « Marge » non détectée — la variante Marge utilisera une pondération par défaut.',
    newMissing: 'Colonne « Nouveauté » non détectée — aucune innovation ne sera mise en avant.',
  },
  en: {
    unreadable: 'could not be read as a workbook. Supported formats: .xlsx, .xls, .csv.',
    noSheet: 'contains no worksheet.',
    emptySheet: 'is empty: no rows found.',
    eanAndNameMissing: 'EAN-level vision missing: no EAN/barcode nor product-label column detected — SKUs cannot be identified individually.',
    eanMissing: 'EAN-level vision missing: EAN/barcode column not detected — SKUs are identified by product label instead.',
    brandMissing: '“Brand / manufacturer” column not detected — brand blocking is impossible.',
    noKpi: 'Neither value nor volume detected — facing allocation will be uniform (unweighted).',
    revenueMissing: '“Value” column not detected — the Value variant and the shelf/value gap will be unavailable.',
    volumeMissing: '“Volume” column not detected — the Rotation variant will be less reliable.',
    marginMissing: '“Margin” column not detected — the Margin variant will use a default weighting.',
    newMissing: '“Novelty” column not detected — no innovation will be highlighted.',
  },
};

function normalize(s: string): string {
  return s
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

// Colonnes de parts/distribution (PDM, share, % ACV, DN/DV, poids…) : jamais
// des ventes — exclues de la détection des champs numériques.
const SHARE_RE = /share|part de marche|pdm|acv|distribution|poids|weighted|vmh|(^|[^a-z0-9])(dn|dv)([^a-z0-9]|$)/;
// Lignes d'agrégats : « Total », « Total catégorie », « Sous-total », « Grand total », « Ensemble marché »…
const TOTAL_RE = /^(sous.|ss |grand )?total\b|^ensemble\b/;
// Mesures sommables (ventes) : elles seules excluent les moyennes/parts et l'an dernier.
const SUMMABLE_SALES = new Set(['revenue', 'volume', 'margin']);
const CURRENT_PERIOD = new Set(['revenue', 'volume']);

// Dérivé du dictionnaire (docs/formation) : anti-alias par champ (R1/R2),
// marqueurs année précédente (R1), repli fabricant (R2), colonnes non
// sommables (R3 — moyennes, parts, indices : jamais prises pour des ventes).
const ANTI_ALIASES = (SIGN_JSON as { antiAliases: Record<string, string[]> }).antiAliases;
const YA_TERMS = [...(SIGN_JSON as { yaMarkers: string[] }).yaMarkers, ...(SIGN_JSON as { yaAliases: string[] }).yaAliases].map(normalize);
const FABRICANT_ALIASES = (SIGN_JSON as { fabricant: string[] }).fabricant;
const NON_SUMMABLE = (SIGN_JSON as { nonSummable: string[] }).nonSummable.map(normalize);

/** Un en-tête normalisé matche-t-il l'un des alias (frontière de mot si ≤ 2 car.) ? */
function headerMatches(normHeader: string, aliasesNorm: string[]): boolean {
  return aliasesNorm.some((na) => {
    if (!na) return false;
    if (na.length <= 2) return new RegExp(`(^|[^a-z0-9])${na}([^a-z0-9]|$)`).test(normHeader);
    return normHeader.includes(na);
  });
}

interface DetectOpts {
  anti?: string[];
  blockNonSummable?: boolean; // R3 : exclure moyennes/parts/indices
  blockYA?: boolean; // R1 : exclure l'année précédente pour la période courante
}

function detectColumn(headers: string[], aliases: string[], opts: DetectOpts = {}): number {
  const antiN = (opts.anti ?? []).map(normalize);
  // Un en-tête est éligible s'il n'est ni un anti-alias, ni (le cas échéant)
  // une moyenne/part, ni une colonne d'année précédente.
  const eligible = headers.map(normalize).map((h) => {
    if (!h) return '';
    if (antiN.length && headerMatches(h, antiN)) return '';
    if (opts.blockNonSummable && (SHARE_RE.test(h) || headerMatches(h, NON_SUMMABLE))) return '';
    if (opts.blockYA && headerMatches(h, YA_TERMS)) return '';
    return h;
  });
  const aliasesN = aliases.map(normalize);
  // 1) exact
  for (let i = 0; i < eligible.length; i++) {
    if (eligible[i] && aliasesN.includes(eligible[i])) return i;
  }
  // 2) sous-chaîne (alias le plus long d'abord ; frontière de mot si ≤ 2 car.)
  const sorted = [...aliasesN].sort((a, b) => b.length - a.length);
  for (let i = 0; i < eligible.length; i++) {
    if (eligible[i] && headerMatches(eligible[i], sorted)) return i;
  }
  return -1;
}

/** Détection d'un champ domaine, avec sa signature (anti-alias, non-sommable, YA, repli fabricant). */
function detectField(headers: string[], field: string): number {
  let i = detectColumn(headers, COLUMN_ALIASES[field], {
    anti: ANTI_ALIASES[field],
    blockNonSummable: SUMMABLE_SALES.has(field),
    blockYA: CURRENT_PERIOD.has(field),
  });
  // R2 : la marque prime ; le fabricant n'est un repli que si aucune marque.
  if (i < 0 && field === 'brand') i = detectColumn(headers, FABRICANT_ALIASES, {});
  return i;
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const textCells = (rows[i] || []).filter((c) => typeof c === 'string' && String(c).trim().length > 0).length;
    if (textCells >= 2) return i;
  }
  return 0;
}

// Certains exports ont une page de garde (« Sommaire ») en première feuille :
// on retient la feuille dont la ligne d'en-têtes fait matcher le plus de champs.
function pickBestSheet(wb: XLSX.WorkBook): { sheetName: string; rows: unknown[][] } {
  let best: { sheetName: string; rows: unknown[][]; score: number } | null = null;
  for (const sheetName of wb.SheetNames.slice(0, 8)) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
      header: 1,
      blankrows: false,
    }) as unknown as unknown[][];
    const headers = (rows[findHeaderRow(rows)] || []).map((c) => (c == null ? '' : String(c)));
    const score = Object.keys(COLUMN_ALIASES).filter(
      (field) => detectField(headers, field) >= 0
    ).length;
    if (!best || score > best.score) best = { sheetName, rows, score };
  }
  return best ?? { sheetName: wb.SheetNames[0], rows: [] };
}

/**
 * Reconnaît un rapport panel "croisé" (Circana / NielsenIQ) : la mesure est une
 * colonne à part (Mesures/Measures), les périodes (P6…P13) ou semaines et les
 * enseignes sont en colonnes, les produits forment une hiérarchie avec des
 * lignes de total. Ce n'est PAS un tableau "un produit = une ligne" : le
 * parseur à plat ne peut pas le lire de façon fiable et doit refuser.
 */
function looksLikeCrossTabReport(wb: XLSX.WorkBook): boolean {
  for (const sheetName of wb.SheetNames.slice(0, 12)) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
      header: 1,
      blankrows: false,
    }) as unknown as unknown[][];
    for (let i = 0; i < Math.min(rows.length, 6); i++) {
      const cells = (rows[i] || []).map((c) => (c == null ? '' : String(c)));
      if (cells.map(normalize).some((c) => c === 'mesures' || c === 'measures' || c === 'mesure')) return true;
      const periodCols = cells.filter(
        (c) => /\bp\d{1,2}\b.*\bdu\b.*\bau\b/i.test(c) || /\bsem\b.*\bdu\b/i.test(c) || /\bdu\b \d{2}-\d{2}-\d{4} \bau\b/i.test(c)
      ).length;
      if (periodCols >= 3) return true;
    }
  }
  return false;
}

/**
 * R5 (format croisé, type Circana) : la mesure est en colonne (« Mesures »), les
 * périodes sont en colonnes. On PIVOTE en tableau à plat « une marque = une
 * ligne » (CA, Volume) sur une période de référence, avant la lecture normale.
 *
 * Rigueur (aucun raccourci) :
 *  - période de référence unique : cumul (CAM/MAT/YTD) préféré, sinon la période
 *    complète la plus récente ; jamais une colonne « année précédente » (YA/A-1)
 *    ni une colonne vide (le total de la catégorie doit y être renseigné) ;
 *  - un seul niveau de hiérarchie : le plus GROSSIER (marques, pas les SKU) dont
 *    la somme des CA reconstitue le total de la catégorie — pas de double
 *    comptage ; si aucun niveau ne reconstitue le total, la feuille est refusée
 *    (on ne fabrique pas un plan faux) ;
 *  - les mesures non sommables (moyennes, %Evol, VMH, PDL) sont ignorées.
 */
interface PivotEntry { name: string; ca: number; vol: number; depth: number }

/** Fin de période d'un en-tête daté (dernière date lue) — pour ordonner. */
function periodEndKey(header: string): number | null {
  const dates = [...header.matchAll(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/g)];
  if (!dates.length) return null;
  const m = dates[dates.length - 1];
  let y = parseInt(m[3], 10);
  if (y < 100) y += 2000;
  return new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10)).getTime();
}

interface PeriodCol { j: number; label: string; norm: string; isCumul: boolean; isWeek: boolean; end: number }

/** Rang de préférence d'une période de référence : cumul > période > semaine. */
function periodRank(p: PeriodCol): number {
  return p.isCumul ? 3 : p.isWeek ? 1 : 2;
}

function pivotOneSheet(raw: unknown[][]): { entries: PivotEntry[]; period: string; rank: number; promoFiltered: boolean } | null {
  const revAliases = COLUMN_ALIASES.revenue.map(normalize);
  const volAliases = COLUMN_ALIASES.volume.map(normalize);
  const isPeriodCell = (c: string) =>
    /\bp\d{1,2}\b.*\bdu\b.*\bau\b/i.test(c) || /\bsem\b.*\bdu\b/i.test(c) || /\bdu\b \d{2}-\d{2}-\d{4} \bau\b/i.test(c);
  let hi = -1;
  let mesureCol = -1;
  let produitCol = -1;
  let periodCols: number[] = [];
  for (let i = 0; i < Math.min(raw.length, 8); i++) {
    const cells = (raw[i] || []).map((c) => (c == null ? '' : String(c)));
    const norm = cells.map(normalize);
    const mc = norm.findIndex((c) => c === 'mesures' || c === 'measures' || c === 'mesure');
    if (mc < 0) continue;
    const pcs = cells.map((c, j) => ({ c, j })).filter(({ c }) => isPeriodCell(c)).map(({ j }) => j);
    if (!pcs.length) continue;
    hi = i; mesureCol = mc; periodCols = pcs;
    produitCol = norm.findIndex((c) => c === 'produits' || c === 'produit' || c === 'product' || c === 'products');
    if (produitCol < 0) produitCol = 0;
    break;
  }
  if (hi < 0) return null;

  // R12 — dimension « Causales Promo » : chaque produit peut apparaître en
  // « Total Promo et Hors Promo » (vue complète), « Total Promo » (promo seule)
  // et « Hors Promo ». On ne garde JAMAIS la promo seule (sinon on ampute la
  // lecture ou on double compte) : on lit la vue complète promo + hors promo.
  const causaleCol = (raw[hi] || [])
    .map((c) => normalize(String(c ?? '')))
    .findIndex((c) => c.includes('causale') || c === 'promo' || c === 'promotion');
  const promoOK = (row: unknown[]): boolean => {
    if (causaleCol < 0) return true;
    const c = normalize(String(row[causaleCol] ?? ''));
    if (!c) return true; // causale non renseignée : neutre
    if (/promo/.test(c) && !/hors/.test(c)) return false; // « Total Promo » seul → exclu (R12)
    return true; // « … et Hors Promo » (vue complète) ou « Hors Promo »
  };

  // Colonnes-périodes candidates : on écarte l'année précédente (YA/A-1) et les
  // colonnes d'évolution (%Evol, Ecart). On classe cumul > période > semaine.
  const candidates: PeriodCol[] = periodCols
    .map((j) => {
      const label = String(raw[hi][j] ?? '');
      const nh = normalize(label);
      return {
        j, label, norm: nh,
        isCumul: CUMUL_RE.test(nh),
        isWeek: /\bsem\b/.test(nh),
        end: periodEndKey(label) ?? -Infinity,
      };
    })
    .filter((p) => !headerMatches(p.norm, YA_TERMS) && !/%|evol|ecart/.test(p.norm));
  if (!candidates.length) return null;
  candidates.sort((a, b) => periodRank(b) - periodRank(a) || b.end - a.end);

  // Total de la catégorie (ligne « TOTAL … », mesure CA) par colonne candidate :
  // sert à (a) choisir une colonne réellement renseignée, (b) valider le niveau.
  const totalCA: Record<number, number> = {};
  const isCA = (m: string) =>
    !!m && !SHARE_RE.test(m) && !headerMatches(m, NON_SUMMABLE) && !headerMatches(m, YA_TERMS) &&
    !/%|evol|ecart/.test(m) && headerMatches(m, revAliases);
  const isVolMeasure = (m: string) =>
    !!m && !SHARE_RE.test(m) && !headerMatches(m, NON_SUMMABLE) && !headerMatches(m, YA_TERMS) &&
    !/%|evol|ecart/.test(m) && headerMatches(m, volAliases);
  for (let r = hi + 1; r < raw.length; r++) {
    const row = raw[r] || [];
    const produit = String(row[produitCol] ?? '').trim();
    if (!produit || !TOTAL_RE.test(normalize(produit))) continue;
    if (!promoOK(row)) continue; // R12 : total catégorie sur la vue complète, pas la promo seule
    const measure = normalize(String(row[mesureCol] ?? ''));
    if (!isCA(measure)) continue;
    for (const c of candidates) {
      const v = toNumber(row[c.j]);
      if (v > (totalCA[c.j] ?? 0)) totalCA[c.j] = v; // total catégorie = le plus grand total
    }
  }
  // Colonne de référence : la mieux classée dont le total catégorie est renseigné.
  const ref = candidates.find((c) => (totalCA[c.j] ?? 0) > 0) ?? candidates[0];
  const refCol = ref.j;
  const grand = totalCA[refCol] ?? 0;

  const map = new Map<string, PivotEntry>();
  const order: string[] = [];
  for (let r = hi + 1; r < raw.length; r++) {
    const row = raw[r] || [];
    const rawProduit = String(row[produitCol] ?? '');
    const produit = rawProduit.trim();
    if (!produit || TOTAL_RE.test(normalize(produit))) continue; // agrégats explicites exclus
    if (!promoOK(row)) continue; // R12 : jamais la promo seule (double comptage / lecture amputée)
    const measure = normalize(String(row[mesureCol] ?? ''));
    const rev = isCA(measure);
    const vol = !rev && isVolMeasure(measure);
    if (!rev && !vol) continue;
    if (!map.has(produit)) {
      map.set(produit, { name: produit, ca: 0, vol: 0, depth: rawProduit.length - rawProduit.trimStart().length });
      order.push(produit);
    }
    const e = map.get(produit)!;
    const val = toNumber(row[refCol]);
    if (rev) e.ca = val; else e.vol = val;
  }
  const entries = order.map((p) => map.get(p)!);
  if (entries.length < 2) return null;

  const depths = [...new Set(entries.map((e) => e.depth))].sort((a, b) => a - b);
  const sumAt = (d: number) => entries.filter((e) => e.depth === d).reduce((s, e) => s + e.ca, 0);
  if (depths.length === 1) {
    // Un seul niveau : on le garde tel quel (le fichier propre « croisé »).
    return { entries, period: ref.label, rank: periodRank(ref), promoFiltered: causaleCol >= 0 };
  }
  // Plusieurs niveaux : on garde le niveau le plus GROSSIER dont la somme des CA
  // reconstitue le total de la catégorie (± 6 %). Référence = le total explicite
  // s'il existe, sinon le niveau le plus fin. Aucun niveau valable ⇒ refus.
  const target = grand > 0 ? grand : sumAt(depths[depths.length - 1]);
  if (!(target > 0)) return null;
  const complete = depths.filter((d) => {
    const lvl = entries.filter((e) => e.depth === d);
    // Σ du niveau ≈ total ⇒ niveau complet (un zéro ponctuel = marque sans vente
    // sur la période, légitime ; la reconstitution du total suffit à valider).
    return lvl.length >= 2 && Math.abs(sumAt(d) - target) / target < 0.06;
  });
  if (!complete.length) return null; // aucun niveau ne reconstitue le total : on refuse
  const chosen = complete[0]; // le plus grossier complet
  return { entries: entries.filter((e) => e.depth === chosen), period: ref.label, rank: periodRank(ref), promoFiltered: causaleCol >= 0 };
}

/**
 * R5 (format croisé, type Circana) : mesure et périodes en colonnes. On PIVOTE
 * en tableau à plat « une marque = une ligne » sur une période de référence, en
 * ne gardant qu'un seul niveau de hiérarchie. Entre feuilles, on préfère celle
 * dont la période de référence est la plus solide (cumul > période > semaine),
 * puis la plus riche (le plus de marques).
 */
function detectAndPivotCrossTab(wb: XLSX.WorkBook): { rows: unknown[][]; period: string; promoFiltered: boolean } | null {
  let best: { entries: PivotEntry[]; period: string; rank: number; promoFiltered: boolean } | null = null;
  for (const sheetName of wb.SheetNames.slice(0, 12)) {
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
      header: 1,
      blankrows: false,
    }) as unknown as unknown[][];
    const p = pivotOneSheet(raw);
    if (!p) continue;
    if (!best || p.rank > best.rank || (p.rank === best.rank && p.entries.length > best.entries.length)) best = p;
  }
  if (!best) return null;
  const out: unknown[][] = [['Marque', 'CA', 'Volume']];
  for (const e of best.entries) out.push([e.name, e.ca, e.vol]);
  return { rows: out, period: best.period, promoFiltered: best.promoFiltered };
}

/** Repère un marqueur de période dans un en-tête (« P6 », « P12 », ou une date). */
function periodTag(header: string | null): string | null {
  if (!header) return null;
  const p = normalize(header).match(/\bp\d{1,2}\b/);
  if (p) return p[0];
  const d = header.match(/\d{2}-\d{2}-\d{4}/);
  return d ? d[0] : null;
}

// --- R5 (format long) : la période est une COLONNE, une ligne par produit ×
// période. Il faut résoudre UNE période avant tout calcul, et ne jamais
// additionner une ligne de cumul (YTD/CAM/MAT) avec ses semaines. ---
const PERIOD_ALIASES = [
  'periode', 'period', 'periods', 'semaine', 'week', 'mois', 'month',
  'timeframe', 'temps', 'periodicite', 'fin de periode', 'periode analyse',
];
// Libellés de cumul : ils contiennent déjà les périodes plus fines.
const CUMUL_RE = /ytd|cumul|\bcam\b|\bctd\b|\bmat\b|moving annual|rolling|\br12\b|12 mois|year to date/;

function parsePeriodDate(s: string): number | null {
  const m = s.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (!m) return null;
  let y = parseInt(m[3], 10);
  if (y < 100) y += 2000;
  return new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10)).getTime();
}

/**
 * Choisit la période de référence pour un plan de masse. Un cumul (YTD/CAM/MAT)
 * est préféré s'il existe : plus représentatif qu'une semaine isolée, et c'est
 * une période résolue unique (jamais mélangée avec les semaines qu'il contient).
 * Sinon, la période fine la plus récente. Le choix est toujours signalé ; un
 * sélecteur de période (mesure/période/enseigne) viendra plus tard.
 */
function pickReferencePeriod(distinct: string[]): string {
  const cumul = distinct.filter((d) => CUMUL_RE.test(normalize(d)));
  if (cumul.length) {
    const mat = cumul.find((d) => /\bmat\b|moving annual|12 mois|rolling|\br12\b/.test(normalize(d)));
    return mat ?? cumul[cumul.length - 1];
  }
  const dated = distinct.map((p) => ({ p, k: parsePeriodDate(p) })).filter((x) => x.k != null) as { p: string; k: number }[];
  if (dated.length) return dated.sort((a, b) => b.k - a.k)[0].p;
  return distinct[distinct.length - 1];
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v == null) return 0;
  const cleaned = String(v)
    .replace(/\s/g, '')
    .replace(/€|%/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // thousands separator "."
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

function toBool(v: unknown): boolean {
  if (v == null) return false;
  const s = normalize(String(v));
  return ['1', 'oui', 'yes', 'true', 'vrai', 'x', 'new', 'nouveau', 'nouveaute'].includes(s);
}

/**
 * Parse an ArrayBuffer (xlsx/xls/csv) into a normalized dataset.
 * Throws an Error with a precise, user-facing French message when the file is
 * structurally unusable; recoverable issues land in `warnings`.
 */
/** Reads headers + a few sample rows (for reports and the AI mapping net). */
export function readRawRows(buffer: ArrayBuffer): { headers: string[]; sample: unknown[][] } {
  const wb = XLSX.read(buffer, { type: 'array' });
  const { rows } = pickBestSheet(wb);
  const headerIdx = findHeaderRow(rows);
  return {
    headers: (rows[headerIdx] || []).map((c) => (c == null ? '' : String(c))),
    sample: rows.slice(headerIdx + 1, headerIdx + 4),
  };
}

export function parseWorkbook(
  buffer: ArrayBuffer,
  fileName = 'fichier',
  locale: Locale = 'fr',
  overrides?: Record<string, number | null>
): ParsedDataset {
  const D = DIAG[locale];
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'array' });
  } catch {
    throw new Error(`« ${fileName} » ${D.unreadable}`);
  }
  if (!wb.SheetNames.length) {
    throw new Error(`« ${fileName} » ${D.noSheet}`);
  }
  // R5 (croisé) : si c'est un rapport à mesure/périodes en colonnes, on le pivote
  // en tableau à plat avant tout. Sinon, lecture de la meilleure feuille.
  const pivot = detectAndPivotCrossTab(wb);
  let sheetName: string;
  let rows: unknown[][];
  let pivoted = false;
  if (pivot && pivot.rows.length > 1) {
    rows = pivot.rows;
    sheetName = 'rapport';
    pivoted = true;
  } else {
    ({ sheetName, rows } = pickBestSheet(wb));
  }

  const warnings: string[] = [];
  if (pivoted) {
    const promoNote = pivot!.promoFiltered
      ? (locale === 'fr'
          ? ' Dimension promo détectée : lecture sur la vue complète (promo + hors promo), la « promo seule » est écartée (R12).'
          : ' Promo dimension detected: read on the full view (promo + non-promo); “promo only” is excluded (R12).')
      : '';
    warnings.push(
      locale === 'fr'
        ? `Rapport croisé lu (mesure et périodes en colonnes) : « Ventes Valeur » = CA, « Ventes Unité » = volume, période retenue « ${pivot!.period} ». Un seul niveau de hiérarchie, totaux exclus — vérifiez qu'aucun sous-total intermédiaire ne subsiste.${promoNote}`
        : `Cross-tab report read (measure and periods in columns): sales value = revenue, units = volume, reference period “${pivot!.period}”. Single hierarchy level, totals excluded.${promoNote}`
    );
  }
  if (!rows.length) {
    throw new Error(`« ${sheetName} » ${D.emptySheet}`);
  }

  const headerIdx = findHeaderRow(rows);
  const headers = rows[headerIdx].map((c) => (c == null ? '' : String(c)));

  const idx: Record<string, number> = {};
  const detectedColumns: Record<string, string | null> = {};
  for (const field of Object.keys(COLUMN_ALIASES)) {
    const i = detectField(headers, field);
    idx[field] = i;
    detectedColumns[field] = i >= 0 ? headers[i] : null;
  }

  // AI / manual mapping overrides win over heuristic detection.
  if (overrides) {
    for (const field of Object.keys(COLUMN_ALIASES)) {
      const o = overrides[field];
      if (typeof o === 'number' && o >= 0 && o < headers.length) {
        idx[field] = o;
        detectedColumns[field] = headers[o];
      }
    }
  }

  // --- Règle périodes (rigueur : ne jamais mélanger deux périodes) ---
  // Si le CA et le volume détectés portent des marqueurs de période différents
  // (« CA P6 » vs « Qté P7 »), on ne combine pas : on garde la période du CA et
  // on ignore le volume mal aligné, en le signalant. On ne traite pas une donnée
  // qu'on n'a pas pour la bonne période, et on n'invente rien.
  const revTag = periodTag(detectedColumns.revenue);
  const volTag = periodTag(detectedColumns.volume);
  if (revTag && volTag && revTag !== volTag) {
    warnings.push(
      locale === 'fr'
        ? `Périodes différentes : CA sur « ${detectedColumns.revenue} » (${revTag.toUpperCase()}), volume sur « ${detectedColumns.volume} » (${volTag.toUpperCase()}). CatPilot ne mélange pas deux périodes : l'analyse se fait sur ${revTag.toUpperCase()} et le volume ${volTag.toUpperCase()} est ignoré. Ne gardez qu'une période par fichier pour une analyse volume fiable.`
        : `Different periods: sales from “${detectedColumns.revenue}” (${revTag.toUpperCase()}), volume from “${detectedColumns.volume}” (${volTag.toUpperCase()}). CatPilot never mixes two periods: analysis uses ${revTag.toUpperCase()} and the ${volTag.toUpperCase()} volume is ignored.`
    );
    idx.volume = -1;
    detectedColumns.volume = null;
  }

  // --- R6 : unité déclarée dans l'intitulé (k€/M€ changent l'échelle du CA) ---
  const revHeaderN = normalize(detectedColumns.revenue || '');
  const revenueScale = /(m€|meur|m eur)/.test(revHeaderN) ? 1_000_000 : /(k€|keur|k eur)/.test(revHeaderN) ? 1000 : 1;
  if (idx.revenue >= 0 && headers.some((h) => /£|\bgbp\b/i.test(String(h)))) {
    warnings.push(
      locale === 'fr'
        ? 'Devise mixte détectée (£/GBP) : vérifiez que le CA est dans une seule devise avant toute somme.'
        : 'Mixed currency (£/GBP) detected: check sales are in a single currency before summing.'
    );
  }

  // --- R5 : format long (période en colonne, une ligne par produit × période) ---
  // On ne le déclenche que si un même produit apparaît sous ≥ 2 périodes — sinon
  // une simple colonne « Date » sur un tableau à plat ferait tout supprimer.
  const idxPeriod = detectColumn(headers, PERIOD_ALIASES, {});
  let refPeriodNorm: string | null = null;
  let refPeriodLabel = '';
  if (idxPeriod >= 0) {
    const keyIdx = idx.ean >= 0 ? idx.ean : idx.name >= 0 ? idx.name : idx.brand;
    const seen = new Map<string, Set<string>>();
    const allPeriods = new Set<string>();
    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const per = String(row[idxPeriod] ?? '').trim();
      if (!per) continue;
      allPeriods.add(per);
      if (keyIdx >= 0) {
        const k = String(row[keyIdx] ?? '').trim();
        if (k) (seen.get(k) ?? seen.set(k, new Set()).get(k)!).add(per);
      }
    }
    const productRepeats = [...seen.values()].some((s) => s.size >= 2);
    if (allPeriods.size >= 2 && productRepeats) {
      refPeriodLabel = pickReferencePeriod([...allPeriods]);
      refPeriodNorm = normalize(refPeriodLabel);
      detectedColumns.period = headers[idxPeriod];
      warnings.push(
        locale === 'fr'
          ? `Format « long » détecté (colonne « ${headers[idxPeriod]} ») : une ligne par produit et par période. L'analyse ne porte que sur « ${refPeriodLabel} » ; les autres périodes sont écartées, et une période n'est jamais additionnée à un cumul (YTD/CAM/MAT) — sinon un produit serait compté plusieurs fois.`
          : `“Long” format detected (column “${headers[idxPeriod]}”): one row per product and period. Analysis uses only “${refPeriodLabel}”; other periods are dropped and a period is never summed with a cumulative (YTD/CAM/MAT), to avoid counting a product several times.`
      );
    }
  }

  // --- Diagnostics métier précis ---
  if (idx.ean < 0 && idx.name < 0) {
    warnings.push(D.eanAndNameMissing);
  } else if (idx.ean < 0) {
    warnings.push(D.eanMissing);
  }
  if (idx.brand < 0) {
    warnings.push(D.brandMissing);
  }
  if (idx.revenue < 0 && idx.volume < 0) {
    warnings.push(D.noKpi);
  } else {
    if (idx.revenue < 0) warnings.push(D.revenueMissing);
    if (idx.volume < 0) warnings.push(D.volumeMissing);
  }
  if (idx.margin < 0) warnings.push(D.marginMissing);
  if (idx.isNew < 0) warnings.push(D.newMissing);

  const products: Product[] = [];
  let dropped = 0;
  let totals = 0;
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c == null || String(c).trim() === '')) continue;

    // R5 : format long — ne garder que la période de référence résolue.
    if (refPeriodNorm !== null && normalize(String(row[idxPeriod] ?? '')) !== refPeriodNorm) {
      continue;
    }

    const brand = idx.brand >= 0 ? String(row[idx.brand] ?? '').trim() : '';
    const ean = idx.ean >= 0 ? String(row[idx.ean] ?? '').trim() : '';
    const name = idx.name >= 0 ? String(row[idx.name] ?? '').trim() : '';
    if (!brand && !name && !ean) {
      dropped++;
      continue;
    }
    // Lignes d'agrégats (« Total catégorie », « Sous-total », « Ensemble »…) :
    // fréquentes dans les exports panel, elles fausseraient tout le plan de masse.
    if (TOTAL_RE.test(normalize(brand)) || TOTAL_RE.test(normalize(name))) {
      totals++;
      continue;
    }
    const revenue = idx.revenue >= 0 ? toNumber(row[idx.revenue]) * revenueScale : 0;
    const volume = idx.volume >= 0 ? toNumber(row[idx.volume]) : 0;
    let margin = idx.margin >= 0 ? toNumber(row[idx.margin]) : 0;
    const price = idx.price >= 0 ? toNumber(row[idx.price]) : 0;
    // If margin looks like a percentage (0..100) and we have revenue, convert to € contribution.
    if (idx.margin >= 0 && margin > 0 && margin <= 100 && revenue > 0) {
      margin = (margin / 100) * revenue;
    }
    const isNew = idx.isNew >= 0 ? toBool(row[idx.isNew]) : false;

    products.push({
      id: `p${products.length}`,
      brand: brand || 'Sans marque',
      name: name || (ean ? `EAN ${ean}` : `Réf. ${products.length + 1}`),
      ean: ean || undefined,
      segment: idx.segment >= 0 ? String(row[idx.segment] ?? '').trim() || 'Général' : 'Général',
      revenue,
      volume,
      margin,
      price,
      isNew,
    });
  }

  // --- R7 : agrégat détecté par le CALCUL (au-delà du libellé) ---
  // Une ligne dont le CA (ou le volume) ≈ la somme des autres EST un total,
  // même si elle s'appelle « Ensemble », « Autres » ou porte un nom de marque
  // ombrelle. On la retire pour ne pas lui donner du linéaire (EX01).
  for (const key of ['revenue', 'volume'] as const) {
    for (let pass = 0; pass < 3 && products.length >= 3; pass++) {
      const sum = products.reduce((a, p) => a + p[key], 0);
      if (sum <= 0) break;
      const hit = products.findIndex((p) => p[key] > 0 && Math.abs(p[key] - (sum - p[key])) / (sum - p[key] || 1) < 0.005);
      if (hit < 0) break;
      const removed = products.splice(hit, 1)[0];
      totals++;
      warnings.push(
        locale === 'fr'
          ? `Ligne « ${removed.brand}${removed.name && removed.name !== removed.brand ? ' / ' + removed.name : ''} » exclue : sa valeur égale la somme des autres (agrégat détecté par le calcul).`
          : `Row “${removed.brand}” excluded: its value equals the sum of the others (aggregate detected by calculation).`
      );
    }
  }

  if (totals > 0) {
    warnings.push(
      locale === 'fr'
        ? `${totals} ligne(s) de total/agrégat ignorée(s) (ex. « Total catégorie »).`
        : `${totals} total/aggregate row(s) skipped (e.g. “Category total”).`
    );
  }
  if (dropped > 0) {
    warnings.push(
      locale === 'fr'
        ? `${dropped} ligne(s) ignorée(s) : ni marque, ni EAN, ni libellé produit renseignés.`
        : `${dropped} row(s) skipped: no brand, EAN or product label filled in.`
    );
  }
  // --- Garde-fou anti "résultat faux" (rigueur : refuser plutôt qu'inventer) ---
  // Mieux vaut un message d'erreur précis qu'un planogramme faux qui a l'air juste.
  const dataRows = dropped + totals + products.length;
  const dropRate = dataRows > 0 ? dropped / dataRows : 1;
  const found = headers.filter(Boolean).map((h) => `« ${h} »`).join(', ');

  // 1) Rapport panel croisé (Circana/Nielsen) sans colonne marque : non lisible à plat.
  if (!pivoted && looksLikeCrossTabReport(wb) && idx.brand < 0) {
    throw new Error(
      locale === 'fr'
        ? `« ${fileName} » ressemble à un rapport panel croisé (Circana / NielsenIQ) : mesure en colonne, périodes (P6…P13) ou semaines et enseignes en colonnes, produits en hiérarchie avec des lignes de total. CatPilot ne sait pas encore lire ce format de façon fiable — aucun planogramme n'est généré, pour ne pas produire un résultat faux. Exportez un tableau « à plat » (une ligne = un produit ; colonnes Marque, EAN, CA, Volume), ou signalez ce fichier pour la prise en charge du format rapport.`
        : `“${fileName}” looks like a cross-tab panel report (Circana / NielsenIQ): measure in a column, periods (P6…P13) or weeks and retailers in columns, products in a hierarchy with total rows. CatPilot cannot read this format reliably yet — no planogram is generated, to avoid a wrong result. Export a “flat” table instead (one row per product; Brand, EAN, Sales, Volume columns).`
    );
  }

  // 2) Majorité des lignes illisibles, ou aucun moyen d'identifier les produits.
  if (products.length === 0 || dropRate > 0.6 || (idx.brand < 0 && idx.ean < 0)) {
    const pct = Math.round(dropRate * 100);
    throw new Error(
      locale === 'fr'
        ? `Lecture non fiable de « ${fileName} » : ${dropped} ligne(s) sur ${dataRows} sans marque, EAN ni libellé exploitable (${pct} %). Ce n'est probablement pas un tableau « un produit par ligne » (feuille de synthèse, en-têtes sur plusieurs lignes, ou export croisé). Colonnes trouvées : ${found || 'aucune'}. Aucun planogramme n'est généré pour éviter un résultat faux : il faut au minimum une colonne marque (ou EAN), et une colonne CA ou volume.`
        : `Unreliable read of “${fileName}”: ${dropped} of ${dataRows} rows without brand, EAN or usable label (${pct}%). This is likely not a one-product-per-row table. Columns found: ${found || 'none'}. No planogram is generated, to avoid a wrong result: a brand (or EAN) column and a sales or volume column are required.`
    );
  }

  return { products, detectedColumns, warnings };
}
