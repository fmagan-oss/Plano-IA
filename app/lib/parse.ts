import * as XLSX from 'xlsx';
import type { ParsedDataset, Product } from './types';
import type { Locale } from './i18n';
import ALIASES_JSON from './column-aliases.json';

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
    .toLowerCase()
    .trim();
}

function detectColumn(headers: string[], aliases: string[]): number {
  const normHeaders = headers.map(normalize);
  // 1) exact match
  for (let i = 0; i < normHeaders.length; i++) {
    if (aliases.some((a) => normHeaders[i] === normalize(a))) return i;
  }
  // 2) substring match (longest alias first to prefer specificity)
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  for (let i = 0; i < normHeaders.length; i++) {
    if (sorted.some((a) => normHeaders[i].includes(normalize(a)))) return i;
  }
  return -1;
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
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1, blankrows: false }) as unknown as unknown[][];
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const textCells = (rows[i] || []).filter((c) => typeof c === 'string' && c.trim().length > 0).length;
    if (textCells >= 2) { headerIdx = i; break; }
  }
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
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1, blankrows: false }) as unknown as unknown[][];

  const warnings: string[] = [];
  if (!rows.length) {
    throw new Error(`« ${sheetName} » ${D.emptySheet}`);
  }

  // Find the header row: first row that has >= 2 non-empty text cells.
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const textCells = rows[i].filter((c) => typeof c === 'string' && c.trim().length > 0).length;
    if (textCells >= 2) {
      headerIdx = i;
      break;
    }
  }
  const headers = rows[headerIdx].map((c) => (c == null ? '' : String(c)));

  const idx: Record<string, number> = {};
  const detectedColumns: Record<string, string | null> = {};
  for (const field of Object.keys(COLUMN_ALIASES)) {
    const i = detectColumn(headers, COLUMN_ALIASES[field]);
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
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c == null || String(c).trim() === '')) continue;

    const brand = idx.brand >= 0 ? String(row[idx.brand] ?? '').trim() : '';
    const ean = idx.ean >= 0 ? String(row[idx.ean] ?? '').trim() : '';
    const name = idx.name >= 0 ? String(row[idx.name] ?? '').trim() : '';
    if (!brand && !name && !ean) {
      dropped++;
      continue;
    }
    const revenue = idx.revenue >= 0 ? toNumber(row[idx.revenue]) : 0;
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

  if (dropped > 0) {
    warnings.push(
      locale === 'fr'
        ? `${dropped} ligne(s) ignorée(s) : ni marque, ni EAN, ni libellé produit renseignés.`
        : `${dropped} row(s) skipped: no brand, EAN or product label filled in.`
    );
  }
  if (!products.length) {
    const found = headers.filter(Boolean).map((h) => `« ${h} »`).join(', ');
    throw new Error(
      locale === 'fr'
        ? `Aucune ligne produit exploitable dans « ${fileName} ». Colonnes trouvées : ${found || 'aucune'}. Il faut au minimum une colonne marque, EAN ou libellé produit.`
        : `No usable product row in “${fileName}”. Columns found: ${found || 'none'}. At least a brand, EAN or product-label column is required.`
    );
  }

  return { products, detectedColumns, warnings };
}
