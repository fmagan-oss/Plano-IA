# CatPilot — Programme d'analyse (extraction complète, étape par étape)

*Document destiné à un audit externe (« formateur IA »). Il décrit ce que le code
fait **réellement** aujourd'hui, pas une version idéalisée. Objectif de l'audit :
fiabiliser l'analyse (le plan sort encore faux sur certains fichiers réels).*

Fichiers concernés dans le code :
- `app/lib/parse.ts` — lecture du fichier → liste de produits (le « parseur / robot »).
- `app/lib/planogram.ts` — allocation des facings → plan de masse + plan au facing.
- `app/lib/linear-diagnostic.ts` — diagnostics R9 / R10 / R11 + divergence.
- `app/lib/column-aliases.json` / `column-signatures.json` — dictionnaire (459 alias) + signatures.

---

## 0. Vue d'ensemble

Entrée : un export panel (Circana, NielsenIQ…) ou une liste de références (Excel/CSV).
Sortie : un planogramme (plan de masse + plan au facing) + une trame acheteur + des diagnostics.

Quatre phases :
- **A. Lire proprement** (reconnaître le format, mapper les colonnes, écarter les pièges) → règles R1–R8 + R5.
- **B. Résoudre les dimensions** (une seule période, une seule enseigne, une catégorie).
- **C. Allouer le linéaire** (répartir les facings, faire les blocs, remplir les planches).
- **D. Diagnostiquer** (sur/sous-linéarisation, plancher rotation, divergence) → R9/R10/R11.

Principe directeur (contrat) : **rigueur, aucun raccourci. Si l'info n'est pas là,
on ne l'invente pas — on refuse et on explique.**

---

## PHASE A — Lire proprement (le parseur `parseWorkbook`)

### Étape 1 — Ouvrir le classeur
- Lecture via SheetJS. Si illisible → erreur métier claire (jamais « TypeError »).

### Étape 2 — Reconnaître le FORMAT du fichier (dans cet ordre)
Le robot essaie 3 formes, de la plus structurée à la plus simple :

1. **Croisé (type Circana « Geographies »)** — `detectAndPivotCrossTab`
   Signature : une colonne « Mesures » + des colonnes-périodes (« P6 du … au … », « Sem du … »).
   Action : on **pivote** en tableau à plat `[Marque, CA, Volume]` :
   - période de référence = **cumul (CAM/MAT/YTD) préféré**, sinon la période complète la plus récente ; jamais l'année précédente (YA) ; jamais une colonne vide ;
   - un seul **niveau de hiérarchie** = le plus grossier (marques, pas SKU) dont la somme des CA **reconstitue le total de la catégorie** (± 6 %) ; sinon refus ;
   - dimension **promo** (« Causales Promo ») : on lit la vue complète « Total Promo et Hors Promo », jamais la « promo seule » (R12) ;
   - entre feuilles du classeur : on préfère la période la plus solide (cumul > période > semaine) puis la plus riche en marques.

