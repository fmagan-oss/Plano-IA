import type {
  BrandBlock,
  BuyerFrame,
  Facing,
  Fixture,
  Planogram,
  Product,
  Shelf,
  Strategy,
  StrategyKey,
} from './types';
import { brandColorMap } from './brands';
import type { Locale } from './i18n';

/** Localized strategy labels + descriptions (UI + generated texts). */
export const STRATEGY_TEXT: Record<Locale, Record<StrategyKey, { label: string; description: string }>> = {
  fr: {
    balanced: { label: 'Équilibré', description: 'Compromis CA / volume / marge. La lecture rayon la plus lisible, sans sur-pondérer un seul indicateur.' },
    rotation: { label: 'Rotation', description: 'Priorité aux fortes rotations (volume). Limite les ruptures sur les références qui tournent le plus.' },
    margin: { label: 'Marge', description: 'Priorité à la contribution marge. Met en avant les références les plus rentables au linéaire.' },
    revenue: { label: 'CA', description: 'Priorité au chiffre d’affaires. Alloue le facing au poids commercial de chaque référence.' },
  },
  en: {
    balanced: { label: 'Balanced', description: 'A value / volume / margin compromise. The most readable shelf, without over-weighting a single KPI.' },
    rotation: { label: 'Rotation', description: 'Priority to high-rotation SKUs (volume). Limits out-of-stocks on the fastest movers.' },
    margin: { label: 'Margin', description: 'Priority to margin contribution. Puts the most profitable SKUs forward on the shelf.' },
    revenue: { label: 'Value', description: 'Priority to sales value. Allocates facings to each SKU’s commercial weight.' },
  },
};

export const STRATEGIES: Record<StrategyKey, Strategy> = {
  balanced: {
    key: 'balanced',
    label: 'Équilibré',
    short: 'Équilibré',
    description: "Compromis CA / volume / marge. La lecture rayon la plus lisible, sans sur-pondérer un seul indicateur.",
  },
  rotation: {
    key: 'rotation',
    label: 'Rotation',
    short: 'Rotation',
    description: 'Priorité aux fortes rotations (volume). Limite les ruptures sur les références qui tournent le plus.',
  },
  margin: {
    key: 'margin',
    label: 'Marge',
    short: 'Marge',
    description: 'Priorité à la contribution marge. Met en avant les références les plus rentables au linéaire.',
  },
  revenue: {
    key: 'revenue',
    label: 'CA',
    short: 'CA',
    description: 'Priorité au chiffre d’affaires. Alloue le facing au poids commercial de chaque référence.',
  },
};

export const DEFAULT_FIXTURE: Fixture = { shelves: 5, facingsPerShelf: 12 };

/**
 * Règles merchandising appliquées à l'ordre des blocs et au placement.
 * - `blocMarqueObligatoire` : marques toujours contiguës (vision bloc-marque) ;
 * - `leaderAtEntrance` : le LEADER (part de CA) ancré en entrée de rayon ;
 * - `mddNextToLeader` : la MDD placée juste à côté du leader ;
 * - `naturalPole` : où regrouper le pôle naturalité — 'cold' (zone froide / bas),
 *   'middle' (milieu de rayon), 'spread' (réparti), 'off' (pas de traitement).
 *   Réglage laissé à VALIDER (défaut 'off' : on n'impose pas une règle merch non
 *   tranchée). Les autres défauts reprennent des règles merch standard.
 */
export interface MerchOptions {
  blocMarqueObligatoire: boolean;
  leaderAtEntrance: boolean;
  mddNextToLeader: boolean;
  naturalPole: 'cold' | 'middle' | 'spread' | 'off';
}

export const DEFAULT_MERCH: MerchOptions = {
  blocMarqueObligatoire: true,
  leaderAtEntrance: true,
  mddNextToLeader: true,
  naturalPole: 'off',
};

