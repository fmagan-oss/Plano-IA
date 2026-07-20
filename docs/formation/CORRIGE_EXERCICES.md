# Corrigé des exercices

*Toutes les valeurs ci-dessous ont été recalculées depuis les fichiers générés, jamais
saisies de mémoire. Elles servent d'**attendus** (`expect/`) pour la non-régression.*

**Comment s'en servir :** faire produire au robot sa lecture **sans ce corrigé**, puis
comparer. Chaque écart devient un test permanent.

---

## EX01 — `EX01_double_compte.xlsx`

**Le piège.** Le tableau contient **deux** niveaux d'agrégat, dont un qui ne dit pas son
nom : `TOTAL MDD` (25 000 €) est la somme de `MDD CARREFOUR` (18 000) et `MDD AUCHAN`
(7 000), tous deux également présents. Et `TOTAL CATEGORIE` agrège les six vraies marques.

| Lecture | Résultat |
|---|---|
| ❌ Somme de toutes les lignes | **4 861 636 €** |
| ✅ Somme des vraies marques | **2 418 318 €** |
| ✅ Ligne `TOTAL CATEGORIE` | **2 418 318 €** *(réconcilie exactement)* |
| **Ratio de l'erreur** | **2,01×** |

**Attendu :** CA catégorie = **2 418 318 €**, 6 marques retenues, 2 lignes exclues.

**Ce qu'il faut apprendre.** Un ratio proche de **2,00×** entre la somme des lignes et la
ligne total est la signature d'un double comptage. Filtrer sur le mot « TOTAL » ne suffit
pas : un sous-total peut s'appeler « Ensemble », « Autres », ou porter un nom de marque
ombrelle. **Détecter par le calcul :** une ligne dont la valeur ≈ la somme de ses sœurs
*est* un agrégat, quel que soit son libellé.

---

## EX02 — `EX02_VMH_vs_CA.xlsx`

**Le piège.** La colonne `VMH (€/mag/sem)` contient le mot-clé « ventes/CA » dans son sens
métier et se fait capter comme chiffre d'affaires. C'est une **moyenne hebdomadaire par
magasin**.

| Lecture | Résultat |
|---|---|
| ❌ Somme de la colonne VMH | **107,5** *(un « CA » de 107 €)* |
| ✅ Somme de la colonne CA | **2 393 318 €** |
| ✅ Contrôle : Σ (VMH × nb magasins × nb semaines) | **2 394 150 €** *(écart +0,0 %)* |

**Attendu :** CA total = **2 393 318 €**. La VMH n'est jamais sommée.

**Ce qu'il faut apprendre.** Le drapeau `sommable: false` doit être porté par la
**signature**, pas déduit du nom. Toute colonne dont l'agrégation est une moyenne, un
indice ou une part est non sommable : VMH, VMM, RoS, prix moyen, DN, DV, PDM, indice.
Pour remonter à un total depuis une VMH il faut **deux autres colonnes** (nb magasins,
nb semaines) — et si elles manquent, on ne peut pas, point.

---

## EX03 — `EX03_annee_precedente.xlsx`

**Le piège.** `Sales Value` et `Sales Value YA` sont adjacentes. Un dictionnaire qui
reconnaît « Sales Value » capture aussi « Sales Value YA » — et prend souvent la première
ou la dernière trouvée.

| Lecture | Résultat |
|---|---|
| ✅ CA année courante | **2 393 318 €** |
| ❌ Si `YA` capté par erreur | **2 279 998 €** |
| **Écart** | **−4,7 %** |
| ✅ Croissance JFM | **+6,73 %** |

**Attendu :** CA = **2 393 318 €**, CA N-1 = **2 279 998 €** dans un **champ séparé**,
croissance JFM = **+6,73 %**.

**Ce qu'il faut apprendre.** C'est le pire type d'erreur : **−4,7 %**, assez petit pour ne
jamais déclencher d'alerte, assez grand pour fausser une décision. Règle R1 : si deux
colonnes ne diffèrent que par un marqueur d'année précédente (**YA, YAG, LY, PY, N-1,
A-1, VJ**), la période courante gagne, et l'autre est conservée séparément — jamais
écartée, jamais confondue.

