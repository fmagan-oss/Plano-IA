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
const SIGN = JSON.parse(readFileSync(join(root, 'app/lib/column-signatures.json'), 'utf8'));

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
const SHARE_RE = /share|part de marche|pdm|acv|distribution|poids|weighted|vmh|(^|[^a-z0-9])(dn|dv)([^a-z0-9]|$)/;
// Signatures issues du dictionnaire (docs/formation) — R1/R2/R3, comme parse.ts.
const ANTI_ALIASES = SIGN.antiAliases;
const YA_TERMS = [...SIGN.yaMarkers, ...SIGN.yaAliases].map(norm);
const FABRICANT_ALIASES = SIGN.fabricant;
const NON_SUMMABLE = SIGN.nonSummable.map(norm);
const SUMMABLE_SALES = new Set(['revenue', 'volume', 'margin']);
const CURRENT_PERIOD = new Set(['revenue', 'volume']);

function headerMatches(nh, aliasesNorm) {
  return aliasesNorm.some((na) => {
    if (!na) return false;
    if (na.length <= 2) return new RegExp(`(^|[^a-z0-9])${na}([^a-z0-9]|$)`).test(nh);
    return nh.includes(na);
  });
}
function detectCol(headers, aliases, opts = {}) {
  const antiN = (opts.anti ?? []).map(norm);
  const eligible = headers.map(norm).map((h) => {
    if (!h) return '';
    if (antiN.length && headerMatches(h, antiN)) return '';
    if (opts.blockNonSummable && (SHARE_RE.test(h) || headerMatches(h, NON_SUMMABLE))) return '';
    if (opts.blockYA && headerMatches(h, YA_TERMS)) return '';
    return h;
  });
  const aliasesN = aliases.map(norm);
  for (let i = 0; i < eligible.length; i++) if (eligible[i] && aliasesN.includes(eligible[i])) return i;
  const sorted = [...aliasesN].sort((a, b) => b.length - a.length);
  for (let i = 0; i < eligible.length; i++) if (eligible[i] && headerMatches(eligible[i], sorted)) return i;
  return -1;
}
function detectField(headers, field) {
  let i = detectCol(headers, ALIASES[field], {
    anti: ANTI_ALIASES[field],
    blockNonSummable: SUMMABLE_SALES.has(field),
    blockYA: CURRENT_PERIOD.has(field),
  });
  if (i < 0 && field === 'brand') i = detectCol(headers, FABRICANT_ALIASES, {});
  return i;
}

function headerRowOf(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if ((rows[i] || []).filter((c) => typeof c === 'string' && c.trim()).length >= 2) return i;
  }
  return 0;
}

// Rapport panel croisé (Circana/Nielsen) : mesure en colonne, périodes/semaines
// et enseignes en colonnes, hiérarchie produits. Non lisible « à plat » : à NE
// PAS traiter comme un manque d'alias (ce serait un raccourci faux).
function looksLikeCrossTabReport(wb) {
  for (const sn of wb.SheetNames.slice(0, 12)) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false });
    for (let i = 0; i < Math.min(rows.length, 6); i++) {
      const cells = (rows[i] || []).map((c) => (c == null ? '' : String(c)));
      if (cells.map(norm).some((c) => c === 'mesures' || c === 'measures' || c === 'mesure')) return true;
      const periodCols = cells.filter(
        (c) => /\bp\d{1,2}\b.*\bdu\b.*\bau\b/i.test(c) || /\bsem\b.*\bdu\b/i.test(c) || /\bdu\b \d{2}-\d{2}-\d{4} \bau\b/i.test(c)
      ).length;
      if (periodCols >= 3) return true;
    }
  }
  return false;
}

