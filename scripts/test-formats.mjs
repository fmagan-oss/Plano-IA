#!/usr/bin/env node
/**
 * Non-régression des FORMATS + de la sélection d'enseigne + du plan non vide.
 * Verrouille les correctifs de fiabilité (enseigne par défaut = la plus grosse,
 * plan toujours non vide) pour que le bug « un seul visuel » ne revienne pas en
 * silence. Tourne sur des fixtures synthétiques du corpus (aucune donnée réelle).
 *
 * Usage : node scripts/test-formats.mjs   (code 0 si tout tient, 1 sinon)
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseWorkbook } from '../app/lib/parse.ts';
import { generatePlanogram } from '../app/lib/planogram.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => {
  const b = readFileSync(join(root, rel));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + detail}`);
  if (!ok) fails++;
};

// Cas : { fichier, enseigne attendue par défaut (ou null), nb produits mini }
const CASES = [
  { file: 'training-data/corpus/fr-long-multi-enseigne.xlsx', enseigne: 'Grosse Enseigne', minRefs: 3 },
  { file: 'training-data/corpus/nielsen-answers-multi-enseigne.xlsx', enseigne: 'Total France', minRefs: 2 },
  { file: 'training-data/corpus/fr-format-croise.xlsx', enseigne: null, minRefs: 2 },
  { file: 'training-data/corpus/fr-croise-promo.xlsx', enseigne: null, minRefs: 2 },
];

for (const c of CASES) {
  console.log(`\n▸ ${c.file.split('/').pop()}`);
  let r;
  try {
    r = parseWorkbook(load(c.file), c.file, 'fr');
  } catch (e) {
    check('lecture', false, String(e.message).slice(0, 100));
    continue;
  }
  if (c.enseigne) check(`enseigne par défaut = « ${c.enseigne} » (la plus grosse)`, r.enseigne === c.enseigne, `obtenu « ${r.enseigne} »`);
  check(`≥ ${c.minRefs} références lues`, r.products.length >= c.minRefs, `${r.products.length} lues`);
  // Le plan doit toujours être NON VIDE (le vrai symptôme du bug « un seul visuel »).
  const plano = generatePlanogram(r.products, 'balanced');
  check('plan non vide (≥ 2 blocs, facings > 0)', plano.brandBlocks.length >= 2 && plano.totalFacings > 0, `${plano.brandBlocks.length} blocs`);
}

console.log(`\n${fails === 0 ? 'Tous les formats tiennent ✓' : fails + ' échec(s) ✗'}`);
process.exit(fails ? 1 : 0);