const MDD_TOKENS = [
  'mdd', 'marque distributeur', 'marque repere', 'marque repère', 'private label', 'own brand',
  'carrefour', 'auchan', 'leclerc', 'casino', 'monoprix', 'intermarche', 'intermarché',
  'cora', 'systeme u', 'système u', 'u bio', 'les 2 vaches', 'reflets de france', 'huismerk',
];
const NATURAL_TOKENS = [
  'bio', 'naturel', 'nature', 'natural', 'organic', 'vegan', 'vegetal', 'végétal', 'plant',
  'sans sulfate', 'sans silicone', 'sans paraben', 'green', 'eco', 'écolo', 'clean',
];

function hasToken(s: string, tokens: string[]): boolean {
  const h = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return tokens.some((t) => h.includes(t));
}

/** Marque de distributeur (heuristique nom de marque). */
export function isMDD(brand: string): boolean {
  return hasToken(brand, MDD_TOKENS);
}

/** Produit « naturalité » (bio / naturel / clean), d'après nom + segment. */
export function isNaturalProduct(p: Product): boolean {
  return hasToken(`${p.brand} ${p.name} ${p.segment}`, NATURAL_TOKENS);
}

interface MetricTotals { rev: number; vol: number; mar: number }

/**
 * Poids d'un produit pour une stratégie — sur des PARTS normalisées (0..1), pas
 * des valeurs brutes. Mélanger des € (CA) et des unités (volume) bruts n'a pas de
 * sens : le CA (grand) écrasait tout et « équilibré » n'était pas équilibré.
 * On raisonne donc en parts : part de CA, part de volume, part de marge.
 * - revenue = part de CA = fair-share valeur (cohérent avec R10 : à facings ∝
 *   valeur, le CA/facing est ~constant → pas de sur/sous-linéarisation artificielle) ;
 * - rotation = part de volume ; margin = part de marge ;
 * - balanced = ancré sur la valeur (fair-share) puis tilté rotation/marge.
 */
function productWeight(p: Product, key: StrategyKey, tot: MetricTotals): number {
  const rv = Math.max(p.revenue, 0) / tot.rev;
  const vl = Math.max(p.volume, 0) / tot.vol;
  const mg = Math.max(p.margin, 0) / tot.mar;
  switch (key) {
    case 'rotation':
      return vl;
    case 'margin':
      return mg;
    case 'revenue':
      return rv;
    case 'balanced':
    default:
      return 0.5 * rv + 0.3 * vl + 0.2 * mg;
  }
}

/**
 * Largest-remainder allocation: distribute `total` facings across products
 * proportionally to their weight, guaranteeing at least `minFacings` each,
 * and giving new products a small presence bonus.
 */
function allocateFacings(products: Product[], total: number, key: StrategyKey): Facing[] {
  const n = products.length;
  if (n === 0) return [];

  const minFacings = 1;
  const guaranteed = Math.min(n * minFacings, total);
  let remaining = total - guaranteed;
  if (remaining < 0) remaining = 0;

  // Totaux par métrique → poids en PARTS normalisées (cf. productWeight).
  const tot: MetricTotals = {
    rev: products.reduce((a, p) => a + Math.max(p.revenue, 0), 0) || 1,
    vol: products.reduce((a, p) => a + Math.max(p.volume, 0), 0) || 1,
    mar: products.reduce((a, p) => a + Math.max(p.margin, 0), 0) || 1,
  };
  // Bonus nouveauté : boost RELATIF (25 %), pas un « +1 » absolu qui écraserait
  // l'échelle des parts (les nouveautés ont déjà le plancher d'1 facing).
  const rawWeights = products.map((p) => {
    const w = productWeight(p, key, tot);
    return p.isNew ? w * 1.25 : w;
  });
  const totalWeight = rawWeights.reduce((a, b) => a + b, 0) || 1;

  const exact = rawWeights.map((w) => (w / totalWeight) * remaining);
  const floors = exact.map((x) => Math.floor(x));
  let used = floors.reduce((a, b) => a + b, 0);
  let leftover = remaining - used;

  // Assign leftover facings to the largest fractional remainders.
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && leftover > 0; k++) {
    floors[order[k].i] += 1;
    leftover--;
  }

  const facings = products.map((p, i) => ({
    product: p,
    facings: minFacings + floors[i],
    share: 0,
  }));

  const grandTotal = facings.reduce((a, f) => a + f.facings, 0) || 1;
  facings.forEach((f) => (f.share = f.facings / grandTotal));
  return facings;
}

