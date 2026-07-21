# Boîte de dépôt d'entraînement

Déposez ici des fichiers panel réels (.xlsx / .csv) — complets ou en erreur —
pour entraîner le robot de lecture. La routine nocturne les analyse, enrichit
le dictionnaire de colonnes (app/lib/column-aliases.json) et archive les
signatures d'en-têtes dans training-data/ (sans données produits).

⚠️ Les fichiers déposés ici sont versionnés dans le dépôt Git : ne déposez pas
de données que vous ne souhaitez pas voir dans le dépôt. Vous pouvez aussi
envoyer les fichiers directement dans la conversation Claude — ils sont alors
traités immédiatement et seules les signatures d'en-têtes sont conservées.