---

## EX04 — `EX04_colonnes_permutees.xlsx`

**Le piège.** Exactement les mêmes données qu'EX03, mais : colonnes réordonnées, une
colonne vide insérée, et un bloc de titre de 3 lignes au-dessus de l'en-tête.

| Contrôle | Résultat |
|---|---|
| ✅ CA année courante | **2 393 318 €** |
| ✅ Identique à EX03 ? | **oui** |

**Attendu : résultat rigoureusement identique à EX03.** Tout écart signifie qu'un index de
colonne est codé en dur quelque part.

**Ce qu'il faut apprendre.** **Position ≠ identité.** C'est la règle la plus importante du
lot, parce qu'elle est la cause racine de l'erreur la plus coûteuse que j'aie commise :
j'ai lu des semaines de campagne média d'après la **position des colonnes** d'un plan, et
décalé toute une analyse de deux semaines. Tout entier codé en dur pour désigner une
colonne est un bug en attente. À faire tourner en test automatique : permuter les colonnes
d'un fichier et exiger un résultat **identique**.

---

## EX05 — `EX05_format_long.xlsx`

**Le piège.** Une ligne par **produit × période** (4 semaines), **plus** une ligne de
cumul `YTD 2026` pour chaque produit. Sans filtre, tout se somme.

| Lecture | Résultat |
|---|---|
| ❌ Somme de toute la colonne | **2 627 775 €** |
| ✅ Filtre `YTD 2026` | **2 372 875 €** |
| ✅ Filtre `W24` | **62 900 €** |
| ✅ Somme W21→W24 | **254 900 €** |

**Attendu :** le robot **refuse d'agréger** tant qu'une période n'est pas choisie, puis
donne le chiffre correspondant à la période demandée.

**Ce qu'il faut apprendre.** Deux double-comptages différents cohabitent :
1. **produit × période** — un produit compté N fois ;
2. **temporel** — une ligne de cumul (YTD / CAM / MAT) additionnée à des lignes hebdo,
   alors que le cumul **contient déjà** ces semaines.

Le second est invisible à l'œil : les trois nombres ci-dessus sont tous plausibles. Seule
la question posée détermine lequel est juste. D'où la règle : **aucune agrégation sans
période résolue**, et jamais de mélange entre granularités temporelles.

---

## EX06 — `EX06_format_croise.xlsx`

**Le piège.** En-tête sur **deux lignes** (ligne 3 = périodes, **creuse** ; ligne 4 =
mesures), et lignes produits **hiérarchisées** avec sous-totaux (colonne `Niveau` 1/2/3).

| Lecture | Résultat |
|---|---|
| ❌ Toutes les lignes sommées (une période) | **1 500 000 €** — soit **3,0×** |
| ❌ Toutes les lignes, P5 **+** P6 | **3 060 000 €** — soit **5,9×** |
| ✅ Niveau 3 uniquement, P5 | **500 000 €** = ligne TOTAL P5 ✔ |
| ✅ Niveau 3 uniquement, P6 | **520 000 €** = ligne TOTAL P6 ✔ |

**Attendu :** P6 au niveau marque = **520 000 €**, réconcilié à la ligne `TOTAL CATEGORIE`.

**Ce qu'il faut apprendre.** Quatre gestes, dans l'ordre :
1. **propager le libellé de période vers la droite** (la ligne du haut est creuse) ;
2. résoudre chaque colonne par le **couple (période, mesure)** ;
3. **ne jamais additionner deux périodes** ;
4. **ne garder qu'un seul niveau de hiérarchie**.

Le contrôle qui sauve : au niveau le plus fin, Σ doit égaler la ligne TOTAL **exactement**.
Ici c'est vérifié aux deux périodes — donc la lecture est prouvée, pas supposée.

---

## EX07 — `EX07_unites_devises.xlsx`

**Le piège.** `CA (k€)`, `CA UK (GBP)`, `Volume (UVC)` et `Volume (colis)` cohabitent.
Un colis = 12 UVC.