// Rapport « Answers » large (NielsenIQ) : bande de périodes (YTD/MAT/semaines)
// AU-DESSUS d'une ligne de mesures nommées (Sales Value, Sales Units…), produits
// en hiérarchie. Non lisible « à plat » (en-tête sur 2 lignes) — pris en charge
// par pivotWideNamed dans l'app, pas un manque d'alias. Même signature ici.
const WIDE_PERIOD = /\b(ytd|mat|cam|r12|to date|rolling|moving annual)\b|\bwk ?\d|\bw\/e\b|\bsem(aine)?\b/i;
function looksLikeWideAnswers(wb) {
  for (const sn of wb.SheetNames.slice(0, 8)) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false });
    for (let i = 1; i < Math.min(rows.length, 14); i++) {
      const meas = (rows[i] || []).map((c) => norm(String(c ?? '')));
      const hasVal = meas.some((c) => c && detectField([c], 'revenue') >= 0 && !/promo|% ?chg|\bya\b/.test(c));
      const hasBrand = meas.some((c) => c && (detectField([c], 'brand') >= 0 || c === 'merk' || c === 'marque'));
      const above = (rows[i - 1] || []).map((c) => String(c ?? '').trim());
      const band = above.filter((c) => WIDE_PERIOD.test(c)).length;
      if (hasVal && hasBrand && band >= 3) return true;
    }
  }
  return false;
}

// Certains exports ont une page de garde (« Sommaire ») : on choisit la
// feuille dont la ligne d'en-têtes fait matcher le plus de champs.
function analyzeFile(path) {
  const wb = XLSX.readFile(path);
  if (looksLikeCrossTabReport(wb) || looksLikeWideAnswers(wb)) return { headers: [], report: true };
  let best = null;
  for (const sn of wb.SheetNames.slice(0, 8)) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false });
    const headers = (rows[headerRowOf(rows)] || []).map((c) => (c == null ? '' : String(c)));
    const score = Object.keys(ALIASES).filter(
      (field) => detectField(headers, field) >= 0
    ).length;
    if (!best || score > best.score) best = { headers, score };
  }
  return { headers: best ? best.headers : [], report: false };
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
  let headers, isReport;
  try {
    ({ headers, report: isReport } = analyzeFile(join(dir, f)));
  } catch (e) {
    report.files.push({ file: `${tag}/${f}`, error: String(e.message || e) });
    report.gaps++;
    continue;
  }
  // Rapport croisé Circana/Nielsen : format non lisible à plat, PAS un manque
  // d'alias — on le signale sans le compter comme trou à combler.
  if (isReport) {
    report.files.push({ file: `${tag}/${f}`, reportFormat: true });
    processed[`${tag}/${f}`] = { report: true, at: new Date().toISOString().slice(0, 10) };
    continue;
  }
  const mapping = {};
  const matchedIdx = new Set();
  for (const field of Object.keys(ALIASES)) {
    const i = detectField(headers, field);
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
  // Même garde-fou que l'app : n'est réellement bloquant (« trou à combler »)
  // que si l'on ne peut identifier les produits — ni marque ni EAN — ou si le
  // mapping contredit un attendu. Le reste (pas de libellé, pas de CA/volume…)
  // est un avertissement : l'app produit un plan dégradé, pas un alias manquant.
  const critical =
    (missing.includes('brand') && missing.includes('ean')) ||
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
    if (r.reportFormat) { console.log('  format rapport panel croisé (Circana/Nielsen) — non lisible à plat, ce n’est pas un manque d’alias.'); continue; }
    console.log(`  champs manquants : ${r.missing.length ? r.missing.join(', ') : 'aucun ✓'}`);
    if (r.orphans.length) console.log(`  en-têtes non reconnus : ${r.orphans.map((o) => `« ${o} »`).join(', ')}`);
    for (const w of r.wrongMap || []) {
      console.log(`  MAPPING INCORRECT : ${w.field} — attendu ${w.want === null ? '(aucun)' : `« ${w.want} »`}, obtenu ${w.got === null ? '(aucun)' : `« ${w.got} »`}`);
    }
  }
  console.log(`\n${report.gaps} fichier(s) avec des champs critiques manquants.`);
}
process.exit(report.gaps ? 2 : 0);
