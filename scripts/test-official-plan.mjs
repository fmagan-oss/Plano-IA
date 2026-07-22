#!/usr/bin/env node
/**
 * Point 4 — lecteur de plan officiel (logique de domaine, pure).
 * Vérité-terrain : plan « ASSOUPLISSANTS - MAI 2026 » Carrefour, TYPOLOGIE 3,
 * élément 1 (valeurs lues sur le PDF, EAN vérifiés par leur clé de contrôle).
 *
 * Usage : node --import ./scripts/ts-resolve.mjs scripts/test-official-plan.mjs
 */
import { assembleOfficialPlan, parseFixtureLine, isValidEan13 } from '../app/lib/official-plan.ts';

let fails = 0;
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : ' — ' + detail}`);
  if (!ok) fails++;
};

console.log('\n▸ meuble : « TYPOLOGIE 3 - 5 x 133 cm »');
const fx = parseFixtureLine('TYPOLOGIE 3 - 5 x 133 cm');
check('typologie = 3', fx?.typologie === 3, `${fx?.typologie}`);
check('niveaux = 5', fx?.shelves === 5, `${fx?.shelves}`);
check('largeur élément = 133 cm', fx?.elementWidthCm === 133, `${fx?.elementWidthCm}`);
check('ligne meuble illisible → null (pas de devinette)', parseFixtureLine('MEUBLE STANDARD') === null);

console.log('\n▸ validation EAN-13 (clé de contrôle)');
check('8006530122771 valide (réf. 1)', isValidEan13('8006530122771'));
check('8006530204996 valide (réf. 6)', isValidEan13('8006530204996'));
check('3560071194840 valide (réf. 24)', isValidEan13('3560071194840'));
check('8006530122770 INVALIDE (clé fausse)', !isValidEan13('8006530122770'));

console.log('\n▸ assemblage plan officiel (élément 1, extrait réel)');
const input = {
  retailer: 'Carrefour', category: 'ASSOUPLISSANTS', date: '22/05/2026',
  fixtureLine: 'TYPOLOGIE 3 - 5 x 133 cm', trafficLeftToRight: true,
  segments: ['DILUES', 'ULTRAS', 'BERLINGOTS', 'PARFUMS DE LINGE'],
  rows: [
    { position: 1, name: 'LENOR UNSTOPPABLE AERIEN 19D', typo: 1, facings: 1 },
    { position: 6, name: 'LENOR LIGHT 0% FRAICHEUR DE COTON 71D', typo: 1, facings: 4 },
    { position: 24, name: '600ML ADOU CONC FRAICH CRF ESS', typo: 1, facings: 5 },
  ],
  eans: ['8006530122771', '8006530204996', '3560071194840'],
};
const { plan, error } = assembleOfficialPlan(input);
check('plan produit (pas d\'erreur)', !!plan && error === null, error ?? '');
check('meuble 5 × 133 cm', plan?.fixture.shelves === 5 && plan?.fixture.elementWidthCm === 133);
check('3 SKU alignées', plan?.skus.length === 3, `${plan?.skus.length}`);
check('EAN attaché à la bonne réf. (pos 6 → 8006530204996)', plan?.skus.find((s) => s.position === 6)?.ean === '8006530204996');
check('facings conservés (pos 24 → 5)', plan?.skus.find((s) => s.position === 24)?.facings === 5);
check('segments portés', plan?.segments.length === 4);
check('sens trafic gauche→droite', plan?.trafficLeftToRight === true);

console.log('\n▸ garde-fou : nb EAN ≠ nb lignes → règle d\'or (aucun plan)');
const bad = assembleOfficialPlan({ ...input, eans: ['8006530122771', '8006530204996'] });
check('plan = null', bad.plan === null);
check('motif d\'alignement clair', !!bad.error && /align/i.test(bad.error), bad.error ?? '');

console.log('\n▸ EAN décodé mais checksum invalide → non attaché + signalé');
const withBad = assembleOfficialPlan({
  ...input,
  eans: ['8006530122771', '8006530204990', '3560071194840'], // 2e = clé fausse
});
check('EAN invalide mis à null (jamais attaché en silence)', withBad.plan?.skus.find((s) => s.position === 6)?.ean === null);
check('anomalie signalée dans warnings', (withBad.plan?.warnings.length ?? 0) >= 1, JSON.stringify(withBad.plan?.warnings));

console.log(`\n${fails === 0 ? 'Lecteur de plan officiel OK ✓' : fails + ' échec(s) ✗'}`);
process.exit(fails ? 1 : 0);
