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
| R5 | une seule période (croisé / long) | **à construire** | croisé encore refusé ; long non filtré (Partie 3, EX05/EX06) |
| R9 | PDL sur le linéaire développé | **à construire** | moteur d'allocation (EX09) |
| R10 | circularité (CA/facing) | **à construire** | moteur d'allocation (EX10) |
| R11 | plancher anti-rupture | **à construire** | moteur d'allocation (EX11) |
| R12 | période promo exclue | **à construire** | moteur d'allocation (EX08) |

**Fait (briques 1 & 2 — la couche d'identification du parseur) :** dictionnaire
459 alias adopté, anti-alias, YA écarté du courant, moyennes non sommables,
repli fabricant, unités k€/M€, agrégat détecté par le calcul. Dictionnaire +
signatures : `app/lib/column-dictionary.json`, `column-aliases.json`,
`column-signatures.json`. Exercices EX09/10/11 + attendus dans le corpus de nuit.

**Reste (briques 3 & 4) :** R5 (lire vraiment croisé/long) et R9–R12 (le moteur
d'**allocation** planogramme — productivité, rotation, PDL sur linéaire, hors
promo). Ce n'est plus le parseur mais l'allocateur ; confié à la routine
nocturne, test-d'abord, EX05/06/08/09/10/11 comme non-régression.

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