2. **« Answers » large (type NielsenIQ)** — `pivotWideNamed`
   Signature : en-tête sur **2 lignes** (bande de périodes YTD/MAT/semaines **au-dessus** d'une ligne de mesures nommées : « Sales Value », « Sales Units »…), hiérarchie produit en colonnes (Markets / GROEP / MERK / UPC).
   Action :
   - période de référence : cumul (MAT/YTD) le plus récent, jamais l'année précédente ;
   - CA = mesure « Sales Value » **pleine** — **jamais** « Sales Value **Any Promo** » ni « **YA** » ni « Sales **Units** » (le volume) ;
   - **multi-enseigne + multi-catégorie** : ces exports empilent plusieurs enseignes (colonne Markets) et catégories (GROEP). On lit **UNE enseigne + UNE catégorie** (choisie, sinon la première réelle) et on expose la liste ;
   - niveau marque = marque remplie + EAN vide ; validation : Σ marques = total catégorie (± 8 %), sinon refus.

3. **À plat** (une ligne = un produit) — `pickBestSheet`
   Sinon : on choisit la feuille dont la ligne d'en-têtes fait matcher le plus de champs.

### Étape 3 — Mapper les colonnes (dictionnaire + signatures) → R1, R2, R3, R4, R8
Pour chaque champ métier (marque, EAN, libellé, segment, CA, volume, marge, prix, nouveauté),
`detectField` cherche la bonne colonne via 459 alias, avec des **garde-fous** :
- **R1 — année précédente écartée** : pour le CA/volume courant, toute colonne « YA / A-1 / year ago » est exclue.
- **R2 — marque ≠ fabricant** : la marque prime ; le fabricant n'est qu'un **repli** si aucune marque.
- **R3 — ne jamais sommer une moyenne** : les colonnes non-sommables (VMH, VMM, prix moyen, DN, DV, PDM, part, indice) sont exclues du CA/volume (signature `sommable:false`).
- **R4 — frontière de mot** : un alias court (« ca ») ne capture pas « Catégorie ».
- **R8 — champ manquant signalé** : chaque champ absent produit un avertissement lisible (jamais silencieux).

### Étape 4 — Colonnes d'AUDIT (optionnelles)
Détection à part (pour ne pas polluer le mapping panel) de : facings actuels, largeur facing,
rotation (UVC/mag/sem), capacité par facing, réappro (jours). Présentes seulement dans un
**relevé linéaire**, jamais dans un panel. Elles activent R9 et R11 (voir Phase D).

### Étape 5 — Règle des périodes (ne jamais mélanger deux périodes)
Si le CA et le volume détectés portent des marqueurs de période différents (« CA P6 » vs
« Qté P7 »), on **ne combine pas** : on garde la période du CA, on ignore le volume mal aligné, on le signale.

### Étape 6 — Unité déclarée → R6
Si l'intitulé du CA porte « k€ » → ×1000, « M€ » → ×1 000 000. Devise mixte (£/GBP) → avertissement.

### Étape 7 — Format LONG (période en colonne) → R5 (forme longue)
Signature : une colonne « Période » **et** un même produit sous ≥ 2 périodes.
Action : on résout **UNE période de référence** (cumul YTD/CAM/MAT préféré, sinon la plus récente)
et on **filtre** les autres lignes — un produit n'est jamais compté plusieurs fois.

### Étape 8 — Enseigne (colonne « Markets ») → R5 (forme enseigne)
Un fichier plat/long peut empiler **plusieurs enseignes**. On ne les additionne jamais :
on lit **UNE enseigne** (choisie, sinon la première réelle), les autres restent accessibles au sélecteur.
Garde-fou : la colonne doit être une vraie enseigne (libellés texte, 2 à 40 valeurs), pas une mesure.

---

## PHASE B — Construire la liste de produits

### Étape 9 — Boucle de lecture ligne à ligne
Pour chaque ligne retenue (bonne période, bonne enseigne) :
- on **écarte les lignes d'agrégat** explicites (« Total », « Sous-total », « Ensemble ») ;
- on lit marque, EAN, libellé, segment ;
- CA = valeur × échelle (R6) ; marge en % convertie en € ; volume ;
- on lit les champs d'audit s'ils existent.

### Étape 10 — Exclure les agrégats PAR LE CALCUL → R7
Une ligne dont le CA (ou le volume) ≈ la **somme des autres** **est** un agrégat, même si elle
ne s'appelle pas « Total » (ombrelle « Café Or », « Ensemble », nom de marque parent). On la retire.

### Étape 11 — Garde-fous (refus propre)
Si trop de lignes sont illisibles (> 60 %), ou **ni marque ni EAN** identifiables → on lève une
**erreur métier précise** (colonnes trouvées, raison) et **aucun planogramme n'est généré**
(mieux vaut refuser que produire un plan faux).

Sortie de la phase : `{ produits[], colonnes détectées, avertissements, enseignes/catégories disponibles }`.

---

## PHASE C — Allouer le linéaire (`generatePlanogram`)

### Étape 12 — Poids de chaque produit (selon l'angle stratégique)
- **CA** : poids = CA. **Rotation** : poids = volume. **Marge** : poids = marge. **Équilibré** : 0,45·CA + 0,35·volume + 0,20·marge.

### Étape 13 — Allocation des facings (`allocateFacings`)
- **Minimum 1 facing** par référence ;
- **bonus nouveauté** (léger) pour les innovations ;
- répartition du reste **proportionnelle au poids**, méthode du **plus fort reste** (largest remainder).

### Étape 14 — Blocs marques + planches
- **Blocs marques** contigus, triés par poids ;
- remplissage des planches gauche→droite, priorité **niveau des yeux** (planche 2) ;
- nouveautés remontées au niveau des yeux.

### Étape 15 — Trame acheteur (`buildBuyerFrame`)
Génère les textes de présentation depuis les chiffres du plan (bloc leader, sur/sous-facing, nouveautés, impact attendu).

---

## PHASE D — Diagnostics (`linear-diagnostic.ts`)

### R10 — Productivité par facing (toujours)
Signal non biaisé = **CA / facing**, pas le CA brut (le CA observé est déjà le produit de
l'implantation actuelle → circularité). Au-dessus de la moyenne = **sous-linéarisé** (bridé par l'espace).

### R9 — Part de linéaire sur le linéaire DÉVELOPPÉ (si largeur + facings présents)
PDL = facings × **largeur**, pas le nombre de facings. La conclusion peut **s'inverser** d'une
marque large à une marque étroite. Largeurs absentes → repli sur facings + avertissement.

### R11 — Plancher anti-rupture (si rotation + capacité + réappro présents)
`facings_mini = ⌈(rotation/jour × jours_réappro × coef_pointe) / capacité_par_facing⌉`.
Contrainte, jamais critère : on ne descend pas dessous ; si l'espace manque → déréférencement.
**Sans ces colonnes, la déclinaison n'est pas proposée** (rien inventé).

### Divergence (EX10 + EX11)
Quand productivité et rotation **désignent la même référence** → attribution solide.
Quand elles **se contredisent** → alerte (à trancher à la main, pas au hasard).

---

## Les 12 règles (récapitulatif)

| # | Règle | Où |
|---|---|---|
| R1 | Écarter l'année précédente (YA / A-1) | mapping + pivots |
| R2 | Marque ≠ fabricant (fabricant = repli) | mapping |
| R3 | Ne jamais sommer une moyenne (VMH, prix moyen, DN/DV, part) | mapping |
| R4 | Frontière de mot pour les alias courts | mapping |
| R5 | Une seule période — formes **plat / long / croisé / large / enseigne** | pivots + long + enseigne |
| R6 | Unité déclarée (k€/M€, devise) | échelle CA |
| R7 | Exclure les agrégats **par le calcul** (≈ somme des autres) | boucle produits |
| R8 | Colonne/champ manquant **signalé** | avertissements |
| R9 | PDL sur le **linéaire développé** (facings × largeur) | diagnostic |
| R10 | **Productivité** par facing, pas le CA brut | diagnostic |
| R11 | **Plancher anti-rupture** par la rotation | diagnostic |
| R12 | **Promo** exclue (vue complète, jamais promo seule) | pivot croisé |

---

## Formats de fichier gérés (état réel)

| Format | Exemple | Statut |
|---|---|---|
| Plat (un produit/ligne) | exports simples FR/EN | Lu |
| Long (période en colonne) | NielsenIQ, Male Hair NH | Lu (une période de référence) |
| Croisé (mesure + périodes en colonnes) | Circana « Geographies » (un fichier = une enseigne) | Lu (niveau marque, CAM, promo exclue) |
| « Answers » large (période au-dessus de mesures nommées) | NielsenIQ JFM/Vagisil (DrugFood, ASW) | Lu (multi-enseigne + multi-catégorie) |

---

## Jeux de test (mémoire du robot)

- Exercices de la formation : EX01 (double-compte), EX02 (VMH), EX03 (YA), EX09 (PDL développée),
  EX10 (circularité CA/facing), EX11 (rotation/rupture) — attendus recalculés, servent de non-régression.
- Corpus synthétique + fichiers réels ; `scripts/train-parser.mjs` (mapping) et
  `scripts/test-linear-diagnostic.mjs` (R9/R10/R11) doivent rester verts.
- Méthode : chaque piège devient d'abord un **test qui échoue**, puis on corrige (« le test est la mémoire »).

---

## ⚠️ LIMITES CONNUES / À FIABILISER (pour l'audit)

C'est ici que l'analyse « sort encore faux ». Points à challenger en priorité :

1. **L'allocation n'intègre pas R9/R10/R11.** Le plan (`allocateFacings`) répartit au **poids brut**
   (CA/volume/marge). La productivité (R10), le linéaire développé (R9) et le plancher rotation (R11)
   sont calculés **à part, en diagnostic**, mais **ne pilotent pas** l'allocation. → Le plan proposé
   peut sur/sous-facer par rapport à son propre diagnostic. **À réconcilier.**

2. **Enseigne par défaut = la première réelle.** Si le fichier commence par une enseigne minuscule,
   le plan est quasi vide (bug observé sur NH : « un seul visuel »). → Choisir par défaut une enseigne
   **significative** (le total, ou la plus grosse).

3. **Niveau lu variable.** Selon le fichier, le niveau retenu est marque, type de produit ou SKU.
   Le « plan de masse **au type de produit** » (moulu/grain/capsules ; barbe/cheveux) n'est pas
   systématique — dépend de la présence d'un segment/usage exploitable.

4. **R9/R11 dépendent de colonnes de relevé** (largeur, rotation, capacité, réappro) **absentes des
   panels** → souvent en diagnostic seulement, pas dans le plan. Il manque une source de **largeurs**
   (bibliothèque de packs / relevé photo) pour que R9 pilote vraiment.

5. **Détection des familles/usages** (Barbe/Cheveux, naturalité…) : heuristique côté prototype, à
   fiabiliser sur données réelles.

6. **Coefficient de pointe (R11)** : paramètre par catégorie/enseigne, aujourd'hui défaut = 1 — à calibrer.

7. **Pas de contrôle de conformité photo** (façon Pensa) : la reconstruction du plan **actuel** depuis
   une photo du rayon n'existe pas encore — ce serait la source directe de facings + largeurs réels.

---

*Fin de l'extraction. Tout est traçable dans le code cité en tête.*
