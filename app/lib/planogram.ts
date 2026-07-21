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

/** Weight of a product for a given strategy. */
function productWeight(p: Product, key: StrategyKey): number {
  switch (key) {
    case 'rotation':
      return Math.max(p.volume, 0);
    case 'margin':
      return Math.max(p.margin, 0);
    case 'revenue':
      return Math.max(p.revenue, 0);
    case 'balanced':
    default:
      return 0.45 * Math.max(p.revenue, 0) + 0.35 * Math.max(p.volume, 0) + 0.2 * Math.max(p.margin, 0);
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

  // Novelty bonus: nudge weights so new products get a fair shot at eye level.
  const rawWeights = products.map((p) => {
    const w = productWeight(p, key);
    return p.isNew ? w * 1.15 + 1 : w;
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
 * Lay facings out on shelves as brand blocks. Brands stay contiguous; within a
 * brand, best sellers first. Novelties are lifted toward eye-level shelves
 * (levels 1–2 on a 5-shelf fixture).
 */
function buildShelves(facings: Facing[], blocks: BrandBlock[], fixture: Fixture, locale: Locale): Shelf[] {
  const shelfLabels = labelShelves(fixture.shelves, locale);
  const shelves: Shelf[] = shelfLabels.map((label, level) => ({ level, label, cells: [] }));

  // Order facings brand-by-brand (blocks are sorted by weight), best sellers first.
  const facingByBrand = new Map<string, Facing[]>();
  for (const f of facings) {
    if (!facingByBrand.has(f.product.brand)) facingByBrand.set(f.product.brand, []);
    facingByBrand.get(f.product.brand)!.push(f);
  }

  // Flatten into a single sequence, expanding each product into its facings.
  const sequence: Facing[] = [];
  for (const block of blocks) {
    const list = (facingByBrand.get(block.brand) || []).sort((a, b) => {
      // novelties first inside a brand, then by facing count
      if (a.product.isNew !== b.product.isNew) return a.product.isNew ? -1 : 1;
      return b.facings - a.facings;
    });
    for (const f of list) sequence.push(f);
  }

  // Fill shelves left→right, top-priority products onto eye-level shelves first.
  // Eye-level order for a 5-shelf fixture: 1, 2, 0, 3, 4.
  const fillOrder = eyeLevelOrder(fixture.shelves);
  const capacity = fixture.facingsPerShelf;
  let oi = 0;
  let shelf = shelves[fillOrder[oi]];

  for (const f of sequence) {
    let left = f.facings;
    while (left > 0) {
      if (shelf.cells.reduce((a, c) => a + c.facings, 0) >= capacity) {
        oi++;
        if (oi >= fillOrder.length) break; // fixture full
        shelf = shelves[fillOrder[oi]];
      }
      const used = shelf.cells.reduce((a, c) => a + c.facings, 0);
      const room = capacity - used;
      const put = Math.min(room, left);
      shelf.cells.push({ product: f.product, facings: put, share: f.share });
      left -= put;
      if (left > 0) {
        oi++;
        if (oi >= fillOrder.length) break;
        shelf = shelves[fillOrder[oi]];
      }
    }
  }

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
  locale: Locale = 'fr'
): Planogram {
  const strategy = STRATEGIES[key];
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const colorMap = brandColorMap(brands);

  const totalFacings = fixture.shelves * fixture.facingsPerShelf;
  const facingsList = allocateFacings(products, totalFacings, key);
  const brandBlocks = buildBrandBlocks(facingsList, colorMap);
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
