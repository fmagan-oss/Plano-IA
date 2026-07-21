# Registre d'échecs — robot CatPilot

*Méthode (formation, Partie 8) : une ligne par erreur reproduite, avec l'ID du
test qui la garde. Jamais de correction silencieuse — l'erreur devient d'abord
un test qui échoue, puis on corrige.*

| Date | Erreur | Règle | Test de non-régression |
|---|---|---|---|
| 2026-07-20 | « VMH » capté comme CA (moyenne sommée) | R3 | trap-vmh → `column-signatures` non-sommable |
| 2026-07-20 | « Sales Value YA » capté à la place du courant | R1 | expect EX03 / trap-ya |
| 2026-07-20 | « MANUFACTURER » pris pour la marque | R2 | trap-fab (marque = BRAND) |
| 2026-07-20 | agrégat ombrelle sans « total » compté comme marque | R7 | trap-agg (« Café Or » = Σ des autres) |

| 2026-07-21 | format long : produit compté N fois (semaines + cumul) | R5 (long) | fr-format-long-ytd (période résolue = cumul YTD, filtrée) |
| 2026-07-21 | croisé Circana : niveau SKU lu sur une colonne semaine vide → CA = 0 | R5 (croisé) | HYPERS : période de référence = cumul (CAM) préféré, jamais une colonne vide |
| 2026-07-21 | croisé Circana : mauvaise feuille (total + segment seuls) → « COLORATION HOMME 100 % » | R5 (croisé) | HYPERS : feuille préférée par la solidité de la période puis la richesse (feuille marques) |
| 2026-07-21 | croisé : marque à 0 sur la période exclue à tort tout le niveau marque | R5 (croisé) | HYPERS : validation par Σ = total catégorie, pas par « toutes les marques > 0 » (RE-NATURE = 0 gardée) |

À compléter chaque nuit : R9–R12 (allocation — EX08/EX09/EX10/EX11).