/** Group facings into brand blocks (contiguous), ordered by total facing weight. */
function buildBrandBlocks(facings: Facing[], colorMap: Record<string, string>): BrandBlock[] {
  const byBrand = new Map<string, Facing[]>();
  for (const f of facings) {
    if (!byBrand.has(f.product.brand)) byBrand.set(f.product.brand, []);
    byBrand.get(f.product.brand)!.push(f);
  }
  const totalFacings = facings.reduce((a, f) => a + f.facings, 0) || 1;
  const totalRevenue = facings.reduce((a, f) => a + f.product.revenue, 0) || 1;

  const blocks: BrandBlock[] = [];
  for (const [brand, list] of byBrand) {
    const bf = list.reduce((a, f) => a + f.facings, 0);
    const rev = list.reduce((a, f) => a + f.product.revenue, 0);
    blocks.push({
      brand,
      color: colorMap[brand],
      facings: bf,
      share: bf / totalFacings,
      revenueShare: rev / totalRevenue,
      products: list.length,
      novelties: list.filter((f) => f.product.isNew).length,
    });
  }
  return blocks.sort((a, b) => b.facings - a.facings);
}

/**
 * Réordonne les blocs selon les règles merch, SANS toucher aux facings alloués
 * (l'allocation reste économique ; le merch ne fait que placer les blocs).
 * Entrée de rayon = tête de liste (remplie en premier, niveau des yeux).
 */
function orderBlocksForMerch(blocks: BrandBlock[], opts: MerchOptions): BrandBlock[] {
  if (blocks.length <= 1) return blocks;
  let ordered = [...blocks];
  if (opts.leaderAtEntrance) {
    // Le leader = plus grosse part de CA (poids marché), pas seulement de facings.
    ordered.sort((a, b) => b.revenueShare - a.revenueShare || b.facings - a.facings);
  }
  if (opts.mddNextToLeader) {
    const mddIdx = ordered.findIndex((b, i) => i > 0 && isMDD(b.brand));
    if (mddIdx > 1) {
      const [mdd] = ordered.splice(mddIdx, 1);
      ordered.splice(1, 0, mdd); // juste après le leader
    }
  }
  return ordered;
}

/**
 * Répartit un total entier `total` entre des poids, en garantissant `minEach`
 * à chacun quand la place le permet (plus grands restes). Somme exacte = total.
 */
function distributeInt(weights: number[], total: number, minEach = 0): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const m = Math.min(minEach, Math.floor(total / n)); // plancher réellement tenable
  const rest = total - m * n;
  const sum = weights.reduce((a, b) => a + Math.max(b, 0), 0) || 1;
  const exact = weights.map((w) => (Math.max(w, 0) / sum) * rest);
  const out = exact.map((x) => Math.floor(x));
  let left = rest - out.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && left > 0; k++) { out[order[k].i]++; left--; }
  return out.map((x) => x + m);
}

/**
 * Dispose les facings en BLOCS MARQUE VERTICAUX (vision bloc-marque obligatoire).
 * Chaque marque occupe une bande de colonnes contiguë sur TOUS les niveaux — donc
 * un bloc vertical propre, jamais entrelacé. Les bandes sont posées de gauche à
 * droite dans l'ordre merch : le LEADER (et la MDD adjacente) en entrée de rayon
 * (à gauche). Dans une bande, les best-sellers / nouveautés remontent au niveau
 * des yeux.
 */