| Lecture | Résultat |
|---|---|
| ✅ CA en EUR (k€ × 1000) | **2 384 364 €** |
| ❌ Si k€ et GBP sommés tels quels | **1 951 784** *(ni euros ni livres)* |
| ✅ Prix JFM via UVC | **12,44 €** |
| ❌ Prix JFM via colis | **149,34 €** — faux d'un facteur **12** |

**Attendu :** CA = **2 384 364 €**, prix JFM = **12,44 €**.

**Ce qu'il faut apprendre.** L'unité est déclarée **dans l'intitulé**, entre parenthèses —
c'est une information de signature, pas de décoration. Une somme k€ + € passe sans erreur
visible et se trompe d'un facteur 1000. Un prix calculé avec le mauvais dénominateur de
volume se trompe du facteur de colisage. Aucun des deux ne déclenche d'alerte : seule la
vérification d'unité les attrape.

*Note liée :* chez NielsenIQ, les « units » peuvent compter les articles **à l'intérieur**
d'un lot. Le prix moyen devient alors sensible aux multipacks : il doit être commenté
comme un **effet de mix**, pas comme un mouvement de tarif.

---

## EX08 — `EX08_mesure_impact.xlsx` — l'exercice central

**Le contexte.** Une campagne média digitale a tourné sur le segment **Barbe uniquement**.
Le segment **Coloration** n'a reçu aucun média : c'est un **groupe de contrôle naturel**.
Question posée : *quel est l'effet du média ?*

Ce fichier contient **quatre pièges simultanés** — ce sont exactement les erreurs que j'ai
commises.

### Piège 1 — La fenêtre média (position ≠ identité)

L'onglet `Plan media` affiche des colonnes hebdomadaires plaçant le budget en **S19, S20 et
S23**. Le bloc de facturation en dessous donne les vraies dates : **18/05→31/05** et
**01/06→14/06**.

En calendrier ISO 2026, ces dates correspondent aux semaines **W21 à W24**.
→ **La bonne fenêtre est W21-W24.** Les colonnes hebdo sont un artefact de présentation.

**La leçon :** un paramètre structurant ne se lit jamais sur la position d'une colonne. Il
se recale sur un **ancrage indépendant** — ici, les dates de facturation. C'est
littéralement mon erreur, reproduite : j'avais retenu S19/S20/S23.

### Piège 2 — Le périmètre

| Mesure sur les semaines propres | Résultat |
|---|---|
| ❌ Sur le **total** (Barbe + Coloration) | **+18,2 %** |
| ✅ Sur le **segment traité** (Barbe) | **+60,0 %** |

Mesurer sur l'agrégat **dilue l'effet par trois**. Le média n'a touché que la barbe : la
mesure ne porte que sur la barbe.

### Piège 3 — Les semaines polluées par la promo

| Semaine | Promo 2026 | Promo 2025 | Verdict |
|---|---|---|---|
| W21 | 88 % | 7 % | ❌ **polluée** |
| W22 | 2 % | 4 % | ✅ propre |
| W23 | 7 % | 10 % | ✅ propre |
| W24 | 87 % | 7 % | ❌ **polluée** |

Sur la fenêtre entière, la croissance brute est de **+73,8 %** — un chiffre spectaculaire
et faux : il est porté par la promo, pas par le média. **Seules W22 et W23 sont
exploitables** pour attribuer un effet.

### Piège 4 — La tendance de fond

| Étape | Barbe | Coloration *(contrôle)* |
|---|---|---|
| Tendance avant campagne (W17-W20) | **+31,0 %** | **−4,0 %** |
| Semaines propres (W22-W23) | **+60,0 %** | **−4,0 %** |
| **Accélération vs sa propre tendance** | **+29,0 pt** | **+0,0 pt** |

La barbe montait **déjà** de +31 % sans média. Présenter **+60 %** comme l'effet média,
c'est lui attribuer la croissance organique de la marque.

### La réponse correcte

