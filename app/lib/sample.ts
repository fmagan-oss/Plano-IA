import type { Product } from './types';

/** A realistic sample panel export (rayon « Boissons énergisantes »),
 *  used for the one-click demo so visitors can see output without a file. */
export const SAMPLE_PRODUCTS: Product[] = [
  { id: 's0', brand: 'Red Bull', name: 'Red Bull Original 25cl', segment: 'Énergisant', revenue: 182000, volume: 91000, margin: 41000, price: 1.99, isNew: false },
  { id: 's1', brand: 'Red Bull', name: 'Red Bull Sugarfree 25cl', segment: 'Énergisant', revenue: 74000, volume: 36000, margin: 18000, price: 1.99, isNew: false },
  { id: 's2', brand: 'Red Bull', name: 'Red Bull Tropical 25cl', segment: 'Énergisant aromatisé', revenue: 39000, volume: 19000, margin: 9500, price: 1.99, isNew: true },
  { id: 's3', brand: 'Monster', name: 'Monster Energy 50cl', segment: 'Énergisant', revenue: 121000, volume: 68000, margin: 27000, price: 1.79, isNew: false },
  { id: 's4', brand: 'Monster', name: 'Monster Ultra 50cl', segment: 'Énergisant sans sucre', revenue: 58000, volume: 33000, margin: 14500, price: 1.79, isNew: false },
  { id: 's5', brand: 'Monster', name: 'Monster Mango Loco 50cl', segment: 'Énergisant aromatisé', revenue: 44000, volume: 24000, margin: 11000, price: 1.79, isNew: true },
  { id: 's6', brand: 'Burn', name: 'Burn Original 25cl', segment: 'Énergisant', revenue: 31000, volume: 18000, margin: 8200, price: 1.49, isNew: false },
  { id: 's7', brand: 'Burn', name: 'Burn Zero 25cl', segment: 'Énergisant sans sucre', revenue: 17000, volume: 10000, margin: 4500, price: 1.49, isNew: false },
  { id: 's8', brand: 'Rockstar', name: 'Rockstar Energy 50cl', segment: 'Énergisant', revenue: 26000, volume: 15500, margin: 6800, price: 1.59, isNew: false },
  { id: 's9', brand: 'Rockstar', name: 'Rockstar Fruit Punch 50cl', segment: 'Énergisant aromatisé', revenue: 14000, volume: 8300, margin: 3600, price: 1.59, isNew: false },
  { id: 's10', brand: 'Prime', name: 'Prime Energy Blue Raspberry 33cl', segment: 'Énergisant premium', revenue: 52000, volume: 21000, margin: 16000, price: 2.49, isNew: true },
  { id: 's11', brand: 'Prime', name: 'Prime Energy Ice Pop 33cl', segment: 'Énergisant premium', revenue: 38000, volume: 15000, margin: 11500, price: 2.49, isNew: true },
  { id: 's12', brand: 'Effea', name: 'Effea Energy 25cl (MDD)', segment: 'Énergisant', revenue: 22000, volume: 20000, margin: 7000, price: 0.79, isNew: false },
  { id: 's13', brand: 'Effea', name: 'Effea Energy Zero 25cl (MDD)', segment: 'Énergisant sans sucre', revenue: 11000, volume: 10500, margin: 3400, price: 0.79, isNew: false },
];

export const SAMPLE_FILENAME = 'Exemple — Rayon Énergisants (panel).xlsx';
