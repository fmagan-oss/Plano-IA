# Formation — robot de planogramme : comment lire, analyser, puis allouer du linéaire

*Destinataire : la personne ou l'IA qui entraîne le robot CatPilot.*
*Remplace la version précédente, qui traitait la lecture de fichiers sans intégrer
l'objectif final. Tout est réorganisé autour de la vraie question : **combien de facings
pour quel produit, et pourquoi**.*

> **Lecture de « PDL »** : je le lis comme **Part De Linéaire**. Ancrage indépendant qui le
> confirme : ta raison n°10 parle d'« écart linéaire/CA ». Si tu voulais dire autre chose,
> corrige-moi — c'est une hypothèse structurante, donc elle se vérifie avant tout le reste.

---

# Partie 0 — Pourquoi l'objectif change tout

Le robot ne produit pas une analyse, il produit une **décision physique** : de l'espace
donné ou retiré. Ça déplace complètement le curseur du risque.

**Les erreurs ne sont pas symétriques :**

| Erreur | Coût | Visibilité |
|---|---|---|
| Produit **sur-linéarisé** | espace et stock immobilisés | visible : le stock dort |
| Produit **sous-linéarisé** | ruptures, ventes perdues | **invisible** |

Ce déséquilibre est le point le plus important de toute la formation.
**Une rupture ne laisse aucune trace dans un fichier sell-out.** On ne voit que ce qui a
été vendu, jamais ce qui aurait pu l'être. Un produit sous-facé apparaît donc comme un
produit qui vend peu — ce qui justifie de lui retirer encore du linéaire. **La donnée
confirme l'erreur au lieu de la révéler.**

C'est la raison pour laquelle un robot de planogramme ne peut pas se contenter de lire des
ventes : il doit raisonner en **productivité** et en **rotation**, pas en volume brut.

**La chaîne complète :**

```
fichier → lecture → identité des mesures → réconciliation → signaux → arbitrage → plan de masse
         └────── Partie 1 (méthode d'analyse) ──────┘  └── Partie 2 (rouages) ──┘
```

---

# Partie 1 — Ma méthode d'analyse, et sa conséquence sur le linéaire

Six étapes. Le robot fait aujourd'hui très bien l'étape 2a (reconnaître un intitulé). Le
reste est à construire.

### Étape 1 — Cadrer avant de toucher la donnée

*Quelle question, quel périmètre, quelle période, quelle définition ?*

**Conséquence planogramme :** le périmètre des ventes doit correspondre au périmètre du
rayon. Des ventes tous circuits appliquées au rayon d'une seule enseigne produisent un plan
faux **et crédible**. C'est l'erreur la plus coûteuse : elle ne se voit nulle part.

### Étape 2 — Établir l'IDENTITÉ de chaque colonne, pas son nom

Une colonne n'est utilisable que si ses **5 axes** sont connus : mesure · agrégation
(total ou moyenne ?) · temps (courant ou N-1 ?) · niveau hiérarchique · unité.

**Conséquence planogramme :** ici, l'identité ne sert plus seulement à éviter une erreur —
elle détermine **à quoi sert la colonne dans l'allocation** :

| Signature | Rôle dans le planogramme |
|---|---|
| valeur · total · courant | pondération **CA** |
| volume · total · courant | pondération **rotation** ; base du plancher anti-rupture |
| rotation · moyenne_par_magasin | **le signal le plus important** : vitesse d'écoulement réelle |
| marge · total | pondération **profit** |
| dénombrement (facings, linéaire) | l'implantation **actuelle** — point de départ, jamais objectif |
| part (PDM, PDL) | **diagnostic** d'écart, jamais une pondération directe |

La VMH / le RoS passent ainsi du statut de piège (« ne jamais sommer ») à celui de
**rouage central**. Le garde-fou reste, mais il s'accompagne d'un mode d'emploi.

### Étape 3 — Réconcilier avant d'interpréter

Σ SKU = marque · Σ marques = catégorie · Σ enseignes = total · Σ semaines = cumul ·
mesure N-1 = période correspondante · unités et devises cohérentes.

**Conséquence planogramme :** une ligne d'agrégat non détectée devient **un produit qui
reçoit des facings**. Dans l'EX01, la ligne `TOTAL MDD` est une marque fantôme qui prendrait
de l'espace à des vraies références, et fausse toutes les parts.