| Élément | Valeur |
|---|---|
| Périmètre traité | **Barbe** (pas le total) |
| Fenêtre | **W21-W24** (via les dates de facturation) |
| Semaines exploitables | **W22-W23** |
| Croissance brute fenêtre | +73,8 % *(à ne pas utiliser)* |
| Croissance semaines propres | +60,0 % |
| Tendance de fond à retirer | +31,0 % |
| **Effet média net** | **+29,0 pt** *(soit **+22,1 %** de volume au-dessus du contrefactuel)* |
| **Contrôle** | Coloration **+0,0 pt** → attribution confirmée |
| **Différence de différences** | **+29,0 pt** |
| Contrefactuel W22-W23 | 71 413 € |
| Réel W22-W23 | 87 222 € |
| **Chiffre d'affaires incrémental** | **+15 809 €** |

### Ce qu'il faut apprendre

Une variation observée n'est pas un effet :

```
effet ≈ variation observée − tendance de fond − facteurs confondants
```

et le résultat doit être **confirmé par un groupe de contrôle**. Ici le contrôle ne bouge
pas (+0,0 pt) alors que le traité décolle (+29,0 pt) : l'attribution est solide. Si le
contrôle avait bougé lui aussi, la bonne réponse aurait été **« cette lecture n'est pas
fiable »** — et ça reste une réponse acceptable.

---

---

## EX09 — `EX09_PDM_vs_PDL.xlsx` — facings ou linéaire développé ?

**Le piège.** La part de linéaire semble se calculer sur le nombre de facings. C'est faux :
les produits n'ont pas la même largeur. Il faut le **linéaire développé** = facings ×
largeur.

Rayon : CA total **500 000 €**, **36 facings**, **200 cm** de linéaire développé.

| Marque | PDM | PDL (facings) | PDL (linéaire) | Écart facings | Écart linéaire |
|---|---|---|---|---|---|
| JUST FOR MEN | 50,0 % | 33,3 % | 30,0 % | +16,7 pt | **+20,0 pt** |
| L'ORÉAL | 30,0 % | 27,8 % | 40,0 % | **+2,2 pt** | **−10,0 pt** |
| MDD | 10,0 % | 22,2 % | 18,0 % | −12,2 pt | −8,0 pt |
| BIGEN | 10,0 % | 16,7 % | 12,0 % | −6,7 pt | −2,0 pt |

**Attendu :** JUST FOR MEN est **sous-linéarisé de 20,0 pt**, L'ORÉAL est **sur-linéarisé de
10,0 pt**. Une ligne `TOTAL RAYON` est présente et doit être exclue.

**Ce qu'il faut apprendre.** Sur L'ORÉAL, la conclusion **change de signe** selon la
métrique : « sous-linéarisé de 2,2 pt » en facings, « sur-linéarisé de 10,0 pt » en linéaire
développé. Deux recommandations opposées, à partir du même fichier, à cause d'une décision
technique invisible. **La PDL se calcule toujours sur le linéaire développé** (règle R9).
Si les largeurs sont absentes du fichier, le robot doit le signaler et prévenir que la
conclusion peut s'inverser.

---

## EX10 — `EX10_circularite_CA_facing.xlsx` — le CA reflète déjà le linéaire

**Le piège.** Allouer proportionnellement au CA observé paraît naturel. Mais le CA observé
est **déjà le produit de l'implantation actuelle** : un produit vend beaucoup en partie
parce qu'il a beaucoup de facings.

Rayon : CA **300 000 €**, **28 facings**, productivité moyenne **10 714 €/facing**.

| Référence | CA | Facings | CA/facing | vs moyenne | Alloc. naïve au CA |
|---|---|---|---|---|---|
| BARBE CHÂTAIN FONCÉ | 120 000 € | 10 | 12 000 € | 1,12× | 11,2 |
| **BARBE NOIR** | 60 000 € | **2** | **30 000 €** | **2,80×** | 5,6 |
| COLORATION BRUN | 80 000 € | 12 | 6 667 € | 0,62× | 7,5 |
| COLORATION BLOND | 40 000 € | 4 | 10 000 € | 0,93× | 3,7 |

