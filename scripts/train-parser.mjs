#!/usr/bin/env node
/**
 * Entraînement du parseur CatPilot — analyse de la boîte de dépôt.
 *
 * Parcourt training-inbox/ (fichiers .xlsx / .csv déposés pour entraînement),
 * extrait les en-têtes de chaque fichier, les confronte au dictionnaire
 * app/lib/column-aliases.json (même logique de détection que l'app), et
 * produit un rapport : champs non reconnus, en-têtes orphelins, fichiers OK.
 *
 * Il n'invente PAS d'alias : l'ajout au dictionnaire est une décision
 * (routine nocturne pilotée par l'IA de session, ou revue humaine).
 * Les signatures d'en-têtes traitées sont archivées dans
 * training-data/processed.json (sans données produits).
 *
 * Usage : node scripts/train-parser.mjs [--json]
 * Sortie : code 0 si tout est reconnu, 2 s'il reste des trous à combler.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const INBOX = join(root, 'training-inbox');
const DATA_DIR = join(root, 'training-data');
const PROCESSED = join(DATA_DIR, 'processed.json');
const ALIASES = JSON.parse(readFileSync(join(root, 'app/lib/column-aliases.json'), 'utf8'));

/* — même normalisation/détection que app/lib/parse.ts (à garder en phase) — */
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function detectCol(headers, aliases) {
  const nh = headers.map(norm);
  for (let i = 0; i < nh.length; i++) if (aliases.some((a) => nh[i] === norm(a))) return i;
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  for (let i = 0; i < nh.length; i++) if (nh[i] && sorted.some((a) => nh[i].includes(norm(a)))) return i;
  return -1;
}

function headersOf(path) {
  const wb = XLSX.readFile(path);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false });
  let hi = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if ((rows[i] || []).filter((c) => typeof c === 'string' && c.trim()).length >= 2) { hi = i; break; }
  }
  return (rows[hi] || []).map((c) => (c == null ? '' : String(c)));
}

if (!existsSync(INBOX)) mkdirSync(INBOX, { recursive: true });
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const processed = existsSync(PROCESSED) ? JSON.parse(readFileSync(PROCESSED, 'utf8')) : {};

const files = readdirSync(INBOX).filter((f) => /\.(xlsx|csv)$/i.test(f));
const report = { files: [], gaps: 0 };

for (const f of files) {
  let headers;
  try {
    headers = headersOf(join(INBOX, f));
  } catch (e) {
    report.files.push({ file: f, error: String(e.message || e) });
    report.gaps++;
    continue;
  }
  const mapping = {};
  const matchedIdx = new Set();
  for (const field of Object.keys(ALIASES)) {
    const i = detectCol(headers, ALIASES[field]);
    mapping[field] = i >= 0 ? headers[i] : null;
    if (i >= 0) matchedIdx.add(i);
  }
  const missing = Object.keys(mapping).filter((k) => mapping[k] === null);
  const orphans = headers.filter((h, i) => h && !matchedIdx.has(i));
  // Même règle que l'app : bloquant si pas de marque, ni EAN ni libellé,
  // ou ni CA ni volume. Le reste n'est qu'un avertissement.
  const critical =
    missing.includes('brand') ||
    (missing.includes('ean') && missing.includes('name')) ||
    (missing.includes('revenue') && missing.includes('volume'));
  if (critical) report.gaps++;
  report.files.push({ file: f, mapping, missing, orphans });
  processed[f] = { headers, at: new Date().toISOString().slice(0, 10) };
}

writeFileSync(PROCESSED, JSON.stringify(processed, null, 2) + '\n');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  if (!files.length) console.log('training-inbox/ vide — rien à traiter.');
  for (const r of report.files) {
    console.log(`\n▸ ${r.file}`);
    if (r.error) { console.log(`  ERREUR : ${r.error}`); continue; }
    console.log(`  champs manquants : ${r.missing.length ? r.missing.join(', ') : 'aucun ✓'}`);
    if (r.orphans.length) console.log(`  en-têtes non reconnus : ${r.orphans.map((o) => `« ${o} »`).join(', ')}`);
  }
  console.log(`\n${report.gaps} fichier(s) avec des champs critiques manquants.`);
}
process.exit(report.gaps ? 2 : 0);