### Étape 4 — Adapter la lecture à la FORME du fichier

Trois formes (plat / croisé / long) — détail en Partie 3.

**Conséquence planogramme :** en format long, un produit compté N fois obtient N fois trop
de linéaire. C'est mécanique.

### Étape 5 — Distinguer ce qu'on observe de ce qu'on conclut

`effet ≈ variation observée − tendance de fond − facteurs confondants`

**Conséquence planogramme :** un pic promotionnel n'est **pas** une demande structurelle.
Allouer du linéaire permanent sur une performance promotionnelle, c'est figer une erreur
pour six mois. Toute base d'allocation doit être une période **hors promotion**, ou
corrigée.

### Étape 6 — Relire à la source, puis chercher à se contredire

Aucun chiffre ne voyage de mémoire. Et avant de conclure : *qu'est-ce qui rendrait ce plan
faux ?* Pour un planogramme, la première réponse est presque toujours :
**« parce que les ventes que je lis sont déjà le produit du linéaire actuel »** — voir 2.3.

---

# Partie 2 — Les rouages du planogramme

## 2.1 Les quatre signaux, et ce que chacun dit vraiment

| Signal | Ce qu'il mesure | Ce qu'il ignore |
|---|---|---|
| **CA** | contribution au chiffre d'affaires | les références à prix bas mais forte rotation |
| **Rotation** (UVC/mag/sem) | vitesse d'écoulement → **risque de rupture** | la valeur de ce qui s'écoule |
| **Marge** | contribution au profit | le rôle de trafic de certaines références |
| **PDL actuelle** | l'implantation existante | rien — c'est un **constat**, pas un objectif |

**Le piège le plus courant : ne piloter qu'au CA.** Une référence peu chère à forte rotation
sera systématiquement sous-facée et donc en rupture. Dans l'EX11, la référence en rupture
structurelle n'est **pas** celle qui a le plus gros CA.

## 2.2 PDM vs PDL — le diagnostic central

Le principe de part équitable : *une marque devrait occuper une part de linéaire proche de
sa part de marché*. L'écart `PDM − PDL` mesure la sur- ou sous-linéarisation.

**La règle non négociable : la PDL se calcule sur le LINÉAIRE DÉVELOPPÉ, jamais sur le
nombre de facings.** Deux produits de largeurs différentes n'occupent pas le même espace à
facings égaux.

L'EX09 le démontre — et le résultat **change de signe** :

| Marque | PDM | PDL (facings) | PDL (linéaire) | Écart facings | Écart linéaire |
|---|---|---|---|---|---|
| JUST FOR MEN | 50,0 % | 33,3 % | 30,0 % | +16,7 pt | **+20,0 pt** *(sous-linéaire)* |
| L'ORÉAL | 30,0 % | 27,8 % | 40,0 % | **+2,2 pt** ⚠️ | **−10,0 pt** ⚠️ |
| MDD | 10,0 % | 22,2 % | 18,0 % | −12,2 pt | −8,0 pt |
| BIGEN | 10,0 % | 16,7 % | 12,0 % | −6,7 pt | −2,0 pt |

Sur L'Oréal, la lecture en facings conclut **« sous-linéarisé »** et la lecture en linéaire
développé conclut **« sur-linéarisé »**. Deux recommandations opposées à partir du même
fichier, selon une décision technique invisible.

**Les limites de la part équitable** — à connaître, sinon on l'applique bêtement :
elle ignore la rotation (donc le risque de rupture), la marge, le rôle de trafic de
certaines références, les nouveautés sans historique, et les contraintes physiques. C'est
un **point de départ de discussion**, pas une règle d'allocation.

## 2.3 Le piège de la circularité — le point le plus important

**Les ventes que tu lis sont déjà le produit du linéaire actuel.** Un produit vend beaucoup
en partie *parce qu'il a beaucoup de facings*. Allouer proportionnellement au CA observé
**verrouille et amplifie l'implantation existante** : le gros grossit, le rationné reste
rationné. C'est une boucle de rétroaction, et elle est invisible.

**Le signal non biaisé est la PRODUCTIVITÉ : CA par facing, rotation par facing.**

