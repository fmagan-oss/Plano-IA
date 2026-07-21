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

À compléter chaque nuit : R5 (formes croisé/long — EX05/EX06), R9–R12 (allocation
— EX08/EX09/EX10/EX11).
