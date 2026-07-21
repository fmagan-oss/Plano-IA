#!/usr/bin/env node
/**
 * Smoke tout-corpus : parse + génère un plan pour CHAQUE fichier de
 * training-data/corpus. Verrou de fiabilité — détecte tout crash, plan vide ou
 * cellule invalide introduit par une évolution du parseur ou de l'allocation.
 * (Le rendu en bandes verticales doit toujours remplir 60 facings.)
 *
 * Usage : node --import ./scripts/ts-resolve.mjs scripts/test-corpus-smoke.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseWorkbook } from '../app/lib/parse.ts';
import { generatePlanogram } from '../app/lib/planogram.ts';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'training-data', 'corpus');
let ok = 0, empty = 0, fails = 0;

for (const f of readdirSync(dir)) {
  if (!/\.(xlsx|xls|csv)$/i.test(f)) continue;
  const b = readFileSync(join(dir, f));
  let r;
  try { r = parseWorkbook(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), f, 'fr'); }
  catch (e) { console.log(`  ✗ crash parse ${f} — ${String(e.message).slice(0, 60)}`); fails++; continue; }
  if (!r.products.length) { empty++; continue; }
  let pl;
  try { pl = generatePlanogram(r.products, 'balanced', { shelves: 5, facingsPerShelf: 12 }); }
  catch (e) { console.log(`  ✗ crash plan ${f} — ${String(e.message).slice(0, 60)}`); fails++; continue; }
  let drawn = 0, bad = false;
  for (const s of pl.shelves) for (const c of s.cells) { drawn += c.facings; if (!c.product || c.facings < 1) bad = true; }
  if (bad) { console.log(`  ✗ cellule invalide ${f}`); fails++; continue; }
  if (drawn !== 60) { console.log(`  ✗ ${f} : ${drawn} facings dessinés (≠ 60)`); fails++; continue; }
  ok++;
}

console.log(`  plans OK : ${ok}  |  fichiers sans réf. : ${empty}  |  échecs : ${fails}`);
console.log(`\n${fails === 0 ? 'Smoke corpus OK ✓' : fails + ' échec(s) ✗'}`);
process.exit(fails ? 1 : 0);