L'EX10 (productivité moyenne du rayon : **10 714 €/facing**) :

| Référence | CA | Facings | CA/facing | vs moyenne | Diagnostic |
|---|---|---|---|---|---|
| BARBE CHÂTAIN FONCÉ | 120 000 € | 10 | 12 000 € | 1,12× | correct |
| **BARBE NOIR** | 60 000 € | **2** | **30 000 €** | **2,80×** | **rationné** |
| COLORATION BRUN | 80 000 € | 12 | 6 667 € | 0,62× | **sur-linéarisé** |
| COLORATION BLOND | 40 000 € | 4 | 10 000 € | 0,93× | correct |

Au CA brut, COLORATION BRUN (80 000 €) passe devant BARBE NOIR (60 000 €) : une allocation
naïve lui donnerait **plus** de facings. C'est exactement l'inverse de ce qu'il faut faire.

**Corollaire à retenir :** une référence à productivité très supérieure à la moyenne **et**
à faible nombre de facings est *rationnée par l'espace*. Son potentiel réel est **au-dessus**
de son CA observé — un CA plafonné par le linéaire, pas par la demande.

## 2.4 Le plancher physique : rotation, capacité, réapprovisionnement

Avant toute pondération, une contrainte : le rayon doit tenir entre deux réassorts.

```
facings_mini = arrondi_supérieur(
    (rotation_par_jour × jours_entre_réappro × coefficient_de_pointe) / capacité_par_facing
)
```

Ce n'est **pas un critère d'optimisation, c'est une contrainte** : on ne descend jamais en
dessous. Si le plancher est inatteignable dans l'espace disponible, la bonne décision est
le **déréférencement**, pas le sous-facing — un produit en rupture permanente dégrade
l'image du rayon sans générer de ventes.

L'EX11 :

| Référence | Rotation/sem | Stock rayon | Besoin | Verdict | Facings mini |
|---|---|---|---|---|---|
| BARBE CHÂTAIN FONCÉ | 42 | 24 | 12,0 | OK | 2 *(a 3)* |
| **BARBE NOIR** | **84** | **12** | **36,0** | **RUPTURE** | **6** *(a 2)* |
| COLORATION BRUN | 14 | 60 | 4,0 | sur-stocké | 1 *(a 12)* |

**Les deux exercices convergent** : BARBE NOIR est signalé rationné par la productivité
(2,80×) *et* en rupture structurelle par la rotation (6 facings nécessaires contre 2). Deux
méthodes indépendantes, même conclusion — c'est ce qu'on appelle une attribution solide.

⚠️ Le **coefficient de pointe** est un paramètre à calibrer par catégorie et par enseigne.
Ce n'est pas une constante universelle et il ne se transpose pas d'une catégorie à l'autre.
À traiter comme un ordre de grandeur **à valider**, jamais comme un fait.

## 2.5 Les rendements sont décroissants

Doubler les facings ne double pas les ventes. La réponse des ventes au linéaire est
**concave** : très forte du 1er au 2e facing, quasi nulle au-delà d'un seuil de visibilité.

Deux conséquences : l'allocation n'est **pas proportionnelle**, et elle **sature**. Un
produit ne doit pas absorber tout l'espace parce qu'il est le plus gros.

Le coefficient d'élasticité est, là encore, **un paramètre à calibrer** — pas une constante
à reprendre d'ailleurs.

## 2.6 Les contraintes de merchandising

Un plan mathématiquement optimal mais illisible en rayon est un mauvais plan : blocs marque,
blocs segment, échelle de prix, niveaux (la zone à hauteur des yeux ne vaut pas la zone
basse), continuité verticale ou horizontale, faisabilité physique (dimensions, poids,
profondeur).

⚠️ **Conséquence analytique** : comparer la productivité de deux produits placés à des
niveaux différents compare aussi deux emplacements. À signaler quand l'information de
niveau est disponible.

## 2.7 Les cas particuliers

- **Nouveautés** : aucun historique. Une allocation fondée sur les ventes leur donnerait
  zéro. Il faut une règle **prospective assumée et déclarée**, pas un calcul.
