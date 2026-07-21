// Domain types for CatPilot — category management / planogram generation.

/** A single product line, normalized from an uploaded Excel/CSV panel export. */
export interface Product {
  id: string;
  brand: string;
  name: string;
  /** Code EAN/gencod si présent dans le fichier (vision à l'EAN). */
  ean?: string;
  segment: string;
  /** Chiffre d'affaires (value sales, €). */
  revenue: number;
  /** Volume / units sold. */
  volume: number;
  /** Marge unitaire ou taux — stored as a contribution proxy (€). */
  margin: number;
  /** Prix de vente unitaire (€), optional. */
  price: number;
  /** Nouveauté détectée. */
  isNew: boolean;
  // — Colonnes d'AUDIT planogramme (présentes seulement dans un relevé linéaire,
  //   jamais dans un export panel). Elles activent R9 et R11 quand elles existent.
  /** Facings actuels au rayon (relevé). Base de la PDL réelle. */
  currentFacings?: number;
  /** Largeur d'un facing (cm) — pour le linéaire développé (R9). */
  widthCm?: number;
  /** Rotation en UVC / magasin / semaine (R11). */
  rotationPerWeek?: number;
  /** Capacité (UVC) tenue par un facing (R11). */
  capacityPerFacing?: number;
  /** Délai de réappro en jours (R11). */
  reapproDays?: number;
}

/** Result of parsing an uploaded file. */
export interface ParsedDataset {
  products: Product[];
  /** Raw header names that were mapped, for transparency in the UI. */
  detectedColumns: Record<string, string | null>;
  /** Non-fatal warnings (missing column, rows dropped, …). */
  warnings: string[];
  /** Enseignes présentes dans le fichier (rapport multi-enseigne). Le
   *  planogramme se génère toujours pour UNE enseigne à la fois. */
  enseignes?: string[];
  /** Enseigne effectivement lue (celle du planogramme courant). */
  enseigne?: string | null;
  /** Catégories présentes dans le fichier (un même export peut en mêler). */
  categories?: string[];
  /** Catégorie effectivement lue. */
  category?: string | null;
  /** Période effectivement analysée (jamais un mélange de deux périodes). */
  period?: string | null;
  /** Périodes disponibles dans le fichier (format long) — base d'un sélecteur. */
  periods?: string[];
}

/** The four allocation strategies. */
export type StrategyKey = 'balanced' | 'rotation' | 'margin' | 'revenue';

export interface Strategy {
  key: StrategyKey;
  label: string;
  short: string;
  description: string;
}

/** A product with its computed facing allocation for a given strategy. */
export interface Facing {
  product: Product;
  facings: number;
  /** Share of total linear space (0..1). */
  share: number;
}

/** A shelf level in the facing planogram. */
export interface Shelf {
  level: number; // 0 = top
  label: string;
  cells: Facing[];
}

/** Aggregated space allocation by brand — the "plan de masse". */
export interface BrandBlock {
  brand: string;
  color: string;
  facings: number;
  share: number;
  revenueShare: number;
  products: number;
  novelties: number;
}

/** A full generated planogram for one strategy. */
export interface Planogram {
  strategy: Strategy;
  facingsList: Facing[];
  shelves: Shelf[];
  brandBlocks: BrandBlock[];
  totalFacings: number;
  novelties: Product[];
  /** Buyer presentation frame (trame acheteur) — pro only. */
  buyerFrame: BuyerFrame;
}

/** The buyer-facing presentation frame. */
export interface BuyerFrame {
  headline: string;
  categorySummary: string;
  keyMoves: string[];
  noveltyPitch: string[];
  expectedImpact: string[];
}

/** Retouches utilisateur de la trame acheteur (éditeur Pro). */
export interface DeckEdit {
  headline?: string;
  categorySummary?: string;
  keyMoves?: string[];
  noveltyPitch?: string[];
  expectedImpact?: string[];
}

/** Configuration of the physical furniture (gondole/meuble). */
export interface Fixture {
  shelves: number;
  facingsPerShelf: number;
}
