#!/usr/bin/env node
/**
 * EX12 — écarter une période INCOMPLÈTE au lieu de l'utiliser.
 * Cas de référence (CLAUDE.md) : P6 complète, P7 couverte à 73,2 % → RETENIR P6,
 * NE PAS utiliser P7 ; P7 incomplète signalée (motif clair), jamais en silence.
 *
 * Contrôle : cas (a) — la couverture est FOURNIE en donnée (aucune inférence).
 * Info de couverture absente (null) → règle d'or : période non utilisée + motif.
 *
 * INDÉPENDANCE : le contrat EX12 est testé avec un seuil FIXE écrit en dur ici
 * (FIXED_THRESHOLD), et NON avec le défaut de production. Il doit rester vrai
 * « à un seuil > 73,2 %, P7 (73,2 %) est écartée et P6 (100 %) retenue », quelle
 * que soit la valeur future de DEFAULT_PERIOD_COVERAGE_THRESHOLD.
 *
 * Usage : node --import ./scripts/ts-resolve.mjs scripts/test-ex12.mjs
 */
import { selectCompletePeriod, DEFAULT_PERIOD_COVERAGE_THRESHOLD } from '../app/lib/parse.ts';

// Seuil de test FIXE (> 73,2 %), écrit en dur — le contrat EX12 n'en dépend PAS
// du défaut de production.
const FIXED_THRESHOLD = 0.8;

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + detail}`);
  if (!ok) fails++;
};

console.log(`\n(info, non bloquant) défaut de production = ${Math.round(DEFAULT_PERIOD_COVERAGE_THRESHOLD * 100)} % — EX12 ne s'appuie PAS dessus`);

console.log(`\n▸ EX12 : P6 (100 %) vs P7 (73,2 %) — seuil FIXE ${FIXED_THRESHOLD * 100} % passé explicitement`);
const r = selectCompletePeriod(
  [{ label: 'P6', coverage: 1.0 }, { label: 'P7', coverage: 0.732 }],
  { threshold: FIXED_THRESHOLD }
);
check('RETIENT P6', r.chosen === 'P6', `chosen=${r.chosen}`);
check('ÉCARTE P7 (dans rejected)', r.rejected.some((x) => x.label === 'P7'), JSON.stringify(r.rejected));
check('P7 marquée « incomplete »', r.rejected.find((x) => x.label === 'P7')?.reason === 'incomplete');
check('motif clair mentionne P7 et son taux', /P7/.test(r.reason ?? '') && /73[.,]2/.test(r.reason ?? ''), r.reason ?? '(vide)');
check('le seuil appliqué remonté = seuil fixe passé', r.threshold === FIXED_THRESHOLD, `${r.threshold}`);

console.log('\n▸ le seuil est un PARAMÈTRE (abaissé à 70 % → P7 redevient acceptable)');
const r2 = selectCompletePeriod(
  [{ label: 'P6', coverage: 1.0 }, { label: 'P7', coverage: 0.732 }],
  { threshold: 0.7 }
);
check('P7 non écartée à seuil 70 %', !r2.rejected.some((x) => x.label === 'P7'), JSON.stringify(r2.rejected));
check('un plan reste possible (chosen non nul)', r2.chosen !== null, `${r2.chosen}`);

console.log(`\n▸ règle d'or : seule P7 (incomplète) disponible → aucun plan, motif (seuil fixe ${FIXED_THRESHOLD * 100} %)`);
const r3 = selectCompletePeriod([{ label: 'P7', coverage: 0.732 }], { threshold: FIXED_THRESHOLD });
check('chosen = null (on n\'utilise PAS P7)', r3.chosen === null, `${r3.chosen}`);
check('motif explique le refus', !!r3.reason && /P7/.test(r3.reason), r3.reason ?? '(vide)');

console.log('\n▸ cas (a) strict : couverture inconnue (null) → règle d\'or, jamais deviné');
const r4 = selectCompletePeriod(
  [{ label: 'P6', coverage: null }, { label: 'P7', coverage: null }],
  { threshold: FIXED_THRESHOLD }
);
check('chosen = null (info de couverture absente)', r4.chosen === null, `${r4.chosen}`);
check('périodes marquées « unknown » (pas « incomplete »)', r4.rejected.every((x) => x.reason === 'unknown'), JSON.stringify(r4.rejected));

console.log(`\n${fails === 0 ? 'EX12 OK ✓' : fails + ' échec(s) ✗'}`);
process.exit(fails ? 1 : 0);
