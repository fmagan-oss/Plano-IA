#!/usr/bin/env node
/**
 * Lance toute la batterie de non-régression du robot en une commande.
 *   npm test   (→ node --import ./scripts/ts-resolve.mjs scripts/test-all.mjs)
 * Sortie 0 si tout passe, 1 sinon.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SUITES = [
  'test-formats.mjs',
  'test-planogram.mjs',
  'test-merch.mjs',
  'test-pack-library.mjs',
  'test-linear-diagnostic.mjs',
  'test-corpus-smoke.mjs',
  'test-ex12.mjs',
];

let failed = 0;
for (const s of SUITES) {
  process.stdout.write(`\n━━━ ${s} ━━━\n`);
  try {
    execFileSync(process.execPath, ['--import', join(here, 'ts-resolve.mjs'), join(here, s)], { stdio: 'inherit' });
  } catch {
    failed++;
  }
}
// train-parser tourne sans le hook (il a son propre chargement).
process.stdout.write(`\n━━━ train-parser.mjs ━━━\n`);
try { execFileSync(process.execPath, [join(here, 'train-parser.mjs')], { stdio: 'inherit' }); }
catch { failed++; }

process.stdout.write(`\n${failed === 0 ? '✅ Toute la batterie passe' : `❌ ${failed} suite(s) en échec`}\n`);
process.exit(failed ? 1 : 0);
