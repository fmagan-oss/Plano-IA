#!/usr/bin/env node
/**
 * Non-régression du moteur d'allocation (R9/R10/R11) contre le corrigé de la
 * formation. Lit EX09/EX10/EX11 depuis docs/formation/, applique le diagnostic,
 * et compare aux attendus recalculés (jamais saisis de mémoire).
 *
 * Usage : node scripts/test-linear-diagnostic.mjs
 * Sortie : code 0 si tous les attendus tiennent, 1 sinon.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { pdlDiagnostic, productivityDiagnostic, ruptureFloor } from '../app/lib/linear-diagnostic.ts';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const F = (name) => join(root, 'docs/formation', name);
const rowsOf = (path, sheet) =>
  XLSX.utils.sheet_to_json(XLSX.readFile(path).Sheets[sheet], { header: 1, blankrows: false });

let fails = 0;
const approx = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + detail}`);
  if (!ok) fails++;
};

/* ---- EX09 : PDL sur linéaire développé ---- */
console.log('\n▸ EX09 — PDL sur linéaire développé (R9)');
{
  const raw = rowsOf(F('EX09_PDM_vs_PDL.xlsx'), 'Rayon coloration');
  const rows = raw.slice(1).filter((r) => r[0] && !/exercice/i.test(String(r[0]))).map((r) => ({
    label: String(r[0]), revenue: Number(r[1]) || 0, facings: Number(r[2]) || 0, width: r[3] === '' || r[3] == null ? undefined : Number(r[3]),
  }));
  const res = pdlDiagnostic(rows);
  const jfm = res.rows.find((r) => /just for men/i.test(r.label));
  const loreal = res.rows.find((r) => /oreal/i.test(r.label));
  check('TOTAL RAYON exclu', res.rows.length === 4, `${res.rows.length} lignes`);
  check('JUST FOR MEN PDM = 50%', approx(jfm.pdm * 100, 50), `${(jfm.pdm * 100).toFixed(1)}`);
  check('JUST FOR MEN PDL linéaire = 30%', approx(jfm.pdlLinear * 100, 30), `${(jfm.pdlLinear * 100).toFixed(1)}`);
  check('JUST FOR MEN sous-linéarisé de 20 pt', jfm.status === 'sous-linéarisé' && approx(jfm.gapLinear * 100, -20), `gap ${(jfm.gapLinear * 100).toFixed(1)}`);
  check('L\'ORÉAL PDL linéaire = 40%', approx(loreal.pdlLinear * 100, 40), `${(loreal.pdlLinear * 100).toFixed(1)}`);
  check('L\'ORÉAL sur-linéarisé de 10 pt', loreal.status === 'sur-linéarisé' && approx(loreal.gapLinear * 100, 10), `gap ${(loreal.gapLinear * 100).toFixed(1)}`);
  // L'Oréal en facings : écart +2,2 pt (sous le seuil 5 → aligné) → la conclusion s'inverse vs linéaire.
  check('L\'ORÉAL change de signe facings→linéaire', loreal.gapFacings < 0.05 && loreal.gapLinear > 0.05, `facings ${(loreal.gapFacings * 100).toFixed(1)} / lin ${(loreal.gapLinear * 100).toFixed(1)}`);
}

/* ---- EX10 : productivité, pas CA brut ---- */
console.log('\n▸ EX10 — productivité par facing vs CA brut (R10)');
{
  const raw = rowsOf(F('EX10_circularite_CA_facing.xlsx'), 'SKU');
  const rows = raw.slice(1).filter((r) => r[0] && !/exercice/i.test(String(r[0]))).map((r) => ({
    label: String(r[1]), revenue: Number(r[2]) || 0, facings: Number(r[3]) || 0,
  }));
  const res = productivityDiagnostic(rows);
  const noir = res.rows.find((r) => /noir/i.test(r.label));
  const brun = res.rows.find((r) => /brun/i.test(r.label));
  check('productivité moyenne = 10 714 €/facing', approx(res.meanProductivity, 10714, 5), `${Math.round(res.meanProductivity)}`);
  check('BARBE NOIR ratio 2,80×', approx(noir.ratioToMean, 2.8, 0.02), `${noir.ratioToMean.toFixed(2)}`);
  check('BARBE NOIR sous-linéarisé (rationné)', noir.status === 'sous-linéarisé', noir.status);
  check('COLORATION BRUN ratio 0,62×', approx(brun.ratioToMean, 0.62, 0.02), `${brun.ratioToMean.toFixed(2)}`);
  check('COLORATION BRUN sur-linéarisé', brun.status === 'sur-linéarisé', brun.status);
  // Piège : au CA brut, BRUN (80k) passe devant NOIR (60k) — l'inverse du bon signal.
  check('CA brut trompeur : BRUN > NOIR mais verdict inversé', brun.revenue > noir.revenue && noir.status === 'sous-linéarisé' && brun.status === 'sur-linéarisé');
}

/* ---- EX11 : plancher anti-rupture ---- */
console.log('\n▸ EX11 — plancher anti-rupture par la rotation (R11)');
{
  const raw = rowsOf(F('EX11_rotation_rupture.xlsx'), 'Rotation');
  const rows = raw.slice(1).filter((r) => r[0] && !/exercice/i.test(String(r[0]))).map((r) => ({
    label: String(r[1]), revenue: Number(r[2]) || 0, rotationPerWeek: Number(r[3]) || 0,
    facings: Number(r[4]) || 0, capacityPerFacing: Number(r[5]) || 0, reapproDays: Number(r[6]) || 0,
  }));
  const res = ruptureFloor(rows, 1);
  const chatain = res.rows.find((r) => /chatain/i.test(r.label));
  const noir = res.rows.find((r) => /noir/i.test(r.label));
  const brun = res.rows.find((r) => /brun/i.test(r.label));
  check('BARBE CHÂTAIN besoin = 12, mini = 2, OK', approx(chatain.demandOverLeadTime, 12) && chatain.minFacings === 2 && chatain.status === 'ok', `besoin ${chatain.demandOverLeadTime}, mini ${chatain.minFacings}, ${chatain.status}`);
  check('BARBE NOIR besoin = 36, mini = 6, RUPTURE', approx(noir.demandOverLeadTime, 36) && noir.minFacings === 6 && noir.status === 'rupture', `besoin ${noir.demandOverLeadTime}, mini ${noir.minFacings}, ${noir.status}`);
  check('COLORATION BRUN besoin = 4, mini = 1, sur-stocké', approx(brun.demandOverLeadTime, 4) && brun.minFacings === 1 && brun.status === 'sur-stocké', `besoin ${brun.demandOverLeadTime}, mini ${brun.minFacings}, ${brun.status}`);
  // Convergence EX10+EX11 : la référence en rupture n'est PAS celle au plus gros CA.
  check('rupture ≠ plus gros CA (NOIR 60k en rupture, CHÂTAIN 120k OK)', noir.status === 'rupture' && chatain.status === 'ok');
}

console.log(`\n${fails === 0 ? 'Tous les attendus tiennent ✓' : fails + ' attendu(s) en échec ✗'}`);
process.exit(fails ? 1 : 0);
