# Pourquoi un fichier n'est pas (bien) lu — catalogue complet

Liste exhaustive des raisons pour lesquelles CatPilot peut échouer à analyser un
fichier, ou l'analyser de façon dégradée. Ancrée dans le code réel du parseur
(`app/lib/parse.ts`) et sur deux vrais exports (Circana HYPERS croisé, NielsenIQ
« Male Hair Colour » à plat). Version tableur pour tri/annotation :
`docs/raisons-non-lecture-fichier.xlsx`.

Quatre familles : **A. Blocage** (aucun planogramme), **B. Dégradation** (lu mais
moins fiable), **C. Non-détection d'une colonne** (causes techniques),
**D. Format des données** (lu mais valeurs faussées).

## A. Blocage — aucun planogramme généré
1. **Format non pris en charge / fichier corrompu** — pas `.xlsx/.xls/.csv` ou archive illisible.
2. **Classeur sans aucune feuille**.
3. **Feuille sans aucune ligne**.
4. **Rapport panel croisé sans colonne marque** — mesure en colonne, périodes/enseignes en colonnes, hiérarchie produits (cas du 1er fichier Circana HYPERS). *Refus volontaire tant que le moteur de lecture de rapport n'existe pas.*
5. **Lecture non fiable** — > 60 % des lignes sans marque/EAN/libellé, ou 0 produit, ou ni marque ni EAN.

## B. Dégradation — lu, mais moins fiable (avertissement)
6. Ni EAN ni libellé produit — références non identifiables.
7. Pas d'EAN (identification par libellé).
8. Pas de marque / fabricant — blocs marque impossibles.
9. Ni CA ni volume — facing uniforme, non pondéré.
10. Pas de CA — variante CA et écart linéaire/CA indisponibles.
11. Pas de volume — variante Rotation moins fiable.
12. Pas de marge — pondération par défaut.
13. Pas de nouveauté — aucune innovation mise en avant.
14. Lignes de total/agrégat — **exclues automatiquement** (anti double comptage).
15. Lignes vides/incomplètes — ignorées.
16. CA et volume de **périodes différentes** — analyse sur la période du CA, volume mal aligné ignoré.

## C. Non-détection d'une colonne — causes techniques
17. **Intitulé absent du dictionnaire** (alias manquant) — corrigé par entraînement ou mapping manuel/IA.
18. **Bloc de titre en tête** (« Table-1 », « Revenir au rapport ») — géré si < 10 lignes.
19. **Page de garde / sommaire** — on prend la feuille qui matche le plus (8 premières).
20. **Colonne « année précédente »** (YA / N-1 / A-1) captée à la place de l'actuel — *à traiter dans le moteur*.
21. **Marque vs Fabricant** — deux colonnes possibles, on prend la 1re (à arbitrer ; défaut souhaité : marque).
22. **Colonne de part/distribution** (PDM, %, share, DN, DV, VMH, ACV, « / mag ») — exclue des ventes.
23. **Alias court** capturant un mot long (« CA » dans « Catégorie ») — frontière de mot exigée.
24. **Mesure rangée en colonne** (le CA est une valeur de la colonne « Mesures ») — *moteur de rapport requis*.

## D. Format des données — lu, mais valeurs faussées
25. **Format long** : une ligne par produit × période (ex. 40 périodes empilées, cas NielsenIQ) — sans filtre, un produit est compté N fois. *Filtre de période ou agrégation à construire.*
26. Nombres au format texte + séparateurs de milliers — gérés.
27. **CSV UTF-8 sans BOM** — accents cassés ; exporter avec BOM ou en `.xlsx`.
28. Apostrophe typographique / parenthèses dans l'intitulé — normalisées.
29. Marge en % vs en € — convertie si 0–100 avec CA présent.

---

### Ce qui bloque encore tes deux fichiers réels
- **Circana HYPERS** (croisé) : raisons 4, 24 — mesure en colonne, périodes et
  enseignes en colonnes, hiérarchie avec totaux. Nécessite le moteur de lecture de rapport.
- **NielsenIQ Male Hair Colour** (à plat) : lisible en principe (BRAND, ITEM, UPC,
  Sales Value, Sales Units), mais raisons 20, 21, 25 — colonnes « YA », choix
  marque/fabricant, et surtout format long (40 périodes empilées à filtrer/agréger).
