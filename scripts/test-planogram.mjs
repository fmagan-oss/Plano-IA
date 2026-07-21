#!/usr/bin/env node
/**
 * Non-régression de l'ALLOCATION (planogram.ts). Vérifie que le poids raisonne
 * en PARTS normalisées (et pas en CA brut qui écrasait tout) :
 *  - revenue = fair-share valeur (le leader CA mène) ;
 *  - rotation = volume (une marque volume-forte / CA-faible gagne des facings) ;
 *  - balanced ancré valeur mais tilté ;
 *  - plancher 1 facing par réf, total de facings exact.
 *
 * Usage : node scripts/test-planogram.mjs  (code 0 si OK, 1 sinon)
 */
import { generatePlanogram } from '../app/lib/planogram.ts';

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + detail}`);
  if (!ok) fails++;
};

// Jeu : LEADER (gros CA / petit volume) vs VOLUME (petit CA / gros volume) vs MID.
const P = (id, brand, revenue, volume, margin = 0) => ({
  id, brand, name: brand, ean: id, segment: 'S', revenue, volume, margin, price: 0, isNew: false,
});
const products = [
  P('a', 'LEADER', 80000, 2000),
  P('b', 'VOLUME', 20000, 8000),
  P('c', 'MID', 40000, 4000),
];
const fixture = { shelves: 5, facingsPerShelf: 12 }; // 60 facings

const fac = (plano, brand) => plano.brandBlocks.find((b) => b.brand === brand)?.facings ?? 0;

const rev = generatePlanogram(products, 'revenue', fixture);
const rot = generatePlanogram(products, 'rotation', fixture);
const bal = generatePlanogram(products, 'balanced', fixture);

console.log('\n▸ Invariants');
check('plancher : chaque marque ≥ 1 facing (revenue)', rev.brandBlocks.every((b) => b.facings >= 1));
const totalRev = rev.brandBlocks.reduce((a, b) => a + b.facings, 0);
check('total de facings = 60', totalRev === 60, `${totalRev}`);

console.log('\n▸ revenue = fair-share valeur');
check('LEADER (gros CA) a le plus de facings', fac(rev, 'LEADER') > fac(rev, 'MID') && fac(rev, 'MID') > fac(rev, 'VOLUME'),
  `L=${fac(rev,'LEADER')} M=${fac(rev,'MID')} V=${fac(rev,'VOLUME')}`);

console.log('\n▸ rotation = volume (la marque volume-forte remonte)');
check('VOLUME gagne des facings vs revenue', fac(rot, 'VOLUME') > fac(rev, 'VOLUME'),
  `rotation=${fac(rot,'VOLUME')} vs revenue=${fac(rev,'VOLUME')}`);
check('en rotation, VOLUME ≥ LEADER (il tourne le plus)', fac(rot, 'VOLUME') >= fac(rot, 'LEADER'),
  `V=${fac(rot,'VOLUME')} L=${fac(rot,'LEADER')}`);

console.log('\n▸ balanced ancré valeur mais tilté');
check('LEADER mène encore en balanced', fac(bal, 'LEADER') >= fac(bal, 'MID') && fac(bal, 'LEADER') >= fac(bal, 'VOLUME'),
  `L=${fac(bal,'LEADER')} M=${fac(bal,'MID')} V=${fac(bal,'VOLUME')}`);
check('VOLUME mieux servi en balanced qu\'en revenue pur', fac(bal, 'VOLUME') >= fac(rev, 'VOLUME'),
  `balanced=${fac(bal,'VOLUME')} vs revenue=${fac(rev,'VOLUME')}`);

console.log(`\n${fails === 0 ? 'Allocation OK ✓' : fails + ' échec(s) ✗'}`);
process.exit(fails ? 1 : 0);