function buildShelves(facings: Facing[], blocks: BrandBlock[], fixture: Fixture, locale: Locale): Shelf[] {
  const S = Math.max(1, fixture.shelves);
  const colsTotal = Math.max(1, fixture.facingsPerShelf);
  const shelfLabels = labelShelves(S, locale);
  const shelves: Shelf[] = shelfLabels.map((label, level) => ({ level, label, cells: [] }));

  const facingByBrand = new Map<string, Facing[]>();
  for (const f of facings) {
    if (!facingByBrand.has(f.product.brand)) facingByBrand.set(f.product.brand, []);
    facingByBrand.get(f.product.brand)!.push(f);
  }

  // Largeur de bande (colonnes) ∝ facings de la marque, somme = colsTotal. On NE
  // force PAS 1 colonne par marque : sinon, avec autant de marques que de colonnes,
  // toutes tomberaient à 1 et le poids du leader serait écrasé (plan « à plat »).
  // Les marques qui n'atteignent pas 1 colonne pleine (queue de gamme) ne sont pas
  // dessinées comme bloc — elles restent au plan de masse (table brandBlocks).
  const allWidths = distributeInt(blocks.map((b) => b.facings), colsTotal, 0);
  let kept = blocks.map((b, i) => ({ block: b, w: allWidths[i] })).filter((x) => x.w > 0);
  if (!kept.length && blocks.length) kept = [{ block: blocks[0], w: colsTotal }]; // garde-fou
  const drawn = kept.map((x) => x.block);
  const widths = kept.map((x) => x.w);

  const fillOrder = eyeLevelOrder(S); // niveaux à remplir d'abord : yeux, mains, haut…

  drawn.forEach((block, bi) => {
    const w = Math.max(1, widths[bi]);
    const bandCap = w * S;
    const products = (facingByBrand.get(block.brand) || []).slice().sort((a, b) => {
      if (a.product.isNew !== b.product.isNew) return a.product.isNew ? -1 : 1;
      return b.facings - a.facings;
    });
    // Remplir exactement la bande (rectangle plein) : on redistribue les facings
    // de la marque sur bandCap emplacements (proportions conservées, min 1/réf).
    const slots = distributeInt(products.map((f) => f.facings), bandCap, products.length ? 1 : 0);
    // Liste d'unités (un produit par emplacement), best-sellers d'abord.
    const units: Facing[] = [];
    products.forEach((f, i) => { for (let k = 0; k < slots[i]; k++) units.push(f); });
    // Poser rangée par rangée dans l'ordre yeux→bas, w colonnes par niveau.
    let u = 0;
    for (const level of fillOrder) {
      const rowUnits: Facing[] = [];
      for (let c = 0; c < w; c++) rowUnits.push(units[u++] ?? units[units.length - 1]);
      // Fusionner les unités consécutives du même produit en une cellule.
      for (const ru of rowUnits) {
        const last = shelves[level].cells[shelves[level].cells.length - 1];
        if (last && last.product === ru.product) last.facings += 1;
        else shelves[level].cells.push({ product: ru.product, facings: 1, share: ru.share });
      }
    }
  });

  return shelves;
}

const SHELF_WORDS: Record<Locale, { single: string; top: string; bottom: string; eye: string; hand: string; nth: (n: number) => string }> = {
  fr: { single: 'Niveau unique', top: 'Niveau haut', bottom: 'Niveau bas', eye: 'Niveau des yeux', hand: 'Niveau des mains', nth: (n) => `Niveau ${n}` },
  en: { single: 'Single shelf', top: 'Top shelf', bottom: 'Bottom shelf', eye: 'Eye level', hand: 'Hand level', nth: (n) => `Shelf ${n}` },
};

function labelShelves(n: number, locale: Locale): string[] {
  const w = SHELF_WORDS[locale];
  if (n <= 1) return [w.single];
  const labels: string[] = [];
  for (let i = 0; i < n; i++) {
    if (i === 0) labels.push(w.top);
    else if (i === n - 1) labels.push(w.bottom);
    else if (i === 1) labels.push(w.eye);
    else if (i === 2) labels.push(w.hand);
    else labels.push(w.nth(i + 1));
  }
  return labels;
}

function eyeLevelOrder(n: number): number[] {
  // Priority: eye level (1), hands (2), top (0), then the rest downward.
  const preferred = [1, 2, 0, 3, 4, 5, 6, 7];
  return preferred.filter((i) => i < n).concat(
    Array.from({ length: n }, (_, i) => i).filter((i) => !preferred.includes(i))
  );
}

