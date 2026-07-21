#!/usr/bin/env node
/**
 * Non-régression des règles MERCH (étape 4) :
 *  - vision bloc-marque : marques contiguës sur le plan (jamais entrelacées) ;
 *  - leader (part de CA) en entrée de rayon (tête de blocs) ;
 *  - MDD placée juste à côté du leader ;
 *  - classifieurs isMDD / isNaturalProduct.
 *
 * Usage : node --import ./scripts/ts-resolve.mjs scripts/test-merch.mjs
 */
import { generatePlanogram, isMDD, isNaturalProduct } from '../app/lib/planogram.ts';

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + detail}`);
  if (!ok) fails++;
};

const P = (id, brand, revenue, volume, name = brand) => ({
  id, brand, name, ean: id, segment: 'S', revenue, volume, margin: 0, price: 0, isNew: false,
});

console.log('\n▸ classifieurs');
check('isMDD(« Carrefour Bio »)', isMDD('Carrefour Bio'));
check('isMDD(« Marque Repère »)', isMDD('Marque Repère'));
check('!isMDD(« L\'Oréal »)', !isMDD("L'Oréal"));
check('isNaturalProduct(bio)', isNaturalProduct(P('x', 'Ushuaia', 1, 1, 'Shampooing Bio Naturel')));
check('!isNaturalProduct(classique)', !isNaturalProduct(P('y', 'Petrole Hahn', 1, 1, 'Lotion classique')));

console.log('\n▸ leader (CA) en entrée + MDD adjacente');
// LEADER gros CA, MDD moyenne, PETIT petit — l'ordre facing pur mettrait la MDD 3e.
const products = [
  P('a', 'LEADER', 100000, 3000),
  P('b', 'PETIT', 15000, 500),
  P('c', 'Carrefour', 40000, 2000), // MDD, 2e par CA
  P('d', 'AUTRE', 30000, 1500),
];
const plano = generatePlanogram(products, 'balanced', { shelves: 5, facingsPerShelf: 12 });
const order = plano.brandBlocks.map((b) => b.brand);
check('leader en tête de blocs', order[0] === 'LEADER', order.join(' > '));
check('MDD (Carrefour) juste après le leader', order[1] === 'Carrefour', order.join(' > '));

console.log('\n▸ vision bloc-marque (bandes verticales alignées)');
// Bloc-marque = sur CHAQUE niveau les marques sont contiguës (un seul segment),
// ET l'ordre des marques gauche→droite est le MÊME sur tous les niveaux (bande
// verticale). On vérifie les deux.
function brandOrder(shelf) {
  const order = [];
  let prev = null;
  for (const c of shelf.cells) { if (c.product.brand !== prev) { order.push(c.product.brand); prev = c.product.brand; } }
  return order;
}
let contiguousOK = true;
let alignedOK = true;
let ref = null;
for (const s of plano.shelves) {
  if (!s.cells.length) continue;
  const order = brandOrder(s);
  if (new Set(order).size !== order.length) contiguousOK = false; // marque en 2 segments
  const key = order.join('|');
  if (ref === null) ref = key;
  else if (key !== ref) alignedOK = false;
}
check('marques contiguës sur chaque niveau (jamais 2 segments)', contiguousOK);
check('même ordre de marques sur tous les niveaux (bande verticale)', alignedOK, ref);

console.log('\n▸ leader dominant + longue traîne (poids respectés, pas de plan « à plat »)');
// 1 leader écrasant + 11 micro-marques, autant de marques que de colonnes (12).
// Le dessin doit refléter le poids (le leader garde plusieurs colonnes), pas
// donner 12 bandes égales. La traîne non dessinée reste au plan de masse.
const many = [P('lead', 'LEADER', 300000, 9000)];
for (let i = 0; i < 11; i++) many.push(P('t' + i, 'TAIL' + i, 2000, 60));
const pm = generatePlanogram(many, 'balanced', { shelves: 5, facingsPerShelf: 12 });
const leadEye = pm.shelves[1].cells.find((c) => c.product.brand === 'LEADER');
check('le leader garde plusieurs colonnes au niveau des yeux', (leadEye?.facings ?? 0) >= 3, `${leadEye?.facings} facing(s)`);
const drawnSet = new Set();
for (const s of pm.shelves) for (const c of s.cells) drawnSet.add(c.product.brand);
check('la longue traîne n\'est pas dessinée comme 12 bandes égales', drawnSet.size < 12, `${drawnSet.size} marques dessinées`);
check('toutes les marques restent au plan de masse (table)', pm.brandBlocks.length === 12, `${pm.brandBlocks.length}`);

console.log(`\n${fails === 0 ? 'Règles merch OK ✓' : fails + ' échec(s) ✗'}`);
process.exit(fails ? 1 : 0);
