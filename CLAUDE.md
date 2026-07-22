# CLAUDE.md — CatPilot

> Mémoire permanente, relue à chaque session. Règles stables uniquement.
> Le détail d'une feature va dans son ticket, pas ici.

## Ce qu'est CatPilot
Lit des exports de panels distributeurs (Circana / Nielsen) et produit un
planogramme : un nombre de facings par référence, sous contrainte de linéaire.
Deux temps : extraction (export → base propre) puis allocation (base → plan de rayon).

## Règle d'or (priorité absolue sur tout le reste)
Ne jamais produire un plan qu'on ne peut pas produire proprement.
S'arrêter et dire pourquoi. Ne rien inventer.

## Politique d'échec propre
Quand une donnée critique manque ou qu'une ambiguïté empêche un plan fiable :
1. Ne pas produire de plan.
2. S'arrêter et indiquer le motif en clair.
3. Lister précisément ce qui manque ou bloque (ex. : EAN absent, largeur de
   référence inconnue, période ambiguë).
Ne jamais combler un trou par une valeur devinée.
Un plan partiel « non fiable » n'est pas le comportement par défaut : autorisé
seulement si François le demande explicitement, et marqué comme tel.
(Généralise à toute la chaîne le refus propre + warning R8 déjà fait par le parseur.)

## Définition du « fini » (un plan n'est livrable que s'il passe)
- V1 — Σ linéaire dans le budget
- V2 — facings ≥ plancher pour chaque référence
- V4 — Σ facings exact
- V5 — aucune contradiction entre le plan et le diagnostic
- V9 — parts = 100 %

## Conventions permanentes
- Parts normalisées (R10).
- Implantation en bloc-marque vertical.
- Enseigne par défaut = la plus grosse.
- Toute modification du design / de l'implantation exige l'aval explicite de
  François ; le backend ne la change pas de lui-même.

## Cas de test de référence (ne pas régresser)
- EX12 — période incomplète : retenir P6, pas P7 (P7 = 73,2 % de couverture, incomplète).
- EX13 — géographie : TOTAL = HYPERS + SUPERS ; ne pas sommer les agrégats.
- EX14 — allocation : budget ≤ 192 cm, plancher réf. B = 6.

## Repères code
- Parseur / extraction : app/lib/parse.ts
- Allocation : app/lib/planogram.ts
- Lancer les tests : npm test
- Méthode d'allocation détaillée (0→7) : vit dans le ticket d'allocation, pas ici.
