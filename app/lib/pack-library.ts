import LIB from './pack-library.json' with { type: 'json' };
import type { Product } from './types';

/**
 * Bibliothèque de packs — donne une LARGEUR de facing réaliste (et, à terme, un
 * visuel) SANS import manuel pénible :
 *  1. si l'EAN du produit est connu dans la bibliothèque → dimensions exactes ;
 *  2. sinon → dimensions typiques de la CATÉGORIE (retombée automatique) ;
 *  3. sinon → défaut générique.
 *
 * La largeur alimente le linéaire développé (R9) : sans elle, on ne peut pas
 * distinguer sous-linéarisation et sur-linéarisation à surface égale. La
 * bibliothèque est un JSON enrichissable (packs par EAN) — on ne fait AUCUN
 * appel réseau ici : l'objectif est justement d'éviter le « nightmare
 * d'importation » en fournissant des valeurs par défaut crédibles hors-ligne.
 */

export interface PackDims {
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  /** Visuel du pack (data URI ou URL) si disponible. */
  image?: string;
  /** D'où vient la dimension : 'ean' (exacte), 'category' (typique), 'default'. */
  source: 'ean' | 'category' | 'default';
  /** Libellé de la source de dimension, pour la transparence UI. */
  label?: string;
}

interface CatDefault { widthMm: number; heightMm: number; depthMm?: number; label?: string }
interface PackEntry { widthMm: number; heightMm: number; depthMm?: number; image?: string; name?: string }

const CAT_DEFAULTS = LIB.categoryDefaults as Record<string, CatDefault>;
const CAT_ALIASES = LIB.categoryAliases as Record<string, string[]>;
const PACKS = LIB.packs as Record<string, PackEntry>;

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Devine la clé de catégorie interne à partir d'un libellé de catégorie/segment libre. */
export function resolveCategoryKey(hint?: string | null): string {
  if (!hint) return 'default';
  const h = norm(hint);
  for (const [key, aliases] of Object.entries(CAT_ALIASES)) {
    if (aliases.some((a) => h.includes(norm(a)))) return key;
  }
  return CAT_DEFAULTS[h] ? h : 'default';
}

/** Nettoie un EAN (chiffres seulement) pour le matching. */
function cleanEan(ean?: string): string {
  return (ean || '').replace(/\D+/g, '');
}

/**
 * Dimensions d'un pack. `categoryHint` (catégorie du fichier ou segment produit)
 * sert de retombée quand l'EAN est inconnu.
 */
export function lookupPackDims(ean?: string, categoryHint?: string | null): PackDims {
  const key = cleanEan(ean);
  if (key && PACKS[key]) {
    const p = PACKS[key];
    return { widthMm: p.widthMm, heightMm: p.heightMm, depthMm: p.depthMm, image: p.image, source: 'ean', label: p.name };
  }
  const catKey = resolveCategoryKey(categoryHint);
  const cat = CAT_DEFAULTS[catKey] ?? CAT_DEFAULTS.default;
  return {
    widthMm: cat.widthMm,
    heightMm: cat.heightMm,
    depthMm: cat.depthMm,
    source: catKey === 'default' ? 'default' : 'category',
    label: cat.label,
  };
}

export interface EnrichResult {
  products: Product[];
  /** Nombre de réf. dont la largeur vient d'un EAN connu (dimension exacte). */
  exactByEan: number;
  /** Nombre de réf. dont la largeur vient d'un défaut de catégorie. */
  byCategory: number;
  /** Clé de catégorie utilisée pour les retombées. */
  categoryKey: string;
}

/**
 * Remplit `widthCm` sur les produits qui n'en ont pas (le fichier prime : un
 * relevé linéaire avec largeur mesurée n'est jamais écrasé). Débloque R9 même
 * sur un export panel sans colonne largeur. Ne modifie pas les produits en place.
 */
export function enrichProductsWithDims(products: Product[], categoryHint?: string | null): EnrichResult {
  let exactByEan = 0;
  let byCategory = 0;
  const categoryKey = resolveCategoryKey(categoryHint);
  const out = products.map((p) => {
    if (typeof p.widthCm === 'number' && p.widthCm > 0) return p; // le fichier prime
    const dims = lookupPackDims(p.ean, categoryHint);
    if (dims.source === 'ean') exactByEan++;
    else byCategory++;
    return { ...p, widthCm: Math.round((dims.widthMm / 10) * 10) / 10 };
  });
  return { products: out, exactByEan, byCategory, categoryKey };
}
