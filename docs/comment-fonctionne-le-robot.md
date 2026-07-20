# Comment fonctionne le robot de CatPilot — expliqué à un débutant

*But de ce document : que la personne (ou l'IA) qui va m'entraîner comprenne
comment le robot marche, et sache donc quelles infos me donner pour l'améliorer.*

---

## 1. L'idée en une phrase

Tu déposes un fichier de ventes (Excel ou CSV). Le robot doit **comprendre tes
colonnes** — laquelle est la marque, laquelle est le chiffre d'affaires, etc. —
puis il en fait un **plan de masse** (la répartition du rayon par marque). Tout
le « cerveau » du robot, c'est cette étape de compréhension des colonnes.

## 2. Ce que le robot N'EST PAS

Ce n'est pas une IA magique qui « devine » n'importe quel fichier. Pour lire les
colonnes, c'est un **dictionnaire de synonymes**, comme un lexique bilingue.

Il a une liste de mots pour chaque information. Exemple pour le chiffre
d'affaires : `CA`, `Chiffre d'affaires`, `Ventes Valeur`, `Sales Value`,
`Montant`, `Sell-out`… Quand il voit une colonne qui s'appelle « CA HT », il la
range dans le tiroir « chiffre d'affaires ». C'est **prévisible** : mêmes mots =
même résultat, à chaque fois. (Il existe en secours une petite IA qui propose un
rangement quand le dictionnaire ne reconnaît rien — mais le cœur, c'est le
dictionnaire.)

**Image simple :** le robot est un documentaliste. Tu lui donnes un tableau, il
range chaque colonne dans le bon tiroir étiqueté. Il ne « comprend » pas le
métier — il reconnaît des mots qu'on lui a appris.

## 3. Comment il lit un fichier, étape par étape

1. **Il ouvre le classeur et choisit la bonne feuille.** S'il y a une page de
   garde (« Sommaire »), il prend la feuille qui ressemble le plus à un vrai
   tableau de données.
2. **Il trouve la ligne des titres** — la première ligne qui contient au moins
   deux intitulés. Ça lui permet de sauter un bloc de titre en haut
   (ex. « Table-1 », « Revenir au rapport »).
3. **Il nettoie les titres avant de comparer** : enlève les accents, la casse,
   les apostrophes courbes, les parenthèses. Donc « Ventes (€) » = « ventes € ».
4. **Pour chaque tiroir, il cherche un mot du dictionnaire** dans les titres.
   D'abord une correspondance exacte, sinon un bout de mot.
5. **Il évite les pièges** : les colonnes de parts de marché / distribution
   (PDM, %, DN, DV, VMH…) ne sont jamais prises pour des ventes ; un mot court
   comme « CA » ne se déclenche pas à l'intérieur de « Catégorie ».
6. **Il lit les lignes produit** : nettoie les nombres (espaces, milliers),
   **ignore les lignes de total** (« TOTAL CATÉGORIE » est déjà la somme), et
   saute les lignes vides.
7. **Si trop de choses manquent, il refuse** — et explique pourquoi — plutôt que
   de sortir un plan de masse faux qui aurait l'air correct.

## 4. Les 9 « tiroirs » qu'il cherche

Marque · EAN (code-barres) · Libellé produit · Segment · Chiffre d'affaires ·
Volume · Marge · Prix · Nouveauté.

**Le minimum vital** pour produire un plan de masse : une **marque** (ou un
EAN), et **au moins une mesure de vente** (CA ou volume). Le reste améliore la
finesse mais n'est pas bloquant.

## 5. Comment on l'entraîne (les leviers)

- **Le dictionnaire** (`column-aliases.json`) — le levier principal. Ajouter un
  synonyme = lui apprendre un nouvel intitulé. Attention : un synonyme trop
  vague créerait des faux positifs (ex. apprendre « valeur » tout court
  attraperait « valeur nutritionnelle »).
- **La boîte de dépôt** (`training-inbox/`) + un **corpus** de fichiers
  d'exemple : il les teste chaque nuit.
- **Les attendus** (`expect/`) : on lui dit « sur CE fichier, la bonne colonne
  CA est *celle-ci* ». Il vérifie qu'il ne se trompe pas de colonne — pas
  seulement qu'il en trouve une.
- **Le bouton « Signaler une mauvaise lecture »** sur le site : envoie les
  titres + 3 lignes d'exemple pour que je les revoie la nuit.
- **La session de nuit** : chaque nuit il teste tout, et j'ajoute les synonymes
  manquants — sans jamais inventer une donnée absente.

## 6. Ce qu'il sait faire aujourd'hui — et ses limites

**Il sait lire** les tableaux « à plat » : **une ligne = un produit**, avec les
colonnes en titre. En français comme en anglais, avec abréviations, en-têtes
décalés, pages de garde, séparateurs de milliers, etc.

**Il ne sait pas encore lire** deux formats de panel :
- **Le rapport « croisé »** (ex. Circana HYPERS) : la mesure est rangée *en
  colonne*, les périodes et les enseignes sont *en colonnes*, les produits
  forment une hiérarchie avec des totaux.
- **Le format « long »** (ex. NielsenIQ) : **une ligne par produit ET par
  période** (40 périodes empilées). Sans choisir une période, un produit serait
  compté 40 fois.

C'est le prochain chantier : un « moteur de lecture de rapport ».

## 7. Ce dont j'ai besoin de toi (trainer) pour progresser

Le point le plus important. Pour chaque **type de fichier** que tu veux me faire
lire, donne-moi :

1. **Un exemple réel** (ou sa structure) : où est la ligne des titres, à quoi
   ressemblent les colonnes.
2. **L'identité de chaque colonne** — le point clé. Pas juste son nom, mais ce
   qu'elle *représente vraiment* :
   - Est-ce le **CA total**, ou une **moyenne par magasin** (VMH), ou une
     **part de marché** ?
   - Est-ce l'**année en cours** ou l'**année précédente** (colonnes « YA » /
     « N-1 ») ?
   - « Marque » ou « Fabricant » ? (Schwarzkopf vs Henkel)
3. **Quelle mesure = le CA**, et laquelle = le **volume**, pour ce rapport.
4. **Où sont les périodes** (en colonnes ? en lignes ?) et **laquelle est la
   référence** (la plus récente ? un cumul annuel ?).
5. **Où sont les enseignes / géographies**, et **laquelle** sert de périmètre.
6. **Quelles lignes ignorer** : totaux, sous-totaux, niveaux de hiérarchie.
7. **La règle de calcul attendue** : comment agréger, quoi faire si une période
   est incomplète.
8. **Les pièges connus** de ce fournisseur (colonnes doublons, unités, devises).

Avec ça, je n'ai rien à deviner : je construis la lecture juste, et je la
vérifie avec un attendu (point 5.3) pour être sûr de ne pas me tromper de
colonne.

---

*En un mot : le robot reconnaît des mots et suit des règles. Plus tu me décris
précisément **ce que chaque colonne veut dire** et **comment tu veux qu'on la
traite**, plus il lit juste — et jamais il n'invente une donnée qu'il n'a pas.*
