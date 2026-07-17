import * as XLSX from 'xlsx';
import type { ParsedDataset, Product } from './types';

/**
 * Fuzzy column detection for Nielsen / Circana style exports.
 * Each logical field maps to a list of header candidates (accent-insensitive,
 * case-insensitive, substring match).
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  brand: ['marque', 'brand', 'fabricant', 'fournisseur', 'manufacturer', 'enseigne marque'],
  name: ['produit', 'reference', 'référence', 'libelle', 'libellé', 'product', 'sku', 'article', 'designation', 'désignation', 'ean'],
  segment: ['segment', 'sous-segment', 'categorie', 'catégorie', 'category', 'famille', 'rayon', 'univers'],
  revenue: ['ca', "chiffre d'affaires", 'chiffre d affaires', 'ventes valeur', 'sales value', 'value', 'valeur', 'ca ttc', 'ca ht', 'revenue', 'turnover'],
  volume: ['volume', 'unites', 'unités', 'units', 'quantite', 'quantité', 'qty', 'ventes volume', 'ventes unites', 'pieces'],
  margin: ['marge', 'margin', 'profit', 'marge brute', 'marge %', 'taux de marge'],
  price: ['prix', 'price', 'pvc', 'prix de vente', 'tarif', 'prix unitaire'],
  isNew: ['nouveaute', 'nouveauté', 'nouveau', 'new', 'innovation', 'lancement'],
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

/** Parse an ArrayBuffer (xlsx/xls/csv) into a normalized dataset. */
export function parseWorkbook(buffer: ArrayBuffer, fileName = 'fichier'): ParsedDataset {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1, blankrows: false }) as unknown as unknown[][];

  const warnings: string[] = [];
  if (!rows.length) {
    return { products: [], detectedColumns: {}, warnings: ['Le fichier est vide.'] };
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

  if (idx.brand < 0) warnings.push('Colonne « Marque » non détectée — regroupement par marque limité.');
  if (idx.name < 0) warnings.push('Colonne « Produit » non détectée — libellés génériques utilisés.');
  if (idx.revenue < 0 && idx.volume < 0) {
    warnings.push('Ni CA ni volume détectés — allocation basée sur une répartition uniforme.');
  }

  const products: Product[] = [];
  let dropped = 0;
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c == null || String(c).trim() === '')) continue;

    const brand = idx.brand >= 0 ? String(row[idx.brand] ?? '').trim() : '';
    const name = idx.name >= 0 ? String(row[idx.name] ?? '').trim() : '';
    if (!brand && !name) {
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
      name: name || `Réf. ${products.length + 1}`,
      segment: idx.segment >= 0 ? String(row[idx.segment] ?? '').trim() || 'Général' : 'Général',
      revenue,
      volume,
      margin,
      price,
      isNew,
    });
  }

  if (dropped > 0) warnings.push(`${dropped} ligne(s) ignorée(s) (sans marque ni libellé).`);
  if (!products.length) warnings.push('Aucune ligne produit exploitable trouvée.');

  return { products, detectedColumns, warnings };
}