- **Périodes promotionnelles** : à exclure de la base d'allocation (voir 1.5).
- **Saisonnalité** : la période de référence doit être déclarée et cohérente avec la période
  d'implantation.
- **Référence conservée** : 1 facing minimum. En dessous, la question n'est plus le facing,
  c'est le référencement.

---

# Partie 3 — Le moteur de lecture : les trois formes

Le robot suppose aujourd'hui une forme au lieu de la **détecter**.

| Indice | Forme | Règle |
|---|---|---|
| 1 en-tête, 1 ligne = 1 produit | **à plat** | déjà maîtrisé |
| même mesure **répétée** sous plusieurs périodes | **croisé** | fusionner les 2 lignes d'en-tête |
| une **colonne** contient des libellés de période | **long** | filtrage de période obligatoire |
| lignes indentées / colonne « niveau » | **hiérarchique** | un seul niveau |
| colonne « Mesure » = *CA*, *Volume*… | **dépivoté** | pivoter avant lecture |

**Croisé (type Circana)** — propager le libellé de période vers la droite (ligne du haut
creuse) · résoudre par couple (période, mesure) · ne jamais additionner deux périodes ·
un seul niveau de hiérarchie. *EX06 : sommer tous les niveaux donne 3,0× le vrai ; en
sommant aussi deux périodes, 5,9×.*

**Long (type NielsenIQ)** — aucune agrégation sans période résolue · ne jamais mélanger une
ligne hebdo et une ligne de cumul (YTD/CAM/MAT), le cumul contient déjà l'hebdo.
*EX05 : 2 627 775 € en sommant tout, contre 2 372 875 € sur le cumul et 62 900 € sur une
semaine. Trois nombres plausibles, un seul juste.*

**Dépivoté** — pivoter d'abord, le dictionnaire s'applique ensuite aux valeurs de la
colonne « Mesure ».

---

# Partie 4 — Fiches par source

⚠️ **Hypothèses de départ, à re-prouver par un test.** Un export change de format entre deux
extractions : j'ai déjà rencontré **deux fichiers du même export avec un ordre de colonnes
différent**.

**NielsenIQ Benelux** *(vérifié sur une extraction de juillet 2026)* — deux panels séparés,
donc deux fichiers ; leur total s'est révélé **additif**, contrairement à l'hypothèse
initiale, et cette erreur a failli **doubler une taille de marché** · en-tête sur deux
lignes, période **creuse** · les lignes marque ont un code produit **vide**, les lignes SKU
non · **l'ordre des colonnes diffère entre les deux fichiers** · hebdo, cumul et 12 mois
glissants coexistent dans la même feuille · distribution et rotation **uniquement** sur les
lignes magasins · `openpyxl` échoue, utiliser **`python-calamine`**.

**Circana France** *(à re-vérifier)* — une feuille est un agrégat **identique dans tous les
fichiers géographiques**, une autre est la source hebdo géo-spécifique ; les confondre
détruit silencieusement toute ventilation. *Test : hasher la feuille sur plusieurs fichiers.*

**Nordics / Bräuner** *(à re-vérifier)* — blocs d'années **en colonnes** ; résoudre par
lecture de l'en-tête d'année, jamais par décalage fixe.

---

# Partie 5 — Programme d'exercices (11 fichiers)

Chaque classeur imite un vrai export et contient un piège planté. Corrigé avec valeurs
exactes dans `CORRIGE_EXERCICES.md`.

| # | Piège | Enseigne | Impact planogramme |
|---|---|---|---|
| **EX01** | agrégats `TOTAL MDD` + `TOTAL CATEGORIE` | détecter un agrégat par le **calcul** | une marque fantôme prend des facings |
| **EX02** | `VMH` à côté de `CA` | ne jamais sommer une moyenne | pondération absurde |
| **EX03** | `Sales Value YA` adjacente | préférer l'année courante | allocation sur l'an dernier |
| **EX04** | colonnes permutées | **position ≠ identité** | toute la lecture décalée |
| **EX05** | format long + ligne de cumul | filtrage de période obligatoire | produit compté N fois → N fois trop de linéaire |
| **EX06** | en-tête 2 niveaux + hiérarchie | lire un rapport croisé | parts fausses d'un facteur 3 à 6 |
| **EX07** | k€ + GBP + colis | normaliser unités et devises | prix et plancher faux |
| **EX08** | les 5 familles d'erreur | mesurer un impact proprement | allocation sur un pic promo |
| **EX09** | facings vs linéaire développé | **PDL sur le linéaire** | conclusion qui **change de signe** |
| **EX10** | CA brut vs CA/facing | **circularité** | verrouille l'implantation existante |
| **EX11** | rotation vs CA | **plancher anti-rupture** | rupture structurelle non détectée |

