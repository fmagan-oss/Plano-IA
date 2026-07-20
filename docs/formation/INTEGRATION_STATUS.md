# Intégration de la formation dans le robot — état & plan

Matériel de référence (contrat) déposé dans `docs/formation/` :
formation, corrigé, dictionnaire (34 champs / 459 alias), exercices EX09–EX11.

**Principe de méthode (repris du doc, Partie 8) :** on n'intègre pas en réécrivant
le parseur d'un coup. Chaque règle arrive **par brique**, avec un **test qui échoue
d'abord**, puis le correctif, puis la règle la plus courte — jamais de remplacement
silencieux. Rien n'est modifié sans validation.

## État des 12 règles

| Règle | Sujet | État actuel du robot | À faire |
|---|---|---|---|
| R1 | préférer l'année courante (YA) | risque de capter YA | démoter les en-têtes YA/LY/PY/N-1 ; champ N-1 séparé |
| R2 | marque ≠ fabricant | « première trouvée » | deux champs distincts ; défaut = marque |
| R3 | ne jamais sommer une moyenne | partiel (SHARE_RE) | généraliser via la signature `sommable:false` |
| R4 | frontière de mot (alias courts) | **fait** | — |
| R5 | une seule période | partiel (écart CA/volume signalé) | formats croisé / long (voir Partie 3) |
| R6 | une seule devise / unité | absent | lire l'unité dans l'intitulé (k€, GBP, colis) |
| R7 | exclure les agrégats par le calcul | par libellé (TOTAL_RE) | détecter « valeur ≈ Σ des sœurs » |
| R8 | colonne non résolue signalée | partiel | nommer la colonne + 3 valeurs |
| R9 | PDL sur le linéaire développé | absent (par marque/type) | facings × largeur ; signaler si largeurs absentes |
| R10 | circularité (CA/facing) | absent | productivité par facing, pas CA brut |
| R11 | plancher anti-rupture | absent | facings_mini via rotation |
| R12 | période promo exclue | absent | base d'allocation hors promo |

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