**Attendu :** **BARBE NOIR est rationné** (productivité 2,80× la moyenne avec seulement
2 facings). **COLORATION BRUN est sur-linéarisé** (0,62× avec 12 facings).

**Ce qu'il faut apprendre.** Au CA brut, COLORATION BRUN (80 000 €) passe **devant** BARBE
NOIR (60 000 €) : une allocation naïve lui donnerait **plus** d'espace — exactement
l'inverse de ce qu'il faut faire. Le signal non biaisé est la **productivité par facing**,
pas la valeur brute (règle R10).

**Corollaire :** une référence à forte productivité **et** peu de facings est plafonnée par
l'espace, pas par la demande. Son potentiel réel est **au-dessus** de son CA observé — donc
même une allocation proportionnelle au CA la sous-sert encore.

---

## EX11 — `EX11_rotation_rupture.xlsx` — le plancher physique

**Le piège.** Piloter au CA seul. La rotation, pas le CA, fixe le nombre **minimum** de
facings.

```
facings_mini = arrondi_sup( (rotation/jour × jours_réappro × coef_pointe) / capacité_par_facing )
```

*(coefficient de pointe = 1 dans cet exercice ; c'est un paramètre à calibrer par catégorie
et enseigne, jamais une constante universelle.)*

| Référence | CA | Rot./sem | Facings | Stock rayon | Besoin | Verdict | **Mini** |
|---|---|---|---|---|---|---|---|
| BARBE CHÂTAIN FONCÉ | 120 000 € | 42 | 3 | 24 | 12,0 | OK | 2 |
| **BARBE NOIR** | 60 000 € | **84** | **2** | 12 | **36,0** | **RUPTURE** | **6** |
| COLORATION BRUN | 80 000 € | 14 | 6 | 60 | 4,0 | sur-stocké | 1 |

**Attendu :** **BARBE NOIR est en rupture structurelle** — il lui faut **6 facings** contre
2 aujourd'hui. COLORATION BRUN pourrait descendre à 1.

**Ce qu'il faut apprendre.** La référence en rupture n'est **pas** celle qui a le plus gros
CA. Un pilotage au CA seul l'aurait laissée en rupture permanente — et ses ventes bridées
auraient ensuite « justifié » de lui retirer encore du linéaire. C'est la boucle décrite en
EX10, vue depuis l'opérationnel.

**Le plancher est une contrainte, pas un critère** : on ne descend jamais en dessous. Si
l'espace disponible ne le permet pas, la bonne décision est le **déréférencement**, pas le
sous-facing.

### La convergence EX10 + EX11 — à faire remarquer au robot

Deux méthodes indépendantes désignent la même référence :

| Référence | Signal productivité (EX10) | Signal rotation (EX11) | Conclusion |
|---|---|---|---|
| **BARBE NOIR** | 2,80× la moyenne | 6 facings requis vs 2 | **sous-linéarisé, à renforcer** |
| **COLORATION BRUN** | 0,62× la moyenne | 1 facing suffit vs 12 | **sur-linéarisé, à réduire** |

Quand deux méthodes indépendantes convergent, l'attribution est solide. Quand elles
divergent, c'est une alerte : il faut le dire, pas trancher au hasard.

---

## Grille de notation

| Niveau | Critère |
|---|---|
| **Insuffisant** | produit un chiffre faux sans signaler de doute |
| **Passable** | trouve le bon chiffre sur EX01-EX04 |
| **Bon** | traite EX05-EX07, réconcilie Σ enfants = parent |
| **Solide** | sur EX06 et EX08, **refuse** et explique plutôt que de deviner |
| **Planogramme** | calcule la PDL sur le linéaire développé (EX09), raisonne en productivité et non en CA brut (EX10), applique le plancher anti-rupture avant toute pondération (EX11) |
| **Cible** | décompose spontanément un effet en brut / tendance / confondant / net, cite son groupe de contrôle, et signale quand deux méthodes divergent |

Le seuil de réussite n'est pas le bon chiffre. C'est **la capacité à dire « je ne peux pas
produire ce plan proprement, voici pourquoi »**.