**Déroulé :** le robot produit sa lecture sans le corrigé → on compare → chaque écart devient
un test → le fichier rejoint le corpus de non-régression et tourne chaque nuit.

**Le critère de réussite n'est pas « il trouve le bon chiffre ».** C'est **qu'il refuse de
produire un plan quand il ne peut pas le produire proprement**, et qu'il dise pourquoi.

---

# Partie 6 — Ce que le robot doit refuser ou signaler (spécifique planogramme)

| Situation | Conséquence | Comportement attendu |
|---|---|---|
| Ni rotation ni volume | plancher anti-rupture incalculable | produire, mais **signaler** que le plan est pondéré valeur et peut créer des ruptures sur les références bon marché à forte rotation |
| Pas de facings actuels | PDL et productivité incalculables | seul un plan en part équitable est possible : le dire, et **ne pas** le présenter comme un diagnostic de sur/sous-linéaire |
| Pas de largeurs | PDL seulement en facings | **signaler que la conclusion peut s'inverser** (EX09) |
| Période contenant une promo | demande surestimée | signaler et proposer une base hors promo |
| Périmètre ventes ≠ périmètre rayon | plan faux et crédible | **refuser** tant que ce n'est pas aligné |

---

# Partie 7 — Ce que ça ferme dans ton fichier de refus

Déjà géré chez toi, je n'y touche pas : n°14, 15, 18, 19, 22, 23, 26, 27, 28, 29.

| Raison | État actuel | Apport |
|---|---|---|
| **n°4** — rapport croisé | refus | règles Partie 3 + EX06 |
| **n°9/10/11** — pas de CA / volume | avertissement | Partie 6 : conséquence **explicitée** (risque de rupture), pas juste « moins fiable » |
| **n°16** — périodes différentes | volume ignoré | R5 : période résolue obligatoire |
| **n°17** — intitulé absent | non reconnu | dictionnaire (34 champs, 459 alias) + R8 |
| **n°20** — colonne YA | **risque de capter YA** | R1 + EX03/EX04 |
| **n°21** — marque vs fabricant | « première trouvée » | R2 : deux champs distincts |
| **n°24** — mesure dépivotée | non lisible | Partie 3 (pivoter d'abord) |
| **n°25** — format long | comptage ×N | R5 + EX05 |

**Nouveau, absent de ta liste** : R9 (PDL sur le linéaire), R10 (circularité), R11 (plancher
anti-rupture), R12 (période promo exclue) — les quatre rouages proprement planogramme.

---

# Partie 8 — Ancrer durablement : contrats + tests

Une consigne écrite est du **contexte** ; un test est une **contrainte**. Un robot dérive
d'une règle en prose, jamais d'un test qui fait échouer un traitement.

1. **Consignes** (`CLAUDE.md`, `.claude/rules/`) — courtes, chargées à chaque session
2. **Contrats de source** (`contracts/*.yml`) — structure vérifiée, régénérée par inspection,
   **revalidée à chaque exécution** ; si le fichier dérive, le traitement échoue bruyamment
3. **Tests de régression** (`tests/`) — la vraie mémoire
4. **Registre d'échecs** (`FAILURES.md`) — une ligne par erreur + l'ID de son test

**La boucle à cliquet :** reproduire l'erreur en test qui échoue → corriger → journaliser →
ajouter la règle la plus courte qui l'aurait évitée. **Jamais de correction silencieuse.**

---

## En une phrase

Ton robot sait **reconnaître des mots**. Pour faire un bon planogramme, il lui faut trois
choses de plus : **connaître l'identité de ce qu'il lit**, **raisonner en productivité et en
rotation plutôt qu'en ventes brutes** — parce que les ventes qu'il lit sont déjà le produit
du linéaire actuel — et **savoir dire non**.
