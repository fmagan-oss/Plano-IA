# Intégration de la formation dans le robot — état & plan

Matériel de référence (contrat) déposé dans `docs/formation/` :
formation, corrigé, dictionnaire (34 champs / 459 alias), exercices EX09–EX11.

**Principe de méthode (repris du doc, Partie 8) :** on n'intègre pas en réécrivant
le parseur d'un coup. Chaque règle arrive **par brique**, avec un **test qui échoue
d'abord**, puis le correctif, puis la règle la plus courte — jamais de remplacement
silencieux. Rien n'est modifié sans validation.

## État des 12 règles

| Règle | Sujet | État | Preuve |
|---|---|---|---|
| R1 | préférer l'année courante (YA) | **FAIT** | trap-ya : CA = « Sales Value », pas « Sales Value YA » |
| R2 | marque ≠ fabricant | **FAIT** | trap-fab : Marque = « BRAND », pas « MANUFACTURER » |
| R3 | ne jamais sommer une moyenne | **FAIT** | trap-vmh : CA = « CA HT », pas « VMH » (signature `sommable:false`) |
| R4 | frontière de mot (alias courts) | **FAIT** | « ca » ne capture pas « Catégorie » |
| R6 | unité déclarée (k€/M€, devise) | **FAIT** | k€ → ×1000 ; £/GBP → avertissement devise mixte |
| R7 | exclure les agrégats par le calcul | **FAIT** | trap-agg : « Café Or » (= Σ des autres) exclu, sans libellé « total » |
| R8 | colonne/champ manquant signalé | **FAIT (partiel)** | avertissements par champ ; nommage des colonnes-mesure non résolues : à finir |
| R5 | une seule période — long **et** croisé | **FAIT** | **long** : format détecté (produit répété sur ≥2 périodes), période de référence résolue (cumul YTD/CAM/MAT préféré, sinon période la plus récente), autres périodes écartées. Test : fr-format-long-ytd (YTD → 57/43, pas de double comptage). **croisé** (mesure + périodes en colonnes) : période de référence unique choisie (cumul > période > semaine, jamais l'année précédente ni une colonne vide), un seul niveau de hiérarchie = le plus grossier dont la somme reconstitue le total de la catégorie (marques, pas les SKU). Tests : fr-format-croise (P6 → 60/40, total exclu) ; réel Circana HYPERS multi-feuilles (CAM retenu → 6 marques, Σ = 2 395 k€ ≈ total catégorie 2 411 k€, SKU et sous-totaux écartés). Refus propre si aucun niveau ne reconstitue le total. |
| R9 | PDL sur le linéaire développé | **FAIT** | `linear-diagnostic.pdlDiagnostic` : PDL = facings × largeur. EX09 : JUST FOR MEN sous-linéarisé 20 pt, L'ORÉAL sur-linéarisé 10 pt (conclusion inversée vs facings). Largeurs absentes → signalé, repli facings. |
| R10 | circularité (CA/facing) | **FAIT** | `productivityDiagnostic` : signal = productivité/facing, pas CA brut. EX10 : BARBE NOIR 2,80× rationné, COLORATION BRUN 0,62× sur-linéarisé (verdict inverse du CA brut). |
| R11 | plancher anti-rupture | **FAIT** | `ruptureFloor` : facings_mini = ⌈(rot/j × réappro × coef_pointe)/capacité⌉. EX11 : BARBE NOIR 6 facings requis vs 2 = rupture ; coef_pointe paramétrable. |
| R12 | période promo exclue | **FAIT** | pivot croisé : dimension « Causales Promo » → lecture sur « Total Promo et Hors Promo », la « promo seule » écartée. Test fr-croise-promo (Arôma 60000, pas 13000 promo ni 73000 sommé). |

**Fait (briques 1 & 2 — la couche d'identification du parseur) :** dictionnaire
459 alias adopté, anti-alias, YA écarté du courant, moyennes non sommables,
repli fabricant, unités k€/M€, agrégat détecté par le calcul. Dictionnaire +
signatures : `app/lib/column-dictionary.json`, `column-aliases.json`,
`column-signatures.json`. Exercices EX09/10/11 + attendus dans le corpus de nuit.

**Fait (brique 4 — le moteur d'allocation) :** R9 (PDL sur linéaire développé),
R10 (productivité par facing, pas CA brut), R11 (plancher anti-rupture par la
rotation), R12 (vue promo complète, promo seule écartée). Fonctions pures dans
`app/lib/linear-diagnostic.ts`, testées contre le corrigé (EX09/10/11) par
`scripts/test-linear-diagnostic.mjs`. R12 dans le pivot croisé de `parse.ts`.

**Les 12 règles sont opérationnelles.** Reste à la routine nocturne : brancher
ces diagnostics dans l'UI (afficher sur/sous-linéarisation, plancher rotation,
alerte quand deux méthodes divergent — EX10+EX11), élargir le corpus de fichiers
réels, et calibrer le coefficient de pointe par catégorie/enseigne.

## Formats de fichier lus (couche R5, au 2026-07-21)

| Format | Exemple | État |
|---|---|---|
| plat (un produit/ligne) | exports simples FR/EN | lu |
| long (période en colonne) | NielsenIQ, Male Hair NH | lu (une période de référence) |
| croisé (mesure + périodes en colonnes) | Circana « Geographies » (un fichier = une enseigne) | lu (niveau marque, CAM, R12 promo) |
| « Answers » large (période au-dessus de mesures nommées) | NielsenIQ JFM/Vagisil (DrugFood, ASW) | lu (`pivotWideNamed`) |

**Enseigne & catégorie (multi-enseigne).** Les exports NielsenIQ « Answers »
empilent PLUSIEURS enseignes (colonne « Markets ») et parfois plusieurs
catégories (GROEP) dans la même feuille. On ne lit JAMAIS tout confondu (somme
fausse) : `parseWorkbook` expose `enseignes`/`categories` et lit UNE enseigne +
UNE catégorie (choisies via `select`, sinon la première réelle). Les fichiers
Circana, eux, sont un-fichier-par-enseigne (l'enseigne = le fichier). Vérifié :
DrugFood → SM/D/Overig Retail / HAARKLEURMIDDELEN, JUST_FOR_MEN dominant,
Σ marques = total catégorie ; override Kruidvat/Etos OK ; CA = « Sales Value »
(jamais « Any Promo » ni « YA » ni « Sales Units »).

## Ordre proposé (à valider par François)

1. **Brique 1 — Dictionnaire + désambiguïsation (R1, R2, R3, R8).** Adopter les
   459 alias + anti-alias + signatures. Ferme les raisons de refus 20/21/22.
   Risque faible, gain immédiat sur la reconnaissance. Testé sur EX02/EX03/EX09-11.
2. **Brique 2 — Agrégats & unités (R6, R7).** Détection d'agrégat par le calcul,
   normalisation des unités/devises. Tests EX01/EX07.
3. **Brique 3 — Formes de fichier (R5).** Croisé et long réellement lus, pas
   seulement refusés. Tests EX05/EX06.
4. **Brique 4 — Rouages planogramme (R9, R10, R11, R12).** PDL sur linéaire,
   productivité, plancher rotation, exclusion promo — dans le moteur d'allocation.
   Tests EX09/EX10/EX11.

Chaque brique = un lot de tests de non-régression qui tournent chaque nuit. Le
critère de réussite n'est pas « le bon chiffre » mais **« le robot refuse et
explique quand il ne peut pas produire proprement »**.