function buildBuyerFrame(
  strategyKey: StrategyKey,
  blocks: BrandBlock[],
  novelties: Product[],
  totalRevenue: number,
  locale: Locale
): BuyerFrame {
  const sx = STRATEGY_TEXT[locale][strategyKey];
  const top = blocks[0];
  const leaderShare = top ? Math.round(top.share * 100) : 0;
  const brandCount = blocks.length;
  const fr = locale === 'fr';

  const keyMoves: string[] = [];
  if (top) {
    keyMoves.push(
      fr
        ? `Bloc leader « ${top.brand} » : ${leaderShare}% du linéaire pour ${Math.round(top.revenueShare * 100)}% du CA — cohérence poids marché / facing.`
        : `Lead block “${top.brand}”: ${leaderShare}% of shelf for ${Math.round(top.revenueShare * 100)}% of value — market weight and facings are consistent.`
    );
  }
  const overweight = blocks.find((b) => b.share - b.revenueShare > 0.08);
  if (overweight) {
    const pts = Math.round((overweight.share - overweight.revenueShare) * 100);
    keyMoves.push(
      fr
        ? `« ${overweight.brand} » sur-facée vs son CA — arbitrage possible de ${pts} pts vers les rotations.`
        : `“${overweight.brand}” is over-faced vs its value share — ${pts} pts could be re-allocated to fast movers.`
    );
  }
  const underweight = blocks.find((b) => b.revenueShare - b.share > 0.08);
  if (underweight) {
    const pts = Math.round((underweight.revenueShare - underweight.share) * 100);
    keyMoves.push(
      fr
        ? `« ${underweight.brand} » sous-facée vs son CA — opportunité de gagner ${pts} pts de linéaire.`
        : `“${underweight.brand}” is under-faced vs its value share — an opportunity to gain ${pts} pts of shelf.`
    );
  }
  keyMoves.push(
    fr
      ? `${brandCount} marques blocs-marquées, référence best-seller en tête de bloc, verticalisation par segment.`
      : `${brandCount} brands in clean blocks, best-seller leading each block, vertical segmentation.`
  );

  const noveltyPitch = novelties.slice(0, 6).map((p) =>
    fr
      ? `${p.brand} — ${p.name} : nouveauté positionnée au niveau des yeux, facing de lancement garanti.`
      : `${p.brand} — ${p.name}: new product placed at eye level with a guaranteed launch facing.`
  );

  return {
    headline: fr
      ? `Recommandation « ${sx.label} » — ${brandCount} marques, ${novelties.length} nouveauté(s)`
      : `“${sx.label}” recommendation — ${brandCount} brands, ${novelties.length} new product(s)`,
    categorySummary: fr
      ? `Catégorie construite selon la logique « ${sx.label} » (${sx.description.toLowerCase()}) sur une base de ${Math.round(totalRevenue).toLocaleString('fr-FR')} € de CA analysé.`
      : `Category built with the “${sx.label}” logic (${sx.description.toLowerCase()}) on ${Math.round(totalRevenue).toLocaleString('en-GB')} € of analyzed sales value.`,
    keyMoves,
    noveltyPitch: noveltyPitch.length
      ? noveltyPitch
      : [fr ? 'Aucune nouveauté détectée dans le fichier importé.' : 'No new product detected in the imported file.'],
    expectedImpact: [
      fr
        ? 'Lisibilité rayon renforcée : blocs marques homogènes et hiérarchie de facing lisible.'
        : 'Stronger shelf readability: consistent brand blocks and a clear facing hierarchy.',
      fr
        ? `Réduction du risque de rupture sur les rotations via l’allocation « ${sx.label} ».`
        : `Lower out-of-stock risk on fast movers thanks to the “${sx.label}” allocation.`,
      novelties.length
        ? (fr
            ? `Mise en avant de ${novelties.length} innovation(s) au niveau des yeux pour accélérer le sell-out.`
            : `${novelties.length} innovation(s) showcased at eye level to accelerate sell-out.`)
        : (fr
            ? 'Base saine pour intégrer les prochaines innovations sans refonte du plan.'
            : 'A sound base to integrate upcoming innovations without redoing the plan.'),
    ],
  };
}

