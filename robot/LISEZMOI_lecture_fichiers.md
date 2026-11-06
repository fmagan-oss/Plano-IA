# Robot — lecture de n'importe quel fichier panel (reconnaissance de colonnes)

> But : le robot comprend un export Nielsen/Circana **à partir des noms de colonnes**,
> quel que soit le pays, la langue ou la mise en page. Validé sur 4 vrais fichiers, 3 pays.

## Ce que les 4 fichiers de test nous ont appris

| Fichier | Pays / circuit | Mise en page | Langue | En-tête | Lisible en standard ? |
|---|---|---|---|---|---|
| F3 `DONNEES_COMBE_A_PLAT_P09` | France HM+SM | « à plat » (1 ligne = 1 produit) · 19 col. | FR | ligne 1 | oui |
| F1 `Watson` | Benelux (drogueries ASW) | large (facts en colonnes) · 164 col. | NL + EN | ligne 6 | **non** (styles.xml cassé) |
| F2 `Full_market` | Benelux (SM/Drug/autres) | large · 154 col. | NL + EN | ligne 6 | **non** |
| F4 `Male_Hair_Colour` | Nordics (pharmacie, ex. Apotek Hjärtat) | long (1 ligne = produit × période) · 18 col. | EN | ligne 5 | **non** |

Trois difficultés réelles, toutes gérées :
1. **L'en-tête n'est pas toujours en haut** (ligne 1, 5 ou 6 selon le fichier). → On repère la ligne qui contient le plus de **types de champs différents** (pas juste la plus remplie : une ligne de périodes répétées ne compte pas).
2. **Les noms changent de langue** (EAN/UPC, Marque/MERK/BRAND, Ventes Valeur/Sales Value, Produits/ITEM…). → Dictionnaire de synonymes FR/EN/NL.
3. **3 fichiers sur 4 ne s'ouvrent pas avec un lecteur Excel standard** (leur `styles.xml` généré par Nielsen est mal formé). → On lit le XML brut du fichier, ce qui ignore les styles. **Important** : le vrai robot doit utiliser cette lecture robuste, pas un lecteur strict.

## Dictionnaire de reconnaissance (synonymes → champ canonique)

| Champ | Synonymes reconnus (FR / EN / NL) |
|---|---|
| `ean` | EAN · UPC · GTIN · barcode · code-barres |
| `marque` | Marque Nom · BRAND · MERK |
| `fabricant` | Fabricant Nom · MANUFACTURER · fournisseur · supplier |
| `produit` | Produits · ITEM · désignation · libellé · product |
| `categorie` | Sous type Nom · CATEGORY (NDH) · GROEP · segment · group |
| `genre` | GENDER · genre · sexe |
| `marche` (enseigne/géo) | Geographies · Markets · enseigne · circuit · retailer |
| `periode` | Temps · Periods · CAM · MAT · YTD · Rolling · semaine · week |
| `ventes_valeur` | Ventes Valeur (Eur) · Sales Value · CA — *hors* YA/%Chg/Promo/YTD |
| `ventes_volume` | Ventes Unite · Sales Units · volume — *hors* YA/%Chg/Promo |
| `prix` | Prix Moyen Unite · Price per Sales Unit · average price |
| `dn` (distrib. numérique) | DN · Numeric Distribution |
| `dv` (distrib. pondérée) | DV · TDP Numeric Distribution · weighted distribution |
| `croissance` | % Chg · croissance · growth · évolution |
| `vmh` (ventes moy. hebdo) | VMH · ROS Value · rate of sale |
| `lineaire` | Linéaire… en mètres · linear · shelf · facings |

Règle importante : pour `ventes_valeur`/`ventes_volume`, on prend la colonne **de base**
(période courante, total), jamais une variante *YA* (année précédente), *% Chg*, *Promo* ou *YTD*.

## Nuances restantes (petites)
- **Benelux (F1/F2)** : la **période** est dans une ligne au-dessus de l'en-tête (« YTD 26 (wk 36 26) »),
  pas dans une colonne → à lire comme métadonnée de la table. Et il **n'y a pas de libellé produit**
  (le produit est identifié par l'EAN seul) — normal pour cet export.
- **« À plat » (F3)** : le fichier mélange des lignes **agrégées** (ex. « COLORATION HOMME » = total)
  et des lignes **produit**. On ne garde que les lignes avec un EAN valide → anti-double-compte
  (règle EX13).

## Branché dans le robot de la démo (fait)

Le reconnaisseur est maintenant **dans le vrai lecteur de la démo** (`site/app.js`, fonction
`smartIngest`), et rebundlé dans la démo servie (`site-demo/index.html`). Un vrai export
Nielsen déposé dans la démo produit directement un assortiment propre. Vérifié de bout en bout
sur les **4 fichiers réels (3 pays)** :

| Fichier | En-tête trouvé | Marché retenu (le plus gros) | SKU lus | Catégorie lue |
|---|---|---|---|---|
| F3 France (à plat) | ligne 1 | « Total HYPERS+SUPERS » (sur 12) | 317 | Coloration / capillaire |
| F1 Benelux Watson | ligne 5 | « ASW Drogisterij » (sur 6) | 36 | Coloration homme 90 % |
| F2 Benelux Full market | ligne 5 | « SM/D/Overig Retail » (sur 6) | 118 | Coloration homme 88 % |
| F4 Nordics | ligne 4 | grocery total (sur 61) | 25 | Coloration homme 100 % |

Ce que ça a demandé côté robot (tout vérifié) :
1. **Lecture robuste** : le lecteur Excel de la démo (SheetJS) ouvre **les 4 fichiers**, y compris
   les 3 au `styles.xml` cassé — pas besoin de lecteur spécial. (C'est openpyxl, pas SheetJS, qui
   bloquait.)
2. **Dictionnaire multi-langue** FR/EN/NL (ajout de `MERK`, `GROEP`, `category (NDH)`, etc.).
3. **En-tête = ligne qui reconnaît le plus de champs *différents*** (une ligne de périodes
   répétées ne gagne plus).
4. **Règle d'or respectée** : on prend la colonne de ventes **de base**, jamais une variante
   *YA / Promo / %Chg / YTD*.
5. **EX13 anti-double-compte** : (a) on n'garde que les lignes à **EAN valide** (les lignes
   « total/segment » sont écartées) ; (b) on lit **une seule géographie** — la plus grosse
   enseigne — et jamais la somme Total + composants.

## Ce qui reste honnête à améliorer (petites limites)
- **CA absolu** : sur les fichiers « longs » (produit × période), le CA en k€ est un **ordre de
  grandeur** (annualisation approchée) ; les **parts (PDM)** — ce qui sert au planogramme — sont
  justes. À afficher comme tel.
- **Fichiers Benelux sans libellé produit** : les produits sont identifiés par l'EAN seul ;
  ~10 % de lignes mal catégorisées (dominante correcte).
- **Choix d'enseigne** : la démo prend d'office la plus grosse ; le **vrai back-end**
  (`app/lib/parse.ts`) sait déjà, lui, exposer la liste et laisser choisir (et il gérait déjà
  le NL et le multi-enseigne). Petit écart de défaut à aligner (back-end = « première réelle »,
  démo = « la plus grosse » comme le veut la convention CLAUDE.md).

*(Prototype d'origine : `robot/recognize_colonnes.py`. Logique désormais portée dans `site/app.js`.)*
