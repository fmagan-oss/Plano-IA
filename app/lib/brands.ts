// Stable brand → color assignment so a brand keeps the same color across
// every planogram, variant and chart.

const PALETTE = [
  '#2563eb', // blue
  '#db2777', // pink
  '#16a34a', // green
  '#ea580c', // orange
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#ca8a04', // amber
  '#dc2626', // red
  '#4f46e5', // indigo
  '#059669', // emerald
  '#c026d3', // fuchsia
  '#65a30d', // lime
  '#0d9488', // teal
  '#e11d48', // rose
  '#9333ea', // purple
  '#0284c7', // sky
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Deterministic color for a brand name. */
export function brandColor(brand: string): string {
  return PALETTE[hash(brand) % PALETTE.length];
}

/** Build a color map for a set of brands, spreading them across the palette
 *  so adjacent brands (by revenue) rarely collide. */
export function brandColorMap(brands: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  brands.forEach((b, i) => {
    // Prefer the hashed color; fall back to sequential to avoid duplicates.
    let color = brandColor(b);
    if (Object.values(map).includes(color)) {
      color = PALETTE[i % PALETTE.length];
    }
    map[b] = color;
  });
  return map;
}
