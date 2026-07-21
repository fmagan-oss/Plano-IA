# CatPilot — Spécification du parcours utilisateur (prompt pour Claude Code)

## Comment l'utiliser

1. Place **`CATPILOT_SITE.html`** (ou `CATPILOT_BETA_DESKTOP.html`) à la racine de ton projet.
2. Colle le prompt ci-dessous dans Claude Code.
3. **L'instruction la plus importante est la première** : le fichier HTML est la référence visuelle. Claude Code ne doit pas redessiner l'interface, il doit la **reproduire**.

---

## LE PROMPT (à coller)

> Le fichier **`CATPILOT_SITE.html`** à la racine est le **prototype de référence, validé en test utilisateur**. Ouvre-le et étudie-le : son interface, son parcours, ses libellés et ses micro-interactions sont la **spécification**, pas une inspiration.
>
> **Règle n°1 — ne redesigne rien.** N'invente pas de nouvelle mise en page, ne remplace pas les composants par ceux d'une librairie UI (pas de Material, pas de Bootstrap, pas de refonte "moderne"), ne change ni les couleurs, ni les libellés, ni l'ordre des étapes. Si tu portes le code vers un framework, le rendu à l'écran doit rester **visuellement identique**. En cas de doute entre "faire mieux" et "faire pareil" : **fais pareil**.
>
> **Règle n°2 — le flow ci-dessous est contractuel.** Chaque écran, chaque état intermédiaire et chaque texte listés doivent exister. C'est ce parcours qui rend l'outil utilisable par un commercial non technique.
>
> ### Design tokens (à reprendre tels quels)
> ```css
> --ink:#0F1B2D; --ink2:#3D4B5F; --mut:#7A8699;
> --line:#E3E8EF; --line2:#EDF1F6; --bg:#F6F8FB; --card:#FFFFFF;
> --acc:#2E6BFF; --acc-d:#1E4FD0; --acc-l:#EAF0FF;
> --teal:#0E8F8A; --amber:#C77F1E; --purple:#6B4E8E; --grey:#8A94A0;
> --green:#1E8E3E; --red:#C5321C; --gold:#B98A00;
> --sh1:0 1px 2px rgba(15,27,45,.05),0 4px 14px rgba(15,27,45,.06);
> --sh2:0 2px 6px rgba(15,27,45,.08),0 12px 30px rgba(15,27,45,.10);
> ```
> Police de l'application : **Aptos**, repli `"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif`. Corps à **15 px**, interligne 1.5. Cartes blanches, coins arrondis (12–16 px), ombres douces `--sh1`. Fond général `--bg`.
> Couleurs de familles (légende du planogramme, à ne pas modifier) : Barbe `#C77F1E` · Cheveux `#0E8F8A` · Innovation `#6B4E8E` · Concurrent `#8A94A0` · MDD `#3D4B5F`.
>
> ### Barre de progression permanente (stepper)
> Toujours visible en haut de l'application, 5 étapes numérotées, l'étape courante en surbrillance, un rail entre chaque :
>
> | # | Titre | Sous-titre |
> |---|---|---|
> | 1 | Catégorie | périmètre & enseigne |
> | 2 | Éléments | meubles du rayon |
> | 3 | Planches | par élément |
> | 4 | Marqueurs | critères d'optimisation |
> | 5 | Plan généré | planogramme & métriques |
>
> ---
>
> ## ÉTAPE 1 — Dépôt du fichier
>
> Carte titrée **« Point de départ — plug ton fichier »**, contenant :
> - Une **grande zone de dépôt** (drag & drop + clic), icône flèche vers le haut en `--acc`, texte principal **« Dépose ton extract (Excel .xlsx ou CSV) »** et sous-texte *« EAN × enseigne × période, ou une liste de références. C'est le point de départ de toute l'analyse. »* Formats acceptés : `.csv, .xlsx, .xls, .tsv, .zip`.
> - Deux boutons secondaires sous la zone : **« Télécharger le modèle »** et **« Ou explorer avec la catégorie démo »** (ce second bouton doit permettre de tout tester sans aucun fichier).
>
> ### 1b — Animation de traitement (ne pas supprimer, ne pas raccourcir)
> Dès le dépôt, la zone est remplacée par un bloc de traitement : une **barre de progression** qui se remplit et **6 sous-étapes** qui s'allument une par une (~560 ms chacune, ~3,7 s au total), chacune passant en ✓ quand elle est faite. Chaque sous-étape a un titre et un sous-titre **alimenté par les données réellement lues** :
>
> | Sous-étape | Sous-titre (dynamique) |
> |---|---|
> | Lecture du fichier | nom du fichier |
> | Repérage de l'en-tête & des colonnes | produit, valeur, distribution, prix… |
> | Agrégation & annualisation des ventes | consolidation par référence |
> | Détection des familles & marques | *N* marque(s) |
> | Repérage des nouveautés (vs an dernier) | *N* détectée(s) |
> | Calcul des scores catégoriels | *N* références prêtes |
>
> Cette animation n'est pas décorative : elle donne à l'utilisateur le temps de comprendre ce que l'outil a fait de son fichier. **Ne la remplace pas par un spinner.**
>
> ### 1c — Carte de confirmation (l'écran le plus important du parcours)
> À la fin du traitement, une carte s'affiche avec, dans cet ordre :
> 1. Badge **« Catégorie détectée »**, puis le **nom de la catégorie** en grand.
> 2. Une ligne de méta : **« N références lues »**, plus, le cas échéant : *« — X ligne(s) d'agrégat (Total / Catégorie) écartée(s) pour éviter le double-compte »*, *« — X référence(s) sans montant lisible »*, et sur une seconde ligne en petit **« Traitement des montants : … »** (échelle appliquée).
> 3. Des **puces colorées de familles** (Barbe · Cheveux · Innovation · Concurrent · MDD) avec le nombre de références de chacune.
> 4. **Arbitrage catégoriel** (voir ci-dessous) — s'affiche seulement si nécessaire.
> 5. **Choix de la marque du client** : liste déroulante *« Ta marque — les autres deviennent concurrents sur le plan »*. Ne s'affiche que si plusieurs marques ont été détectées.
> 6. **Nouveautés** : *« N nouveauté(s) détectée(s) (présentes cette année, absentes l'an dernier) »* avec une case à cocher « Signaler les nouveautés ».
> 7. Bouton principal **« Confirmer et poursuivre → »**.
>
> **Arbitrage catégoriel — deux cas distincts, à ne pas confondre :**
> - **Univers incompatibles** (ex. Food + DPH dans le même fichier) → carte **rouge** (`#FEF2F2`, bordure `#DC2626`), titre **« ⛔ Univers incompatibles dans le même fichier »**, explication (un plan de rayon ne mêle pas des univers distincts), liste déroulante de choix de la catégorie, et **le bouton « Confirmer » est désactivé** tant qu'aucun choix n'est fait. Il se réactive à la sélection.
> - **Plusieurs catégories du même univers** (ex. coloration + rasage + bucco) → carte **ambre** (`#FFF7E0`, bordure `#C77F1E`), titre **« ⚠️ Plusieurs catégories détectées »**, puces indiquant le poids de chaque catégorie, liste déroulante de choix, bouton **actif** (c'est une validation, pas un blocage). Option « Tout conserver (déconseillé) » disponible.
> - Dans les deux cas, note de bas de carte : *« Les références non classées seront rattachées à la catégorie dominante. »*
>
> ### 1d — Repli : mapping manuel
> Si les colonnes ne sont pas reconnues automatiquement, la carte bascule en mode **« Associez les colonnes »** : message d'explication, puis trois listes déroulantes — *colonne « produit / référence »*, *colonne « valeur / CA / ventes »*, *colonne « famille » (optionnel — sinon déduite)* — et un bouton **« Valider le mapping → »**. L'utilisateur ne doit jamais se retrouver dans une impasse.
>
> ---
>
> ## ÉTAPE 2 — Éléments du rayon
>
> Carte **« Choisis le nombre d'éléments de ton rayon »**, avec deux compteurs (− valeur +) côte à côte :
> - **élément(s)** — de 1 à 4 (**limité à 1 en démo**, avec la mention *« Démo : 1 élément. Jusqu'à 4 éléments en Pro. »*)
> - **cm / planche** — valeurs standard GMS : **100 · 125 · 133**
>
> Sous les compteurs, une ligne d'aide qui se recalcule en direct : *« Un élément = un meuble de gondole… Capacité d'une planche = largeur ÷ 7,5 cm par facing → **17 facings** par planche. »*
>
> Navigation : « ← Retour » / « Continuer → Planches ».
>
> ---
>
> ## ÉTAPE 3 — Planches
>
> Carte **« Combien de planches par élément ? »**, un compteur **planche(s)** (de ½ à 6). Ligne d'aide recalculée en direct :
> *« Capacité totale du rayon : **68 facings** (17 × 4 planches × 1 élément) = **510 cm** de linéaire développé. La planche n°2 en partant du haut est traitée comme **niveau des yeux**. »*
>
> Navigation : « ← Retour » / « Continuer → Marqueurs ».
>
> ---
>
> ## ÉTAPE 4 — Marqueurs & règles (deux cartes côte à côte)
>
> **Carte de gauche — « Marqueurs de construction — pondère ce qui compte »**
> Cinq curseurs, chacun avec un libellé, une étiquette de catégorie et une définition courte :
>
> | Marqueur | Étiquette | Poids par défaut | Définition affichée |
> |---|---|---|---|
> | CA / cm linéaire | VALEUR | 30 % | Productivité valeur du linéaire : CA MAT ÷ cm alloués. Le juge de paix de l'acheteur. |
> | VMH — rotation unitaire | ROTATION | 25 % | Ventes moyennes hebdo par magasin. Pilote le réassort et le risque de rupture. |
> | Marge distributeur / cm | MARGE | 15 % | Taux de marge × CA ÷ cm : l'argument différenciant vs le CA pur (MDD, innovations). |
> | PDM valeur (représentativité) | MARCHÉ | 15 % | Le rayon doit refléter le marché : un plan sous-pondérant un leader se fait retoquer. |
> | Croissance segment / réf | MARCHÉ | 15 % | — |
>
> Sous les curseurs : *« Somme des poids : **100 %** »*, plafonnée à 100 % (curseurs bloqués au-delà), saisie directe possible.
>
> Encadré bleu **« Proposer un angle au copilote »** : champ texte *« Ton angle d'analyse… »* + bouton **« Appliquer »**. L'utilisateur décrit sa lecture en langage naturel (ex. « pousser la marge et protéger les innovations ») et l'outil traduit en pondération.
>
> **Carte de droite — « Règles merchandising (contraintes du plan) »**
> Six interrupteurs, tous activés par défaut :
> 1. Facings pairs, min. 2 par réf — *Visibilité + réassort : jamais de facing orphelin.*
> 2. Leaders au niveau des yeux — *Planche 2 (1,50-1,70 m) réservée aux top scores du segment cœur.*
> 3. Blocs par usage (barbe / cheveux) — *Implantation segmentée par usage — pas par marque : lisibilité shopper.*
> 4. Innovations en zone découverte — *Nouveautés sur la planche du haut, badge NOUVEAU.*
> 5. MDD & entrée de prix en bas — *Règle GMS : premium en haut, prix bas en bas.*
> 6. Représenter la concurrence — *Un plan catégoriel crédible inclut le concurrent.*
>
> Bouton principal en bas : **« ⚙ Générer le plan de rayon »**.
>
> ---
>
> ## ÉTAPE 5 — Plan généré
>
> En-tête de résultat : un **anneau de score** (donut animé) avec le libellé *« Score du plan — couverture de la demande pondérée »*, puis **4 pastilles de variantes** qui régénèrent le plan au clic : **Équilibré** (active par défaut) · **Priorité rotation** · **Priorité marge** · **Priorité CA/cm**. Ces variantes doivent produire des **allocations de facings visiblement différentes**. À droite, bouton « Exporter PDF ».
>
> Bloc repliable **« Afficher les vrais packs »** : dépôt de PNG détourés nommés par le code de chaque référence, qui remplacent le color-coding par les vrais visuels produit ; bouton « Télécharger la liste des codes du plan » et case « Afficher les packs ».
>
> Puis, dans cet ordre :
>
> **① Plan de masse — vue macro de la catégorie** : barre de blocs proportionnels + tableau récapitulatif. Note : *« Le plan de masse fixe les blocs et leur poids ; le plan au facing donne le détail par référence. Somme des blocs = linéaire du plan. »*
>
> **② Plan au facing — détail par référence** : la gondole dessinée planche par planche, chaque facing coloré selon sa famille, badge **NEW** et surbrillance sur les nouveautés, et une **légende** sous le meuble (Barbe client · Cheveux client · Innovation client · Concurrent · MDD).
>
> **Deux cartes côte à côte** : *« Assortiment généré & facings »* (tableau défilant, hauteur max ~340 px) et *« Métriques du plan »* (tableau de KPI + zone part de linéaire + verdict).
>
> **③ Trame de présentation acheteur — prête à dérouler** : 5 diapositives numérotées —
> 1. Le marché & le conso · 2. L'ambition — le rayon de demain · 3. Ce qui change · 4. Les bénéfices — conso & magasin · 5. La décision.
> Boutons **« Copier le script »** et **« Exporter PDF »**. Note : *« Cinq temps […] générés depuis les chiffres du plan. En production : export .pptx à la charte du client. »*
> **En démo**, cette section est remplacée par une carte verrouillée : *« 🔒 Trame de présentation acheteur — réservée à l'offre Pro »* + bouton d'activation ; les boutons Copier/PDF sont masqués.
>
> Navigation de bas de page : « ← Ajuster les marqueurs ».
>
> ---
>
> ## Copilote (panneau latéral, accessible partout)
>
> Tiroir à droite, titré **« Discussion — copilote catégorie »**, sous-titre *« Ancré sur ton plan en cours · réponses traçables »*, badge de mode (**IA EMBARQUÉE** ou IA connectée), fil de discussion, **suggestions cliquables**, champ *« Pose ta question ou donne un ordre… »*. Il doit pouvoir agir sur le plan, pas seulement répondre.
>
> ---
>
> ## Règles d'expérience à respecter absolument
>
> 1. **Aucune impasse.** Fichier illisible → message clair + mapping manuel. Jamais d'écran vide ni d'erreur technique brute.
> 2. **Tout est recalculé en direct.** Les lignes d'aide (capacité, cm, facings) se mettent à jour à chaque clic sur un compteur.
> 3. **L'utilisateur voit toujours où il en est** : le stepper reste visible, l'étape courante est marquée.
> 4. **On peut tout essayer sans fichier** grâce à « Explorer avec la catégorie démo ».
> 5. **Les chiffres sont traçables** : l'origine et le traitement (agrégats écartés, échelle appliquée) sont affichés, jamais silencieux.
> 6. **Le bridage démo est produit, pas frustrant** : 1 élément et trame verrouillée, avec une explication claire de ce qu'apporte le Pro.
> 7. **Vocabulaire métier** : facing, planche, élément, linéaire développé, part de linéaire, fair share, tête de gondole. Jamais de jargon technique côté utilisateur.
>
> ## Anti-patterns (ce qui casse l'expérience — à éviter)
>
> - Remplacer l'animation de traitement par un spinner ou un simple « Chargement… ».
> - Fusionner les étapes du wizard en un seul long formulaire.
> - Cacher la carte de confirmation et enchaîner directement sur le plan (l'utilisateur perd le contrôle sur sa donnée).
> - Afficher une erreur technique (« TypeError », « undefined ») au lieu d'un message métier.
> - Changer les couleurs de familles : elles font partie de la lecture du planogramme.
> - Ajouter des ombres portées lourdes, des dégradés ou des animations superflues : le style est **sobre, dense, professionnel** — un outil de travail, pas une landing page.
>
> ## Critères d'acceptation (montre-les-moi)
>
> 1. Je dépose un `.xlsx` → animation en 6 sous-étapes → carte de confirmation avec le nombre de références et les familles.
> 2. Je dépose un fichier mêlant Food et DPH → carte rouge, bouton « Confirmer » **désactivé** jusqu'au choix d'une catégorie.
> 3. Je dépose un fichier avec 3 catégories DPH → carte ambre avec le poids de chacune, bouton actif.
> 4. Je clique « Explorer avec la catégorie démo » → je peux dérouler tout le parcours jusqu'au plan sans fichier.
> 5. Je change le nombre de planches → la ligne « capacité totale » se met à jour instantanément.
> 6. Je clique « Priorité rotation » → les facings changent visiblement par rapport à « Équilibré ».
> 7. En démo → le compteur d'éléments est bloqué à 1 et la trame est verrouillée ; en Pro → 4 éléments et trame complète.
> 8. Sur mobile, le parcours reste utilisable (une colonne, compteurs et zone de dépôt accessibles au pouce).
>
> **Commence par me montrer l'étape 1 complète** (dépôt → animation → carte de confirmation) et attends ma validation avant de continuer.

---

## Conseil d'usage

Si Claude Code a déjà produit une interface qui ne te convient pas, ne lui demande pas de la « corriger » : demande-lui de **repartir du prototype**. Une formulation qui marche bien :

> « Ignore l'interface actuelle. Ouvre `CATPILOT_SITE.html`, et reconstruis l'écran X pour qu'il soit **visuellement identique** au prototype — mêmes couleurs, mêmes libellés, mêmes espacements. Montre-moi une capture avant d'aller plus loin. »

Et garde toujours `CATPILOT_SITE.html` dans le projet : c'est ta référence, et le meilleur moyen de rattraper une dérive visuelle.