/** Generate a full planogram for one strategy. */
export function generatePlanogram(
  products: Product[],
  key: StrategyKey,
  fixture: Fixture = DEFAULT_FIXTURE,
  locale: Locale = 'fr',
  merch: Partial<MerchOptions> = {}
): Planogram {
  const opts: MerchOptions = { ...DEFAULT_MERCH, ...merch };
  const strategy = STRATEGIES[key];
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const colorMap = brandColorMap(brands);

  const totalFacings = fixture.shelves * fixture.facingsPerShelf;
  const facingsList = allocateFacings(products, totalFacings, key);
  const brandBlocks = orderBlocksForMerch(buildBrandBlocks(facingsList, colorMap), opts);
  const shelves = buildShelves(facingsList, brandBlocks, fixture, locale);
  const novelties = products.filter((p) => p.isNew);
  const totalRevenue = products.reduce((a, p) => a + p.revenue, 0);
  const buyerFrame = buildBuyerFrame(key, brandBlocks, novelties, totalRevenue, locale);

  return {
    strategy,
    facingsList,
    shelves,
    brandBlocks,
    totalFacings,
    novelties,
    buyerFrame,
  };
}

/** Deterministic embedded copilot: rule-based reading of the dataset. */
export function deterministicInsights(products: Product[], locale: Locale = 'fr'): string[] {
  if (!products.length) return [];
  const fr = locale === 'fr';
  const insights: string[] = [];
  const totalRev = products.reduce((a, p) => a + p.revenue, 0) || 1;
  const brands = new Map<string, number>();
  for (const p of products) brands.set(p.brand, (brands.get(p.brand) || 0) + p.revenue);
  const ranked = [...brands.entries()].sort((a, b) => b[1] - a[1]);

  if (ranked[0]) {
    const share = Math.round((ranked[0][1] / totalRev) * 100);
    insights.push(
      fr
        ? `Marque leader : ${ranked[0][0]} (${share}% du CA). Ancrez le bloc en zone chaude.`
        : `Leading brand: ${ranked[0][0]} (${share}% of value). Anchor its block in the hot zone.`
    );
  }
  const novelties = products.filter((p) => p.isNew);
  if (novelties.length) {
    insights.push(
      fr
        ? `${novelties.length} nouveauté(s) détectée(s) — à remonter au niveau des yeux avec facing de lancement.`
        : `${novelties.length} new product(s) detected — raise them to eye level with a launch facing.`
    );
  }
  const naturals = products.filter(isNaturalProduct);
  if (naturals.length) {
    const natShare = Math.round((naturals.reduce((a, p) => a + p.revenue, 0) / totalRev) * 100);
    insights.push(
      fr
        ? `Pôle naturalité : ${naturals.length} réf. (${natShare}% du CA). Emplacement à trancher — zone froide, milieu de rayon ou réparti ?`
        : `Natural pole: ${naturals.length} SKUs (${natShare}% of value). Placement to be decided — cold zone, mid-aisle or spread?`
    );
  }
  const mddBrands = ranked.filter(([b]) => isMDD(b));
  if (mddBrands.length) {
    insights.push(
      fr
        ? `MDD détectée (${mddBrands.map(([b]) => b).slice(0, 2).join(', ')}) — placée à côté du bloc leader (règle merch).`
        : `Private label detected (${mddBrands.map(([b]) => b).slice(0, 2).join(', ')}) — placed next to the leader block (merch rule).`
    );
  }
  const longTail = ranked.filter(([, rev]) => rev / totalRev < 0.02).length;
  if (longTail > 0) {
    insights.push(
      fr
        ? `${longTail} marque(s) < 2% du CA : candidates à la rationalisation (queue de gamme).`
        : `${longTail} brand(s) below 2% of value: candidates for delisting (long tail).`
    );
  }
  const bestMargin = [...products].sort((a, b) => b.margin - a.margin)[0];
  if (bestMargin && bestMargin.margin > 0) {
    insights.push(
      fr
        ? `Meilleure contribution marge : ${bestMargin.brand} — ${bestMargin.name}. Testez la variante « Marge » pour la valoriser.`
        : `Best margin contribution: ${bestMargin.brand} — ${bestMargin.name}. Try the “Margin” variant to leverage it.`
    );
  }
  insights.push(
    fr
      ? `${products.length} références sur ${ranked.length} marques prêtes à être placées.`
      : `${products.length} SKUs across ${ranked.length} brands ready to be placed.`
  );
  return insights;
}
