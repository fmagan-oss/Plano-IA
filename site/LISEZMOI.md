# CatPilot — dossier de travail (version découpée)

Le site était un seul fichier HTML de 1,4 Mo, avec deux librairies collées à
l'intérieur. Claude Code n'arrivait pas à le lire : trop gros, et noyé sous le
code des librairies. Ce dossier règle le problème — chaque fichier a un rôle
unique et reste assez petit pour être lu et modifié proprement.

## Les fichiers

    index.html   -> la structure de la page        (46 Ko — lisible)
    styles.css   -> tous les styles                 (48 Ko)
    app.js       -> TOUTE ta logique                (121 Ko — lisible)
    vendor/      -> les librairies tierces, isolées : NE PAS TOUCHER
        xlsx.full.min.js   (SheetJS, lecture Excel)
        pptxgen.min.js     (export PowerPoint)

## Comment travailler (avec Claude Code ou un éditeur)

1. Ouvre CE DOSSIER (pas un fichier isolé) dans Claude Code.
2. Pour un changement, pointe-le sur UN SEUL fichier :
   - l'apparence / le texte des pages -> index.html
   - les couleurs, tailles, mise en page -> styles.css
   - le fonctionnement (calculs, étapes, boutons) -> app.js
3. Ne demande jamais de modifier vendor/ : c'est du code tiers, pas le tien.

## Tester

Double-clique sur index.html : il s'ouvre dans ton navigateur et fonctionne.
(Si un jour le navigateur bloque le chargement des fichiers voisins, lance un
petit serveur local depuis le dossier : `python3 -m http.server` puis ouvre
http://localhost:8000 — mais le double-clic suffit dans la majorité des cas.)

## Livrer en un seul fichier

Quand tu veux transmettre le site en un seul fichier (double-clic, envoi) :

    python3 bundle_site.py

Cela recolle tout dans CATPILOT_bundle.html. Tu gardes le dossier pour
travailler, et tu ne partages que le fichier recollé.

## Refaire le découpage sur une autre version

Si tu repars d'un autre fichier monolithe :

    python3 split_site.py mon_fichier.html dossier_de_sortie
