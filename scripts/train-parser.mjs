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
const CORPUS = join(DATA_DIR, 'corpus');
const PROCESSED = join(DATA_DIR, 'processed.json');
const ALIASES = JSON.parse(readFileSync(join(root, 'app/lib/column-aliases.json'), 'utf8'));

/* — même normalisation/détection que app/lib/parse.ts (à garder en phase) — */
const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
// Colonnes de parts/distribution (PDM, share, % ACV, DN/DV…) : jamais des
// ventes — exclues de la détection des champs numériques (CA, volume, prix, marge).
const SHARE_RE = /share|part de marche|pdm|acv|distribution|poids|weighted|(^|[^a-z0-9])(dn|dv)([^a-z0-9]|$)/;
const NUMERIC_FIELDS = new Set(['revenue', 'volume', 'margin', 'price']);
function detectCol(headers, aliases, blockShares = false) {
  const nh = headers.map(norm).map((h) => (blockShares && SHARE_RE.test(h) ? '' : h));
  for (let i = 0; i < nh.length; i++) if (nh[i] && aliases.some((a) => nh[i] === norm(a))) return i;
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  for (let i = 0; i < nh.length; i++) {
    if (!nh[i]) continue;
    const hit = sorted.some((a) => {
      const na = norm(a);
      // Alias courts (≤ 2 lettres, ex. « ca ») : frontière de mot, sinon
      // « Catégorie » serait capturée par « ca ».
      if (na.length <= 2) return new RegExp(`(^|[^a-z0-9])${na}([^a-z0-9]|$)`).test(nh[i]);
      return nh[i].includes(na);
    });
    if (hit) return i;
  }
  return -1;
}

function headerRowOf(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if ((rows[i] || []).filter((c) => typeof c === 'string' && c.trim()).length >= 2) return i;
  }
  return 0;
}

// Certains exports ont une page de garde (« Sommaire ») : on choisit la
// feuille dont la ligne d'en-têtes fait matcher le plus de champs.
function headersOf(path) {
  const wb = XLSX.readFile(path);
  let best = null;
  for (const sn of wb.SheetNames.slice(0, 8)) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false });
    const headers = (rows[headerRowOf(rows)] || []).map((c) => (c == null ? '' : String(c)));
    const score = Object.keys(ALIASES).filter(
      (field) => detectCol(headers, ALIASES[field], NUMERIC_FIELDS.has(field)) >= 0
    ).length;
    if (!best || score > best.score) best = { headers, score };
  }
  return best ? best.headers : [];
}

if (!existsSync(INBOX)) mkdirSync(INBOX, { recursive: true });
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(CORPUS)) mkdirSync(CORPUS, { recursive: true });
const processed = existsSync(PROCESSED) ? JSON.parse(readFileSync(PROCESSED, 'utf8')) : {};

// Boîte de dépôt (fichiers réels) + corpus synthétique (salle d'entraînement)
const files = [
  ...readdirSync(INBOX).filter((f) => /\.(xlsx|csv)$/i.test(f)).map((f) => ({ dir: INBOX, f, tag: 'inbox' })),
  ...readdirSync(CORPUS).filter((f) => /\.(xlsx|csv)$/i.test(f)).map((f) => ({ dir: CORPUS, f, tag: 'corpus' })),
];
const report = { files: [], gaps: 0 };

for (const { dir, f, tag } of files) {
  let headers;
  try {
    headers = headersOf(join(dir, f));
  } catch (e) {
    report.files.push({ file: `${tag}/${f}`, error: String(e.message || e) });
    report.gaps++;
    continue;
  }
  const mapping = {};
  const matchedIdx = new Set();
  for (const field of Object.keys(ALIASES)) {
    const i = detectCol(headers, ALIASES[field], NUMERIC_FIELDS.has(field));
    mapping[field] = i >= 0 ? headers[i] : null;
    if (i >= 0) matchedIdx.add(i);
  }
  const missing = Object.keys(mapping).filter((k) => mapping[k] === null);
  const orphans = headers.filter((h, i) => h && !matchedIdx.has(i));
  // Attendus de mapping (training-data/expect/<tag>/<fichier>.expect.json) :
  // vérifie que chaque champ est mappé sur la BONNE colonne, pas seulement mappé.
  const expPath = join(DATA_DIR, 'expect', tag, `${f}.expect.json`);
  const wrongMap = [];
  if (existsSync(expPath)) {
    const exp = JSON.parse(readFileSync(expPath, 'utf8'));
    for (const [field, want] of Object.entries(exp)) {
      const got = mapping[field] ?? null;
      if (got !== want) wrongMap.push({ field, want, got });
    }
  }
  // Même règle que l'app : bloquant si pas de marque, ni EAN ni libellé,
  // ou ni CA ni volume. Un mapping contraire aux attendus est aussi bloquant.
  const critical =
    missing.includes('brand') ||
    (missing.includes('ean') && missing.includes('name')) ||
    (missing.includes('revenue') && missing.includes('volume')) ||
    wrongMap.length > 0;
  if (critical) report.gaps++;
  report.files.push({ file: `${tag}/${f}`, mapping, missing, orphans, wrongMap });
  processed[`${tag}/${f}`] = { headers, at: new Date().toISOString().slice(0, 10) };
}

writeFileSync(PROCESSED, JSON.stringify(processed, null, 2) + '\n');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  if (!files.length) console.log('training-inbox/ et training-data/corpus/ vides — rien à traiter.');
  for (const r of report.files) {
    console.log(`\n▸ ${r.file}`);
    if (r.error) { console.log(`  ERREUR : ${r.error}`); continue; }
    console.log(`  champs manquants : ${r.missing.length ? r.missing.join(', ') : 'aucun ✓'}`);
    if (r.orphans.length) console.log(`  en-têtes non reconnus : ${r.orphans.map((o) => `« ${o} »`).join(', ')}`);
    for (const w of r.wrongMap || []) {
      console.log(`  MAPPING INCORRECT : ${w.field} — attendu ${w.want === null ? '(aucun)' : `« ${w.want} »`}, obtenu ${w.got === null ? '(aucun)' : `« ${w.got} »`}`);
    }
  }
  console.log(`\n${report.gaps} fichier(s) avec des champs critiques manquants.`);
}
process.exit(report.gaps ? 2 : 0);
