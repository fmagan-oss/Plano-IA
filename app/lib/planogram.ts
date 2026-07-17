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
function buildShelves(facings: Facing[], blocks: BrandBlock[], fixture: Fixture): Shelf[] {
  const shelfLabels = labelShelves(fixture.shelves);
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

function labelShelves(n: number): string[] {
  if (n <= 1) return ['Niveau unique'];
  const labels: string[] = [];
  for (let i = 0; i < n; i++) {
    if (i === 0) labels.push('Niveau haut');
    else if (i === n - 1) labels.push('Niveau bas');
    else if (i === 1) labels.push('Niveau des yeux');
    else if (i === 2) labels.push('Niveau des mains');
    else labels.push(`Niveau ${i + 1}`);
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
  strategy: Strategy,
  blocks: BrandBlock[],
  novelties: Product[],
  totalRevenue: number
): BuyerFrame {
  const top = blocks[0];
  const leaderShare = top ? Math.round(top.share * 100) : 0;
  const brandCount = blocks.length;

  const keyMoves: string[] = [];
  if (top) {
    keyMoves.push(
      `Bloc leader « ${top.brand} » : ${leaderShare}% du linéaire pour ${Math.round(top.revenueShare * 100)}% du CA — cohérence poids marché / facing.`
    );
  }
  const overweight = blocks.find((b) => b.share - b.revenueShare > 0.08);
  if (overweight) {
    keyMoves.push(
      `« ${overweight.brand} » sur-facée vs son CA — arbitrage possible de ${Math.round((overweight.share - overweight.revenueShare) * 100)} pts vers les rotations.`
    );
  }
  const underweight = blocks.find((b) => b.revenueShare - b.share > 0.08);
  if (underweight) {
    keyMoves.push(
      `« ${underweight.brand} » sous-facée vs son CA — opportunité de gagner ${Math.round((underweight.revenueShare - underweight.share) * 100)} pts de linéaire.`
    );
  }
  keyMoves.push(`${brandCount} marques blocs-marquées, référence best-seller en tête de bloc, verticalisation par segment.`);

  const noveltyPitch = novelties.slice(0, 6).map(
    (p) => `${p.brand} — ${p.name} : nouveauté positionnée au niveau des yeux, facing de lancement garanti.`
  );

  return {
    headline: `Recommandation « ${strategy.label} » — ${brandCount} marques, ${novelties.length} nouveauté(s)`,
    categorySummary: `Catégorie construite selon la logique « ${strategy.label} » (${strategy.description.toLowerCase()}) sur une base de ${Math.round(
      totalRevenue
    ).toLocaleString('fr-FR')} € de CA analysé.`,
    keyMoves,
    noveltyPitch: noveltyPitch.length ? noveltyPitch : ['Aucune nouveauté détectée dans le fichier importé.'],
    expectedImpact: [
      `Lisibilité rayon renforcée : blocs marques homogènes et hiérarchie de facing lisible.`,
      `Réduction du risque de rupture sur les rotations via l’allocation « ${strategy.label} ».`,
      novelties.length
        ? `Mise en avant de ${novelties.length} innovation(s) au niveau des yeux pour accélérer le sell-out.`
        : `Base saine pour intégrer les prochaines innovations sans refonte du plan.`,
    ],
  };
}

/** Generate a full planogram for one strategy. */
export function generatePlanogram(
  products: Product[],
  key: StrategyKey,
  fixture: Fixture = DEFAULT_FIXTURE
): Planogram {
  const strategy = STRATEGIES[key];
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const colorMap = brandColorMap(brands);

  const totalFacings = fixture.shelves * fixture.facingsPerShelf;
  const facingsList = allocateFacings(products, totalFacings, key);
  const brandBlocks = buildBrandBlocks(facingsList, colorMap);
  const shelves = buildShelves(facingsList, brandBlocks, fixture);
  const novelties = products.filter((p) => p.isNew);
  const totalRevenue = products.reduce((a, p) => a + p.revenue, 0);
  const buyerFrame = buildBuyerFrame(strategy, brandBlocks, novelties, totalRevenue);

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
export function deterministicInsights(products: Product[]): string[] {
  if (!products.length) return [];
  const insights: string[] = [];
  const totalRev = products.reduce((a, p) => a + p.revenue, 0) || 1;
  const brands = new Map<string, number>();
  for (const p of products) brands.set(p.brand, (brands.get(p.brand) || 0) + p.revenue);
  const ranked = [...brands.entries()].sort((a, b) => b[1] - a[1]);

  if (ranked[0]) {
    insights.push(
      `Marque leader : ${ranked[0][0]} (${Math.round((ranked[0][1] / totalRev) * 100)}% du CA). Ancrez le bloc en zone chaude.`
    );
  }
  const novelties = products.filter((p) => p.isNew);
  if (novelties.length) {
    insights.push(
      `${novelties.length} nouveauté(s) détectée(s) — à remonter au niveau des yeux avec facing de lancement.`
    );
  }
  const longTail = ranked.filter(([, rev]) => rev / totalRev < 0.02).length;
  if (longTail > 0) {
    insights.push(`${longTail} marque(s) < 2% du CA : candidates à la rationalisation (queue de gamme).`);
  }
  const bestMargin = [...products].sort((a, b) => b.margin - a.margin)[0];
  if (bestMargin && bestMargin.margin > 0) {
    insights.push(
      `Meilleure contribution marge : ${bestMargin.brand} — ${bestMargin.name}. Testez la variante « Marge » pour la valoriser.`
    );
  }
  insights.push(`${products.length} références sur ${ranked.length} marques prêtes à être placées.`);
  return insights;
}
