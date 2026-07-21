#!/usr/bin/env node
/**
 * Non-régression de la bibliothèque de packs (pack-library.ts) : matching EAN,
 * retombée par catégorie, défaut générique, et enrichissement des produits
 * (le fichier prime, largeur remplie sinon). Débloque R9 hors relevé.
 *
 * Usage : node --import ./scripts/ts-resolve.mjs scripts/test-pack-library.mjs
 */
import { lookupPackDims, resolveCategoryKey, enrichProductsWithDims } from '../app/lib/pack-library.ts';

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + detail}`);
  if (!ok) fails++;
};

console.log('\n▸ résolution de catégorie');
check('« Male Hair Colour » → coloration', resolveCategoryKey('Male Hair Colour') === 'coloration', resolveCategoryKey('Male Hair Colour'));
check('« HAARKLEURMIDDELEN » → coloration', resolveCategoryKey('HAARKLEURMIDDELEN') === 'coloration', resolveCategoryKey('HAARKLEURMIDDELEN'));
check('« Vagisil intimate » → hygiene_intime', resolveCategoryKey('Vagisil intimate care') === 'hygiene_intime', resolveCategoryKey('Vagisil intimate care'));
check('inconnu → default', resolveCategoryKey('Zamboni parts') === 'default', resolveCategoryKey('Zamboni parts'));

console.log('\n▸ dimensions');
const col = lookupPackDims(undefined, 'coloration');
check('coloration : largeur typique 42 mm, source category', col.widthMm === 42 && col.source === 'category', `${col.widthMm}/${col.source}`);
const def = lookupPackDims(undefined, null);
check('sans indice : défaut générique', def.source === 'default' && def.widthMm > 0, `${def.widthMm}/${def.source}`);

console.log('\n▸ enrichissement (le fichier prime)');
const products = [
  { id: '1', brand: 'A', name: 'A', segment: 'S', revenue: 1, volume: 1, margin: 0, price: 0, isNew: false, widthCm: 9.9 },
  { id: '2', brand: 'B', name: 'B', segment: 'S', revenue: 1, volume: 1, margin: 0, price: 0, isNew: false },
];
const r = enrichProductsWithDims(products, 'coloration');
check('largeur mesurée conservée (9.9 cm)', r.products[0].widthCm === 9.9, `${r.products[0].widthCm}`);
check('largeur manquante remplie (~4.2 cm)', Math.abs(r.products[1].widthCm - 4.2) < 0.2, `${r.products[1].widthCm}`);
check('comptage retombée catégorie = 1', r.byCategory === 1, `${r.byCategory}`);

console.log(`\n${fails === 0 ? 'Bibliothèque de packs OK ✓' : fails + ' échec(s) ✗'}`);
process.exit(fails ? 1 : 0);
