# CatPilot — Spécification UI complète (prompt pour Claude Code)

> **Ce document couvre tout SAUF le parcours de génération**, déjà spécifié dans `PROMPT_FLOW_UX_CatPilot.md`.
> Les deux se complètent : celui-ci décrit la **landing** et les **pages de l'application** (Analyses, Données, Offres, coque, copilote) ; l'autre décrit le **parcours du dépôt de fichier jusqu'au plan**.

## Comment l'utiliser
1. Garde **`CATPILOT_SITE.html`** à la racine du projet — c'est la référence visuelle.
2. Colle le prompt ci-dessous dans Claude Code.
3. Fais-lui traiter **une partie à la fois** (A, puis B, etc.) et valide chaque écran avant de continuer.

---

## LE PROMPT (à coller)

> Le fichier **`CATPILOT_SITE.html`** est le **prototype de référence validé**. Il contient la landing page et l'application complète. Son rendu visuel est la **spécification**.
>
> **Règle n°1 — ne redesigne rien.** Reproduis. Pas de librairie UI (ni Material, ni Bootstrap, ni refonte « moderne »), pas de nouvelle palette, pas de reformulation des textes, pas de réorganisation des sections. Si tu portes le code vers un framework, le rendu doit rester **visuellement identique**. Entre « faire mieux » et « faire pareil » : **fais pareil**.
>
> **Règle n°2 — deux identités visuelles distinctes et voulues.** La **landing** est éditoriale (Bricolage Grotesque + Inter, grands titres, respiration). L'**application** est un outil de travail (Aptos, 15 px, dense, sobre). Ne les uniformise pas.
>
> ---
>
> # PARTIE A — LANDING PAGE
>
> ## Typographie & tokens (landing)
> ```html
> <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
> ```
> - Corps : **Inter**, 16 px, interligne 1.55, repli `-apple-system,"Segoe UI",system-ui,sans-serif`
> - Titres, marque, prix, chiffres-clés : **Bricolage Grotesque**
> - `h1` : **50 px**, `line-height:1.04`, `letter-spacing:-1.8px`, `font-weight:800` (→ 36 px et `-1.2px` sous 960 px)
> - `h2` : 32 px, `letter-spacing:-1px` (→ 26 px en mobile)
> - Mêmes tokens couleurs que l'app (voir Partie B), fond `--bg:#F6F8FB`, cartes blanches, rayons 14-18 px.
>
> ## Barre de navigation
> Sticky, fond blanc translucide + `backdrop-filter:blur(10px)`, hauteur 62 px.
> Marque à gauche : pastille dégradée + **« CatPilot »** + badge **« BÊTA »** (fond `--ink`, blanc, 9 px).
> Liens : **Produit · Méthode · Offres · FAQ**. À droite : bouton fantôme **« Se connecter »** + bouton plein **« Ouvrir la démo »**.
>
> ## Hero (2 colonnes : 1.12fr / 0.88fr)
> - Surtitre : **« Le copilote category management · Industriels PGC »** (12 px, majuscules, `letter-spacing:1.4px`, couleur `--acc-d`)
> - **H1 : « Préparez vos revues de gamme comme un category captain. »**
> - Accroche : *« CatPilot fait le travail d'analyse catégorielle — diagnostic, plan de masse, planogramme au facing, part de linéaire en **fair share** — et vous le rend en **reco argumentée, prête à présenter**. Vous gagnez les jours de préparation ; vous gardez la main sur la relation acheteur. »*
> - Deux boutons : **« Ouvrir la démo gratuite »** (plein) et **« Voir comment ça marche »** (fantôme, ancre `#methode`)
> - **Trois chiffres** (cartes blanches, nombre en 28 px Bricolage, couleur `--acc-d`) :
>
> | Chiffre | Libellé | Précision |
> |---|---|---|
> | 48 h | de préparation | au lieu de trois semaines d'analyse |
> | 100 % | de chiffres traçables à leur source | de l'analyse à la trame acheteur |
> | 0 € | de data en plus | vos extracts, votre licence |
>
> - Sous les chiffres : *« Pour les industriels PGC de 20 à 500 M€, sans équipe category management. Vos données restent sous votre licence panel (BYOD). »*
> - **Colonne de droite — mini-planogramme illustratif** (carte blanche) : titre `Plan généré — coloration homme · 133 cm · 4 planches`, trois rangées de facings colorés (barbe orangé, cheveux teal, innovation violet avec badge NEW, concurrent gris, MDD ardoise) posés sur des tablettes grises, légende *« Socle barbe au niveau des yeux · nouveautés en avant · MDD en bas »*, puis trois pastilles bleues : **« PDL 86 % vs PDM 71 % »**, **« CA/cm +18 % »**, **« 0 rupture week-end »**.
>
> ## Section « scène » (bandeau sombre, `--ink`, coins 22 px)
> - Surtitre bleu clair : **« La veille de la revue de gamme »**
> - Phrase en 26 px : **« Le dossier est prêt. Vous avez passé la journée sur votre stratégie, pas sur vos fichiers. »**
> - Paragraphe : *« Diagnostic, plan de masse, part de linéaire face à la part de marché, trame de présentation : l'analyse est faite et chaque chiffre remonte à sa source. En rendez-vous, quand la question vient, vous avez la réponse — et vous gardez la main sur la discussion. »*
>
> ## Section preuve sociale
> Titre en petites majuscules : **« Ils co-construisent CatPilot — programme design partners »**, quatre cadres en pointillés (« Votre marque ici », « Design partner » ×3), puis : *« Nous sélectionnons quelques marques partenaires — catégories non concurrentes — pour co-construire le produit. »* + lien **« Rejoindre le programme → »**.
>
> ## Section « De vos données à une reco de rayon argumentée »
> Sous-titre : *« Trois temps, une seule session : lire la catégorie, construire le rayon, argumenter la reco. »*
> Trois cartes numérotées (pastille bleue 01/02/03) :
>
> | # | Titre | Texte |
> |---|---|---|
> | 01 | Lire la catégorie | Parts de marché, prix, dynamique des segments, distribution : la photo nette de votre marché, à partir de vos propres chiffres. Là où l'acheteur vous attend. |
> | 02 | Bâtir le rayon | Un linéaire piloté par la demande : assortiment priorisé, facings alloués selon vos marqueurs — CA au cm, rotation, marge, fair share, croissance. Du plan de masse au facing près. |
> | 03 | Argumenter la reco | La part de linéaire en fair share et la trame de présentation, générées depuis vos chiffres. Vous n'arrivez plus avec un avis — vous arrivez avec un dossier qui se tient. |
>
> Phrase de clôture centrée (Bricolage, 18 px) : **« Le category management des grands groupes, à la portée de l'industriel qui n'en a pas l'équipe. »**
>
> ## Section « Le travail d'un category captain, en une session »
> Sous-titre : *« Un category manager passe 70 % de son temps à réconcilier des fichiers. CatPilot fait ce travail — et vous rend les livrables qui appuient votre reco. »*
> Trois cartes avec pictogramme carré bleu clair (⌕ / ▦ / ◎) :
> - **Des chiffres traçables** — *Anti-double-compte, périodes alignées, totaux recalculés. Les chiffres sont calculés, pas « générés » : chacun pointe vers sa source — fichier, onglet, période. Rien à inventer, tout à justifier.*
> - **Du plan de masse au facing** — *Vue macro par blocs, puis planogramme au facing près : paires, socle au niveau des yeux, nouveautés mises en avant, concurrent représenté. De la ½ planche au rayon de 4 éléments.*
> - **La trame de présentation acheteur** — *Marché, ambition chiffrée, ce qui change, bénéfices conso & magasin, décision : une présentation prête à dérouler en rendez-vous — à copier ou en PDF.*
>
> ## Section « Comment ça marche » (5 étapes numérotées)
> Sous-titre : *« Cinq étapes guidées — vos données en entrée, un rayon défendable en sortie. »*
>
> | # | Titre | Sous-texte |
> |---|---|---|
> | 1 | Chargez vos données | Extract panel (Circana, NielsenIQ), sell-in, e-commerce — sous votre licence. |
> | 2 | Confirmez la catégorie | Mapping EAN semi-automatique, contrôles de fiabilité intégrés. |
> | 3 | Concevez votre plan | Éléments, cm par planche, nombre de planches — de la ½ planche à 4 éléments. |
> | 4 | Pondérez vos marqueurs | CA/cm, rotation, marge, fair share, croissance — ou dictez votre angle au copilote. |
> | 5 | Générez, présentez | Plan de masse, facing, PDL, KPI, trame acheteur — prêts à présenter. |
>
> ## Section marqueurs (bandeau sombre `--ink`, coins 24 px)
> Titre : **« Les marqueurs qui définissent le meilleur rayon »**, sous-titre *« Le savoir-faire d'un category captain, en règles que vous pondérez. »*
> Cinq blocs translucides : **CA / cm linéaire** (*La productivité valeur — le juge de paix de l'acheteur.*) · **VMH · rotation** (*Pilote le réassort et le risque de rupture au facing.*) · **Marge / cm** (*L'argument qui fait exister MDD et nouveautés.*) · **Fair share** (*La PDL reflète la part de marché — la base d'un rayon juste et défendable.*) · **Croissance** (*Le linéaire va à ce qui monte, pas à l'historique.*)
>
> ## Section offres
> Titre **« Un tarif simple, pas de surprise »**, sous-titre *« Démo gratuite pour évaluer. Pro pour travailler sur vos données — mensuel sans engagement, ou annuel avec deux mois offerts. »*
>
> | | Démo | **Pro** (badge RECOMMANDÉ, bordure bleue) | Entreprise |
> |---|---|---|---|
> | Prix | **0 €** | **1 000 € HT/mois** | **Sur devis** |
> | Mention | catégorie fictive · sans compte | facturé 12 000 € HT/an — ou 1 200 € HT/mois sans engagement | multi-pays · équipes |
> | Inclus | 1 élément · de la ½ planche à 6 planches · Plan de masse + plan au facing · Copilote embarqué · Sur catégorie fictive | Vos données (BYOD) · **Jusqu'à 4 éléments · scénarios multiples comparés** · **Trame de présentation acheteur (PDF / .pptx)** · Copilote IA connectée · 1 pays · 3 catégories · Support expert | Multi-pays & multi-utilisateurs · Connecteurs panel & photos de rayon · SSO, environnement dédié · Onboarding & règles métier sur mesure |
> | Bouton | Essayer maintenant | Démarrer avec la démo | Nous contacter |
>
> Sous le tableau, encart ambre : *« Bêta — l'espace démo tourne sur des données 100 % fictives ; vos données restent sous votre licence. »*
>
> ## FAQ (6 questions, accordéon `<details>`, « + » qui devient « − »)
> Qu'est-ce qu'un planogramme ? · Comment calculer une part de linéaire (PDL) ? · Quel logiciel pour créer un planogramme automatiquement ? · CatPilot fonctionne-t-il avec les données Circana ou NielsenIQ ? · Combien coûte CatPilot ? · À qui s'adresse CatPilot ?
> **Conserve le JSON-LD** présent dans le `<head>` (Organization + SoftwareApplication + FAQPage) : il est aligné mot pour mot sur ces réponses. Si tu modifies une réponse, mets le JSON-LD à jour.
>
> ## Pied de page
> À gauche **« CatPilot — copilote category management · Bêta »**, à droite « Démo · Offres · contact@catpilot.fr ».
>
> ---
>
> # PARTIE B — COQUE DE L'APPLICATION
>
> Police **Aptos** (repli `"Segoe UI Variable Text","Segoe UI",system-ui`), corps **15 px**, interligne 1.5, fond `--bg`.
>
> ```css
> --ink:#0F1B2D; --ink2:#3D4B5F; --mut:#7A8699;
> --line:#E3E8EF; --line2:#EDF1F6; --bg:#F6F8FB; --card:#FFFFFF;
> --acc:#2E6BFF; --acc-d:#1E4FD0; --acc-l:#EAF0FF;
> --teal:#0E8F8A; --amber:#C77F1E; --purple:#6B4E8E; --grey:#8A94A0;
> --green:#1E8E3E; --red:#C5321C; --gold:#B98A00;
> --sh1:0 1px 2px rgba(15,27,45,.05),0 4px 14px rgba(15,27,45,.06);
> --sh2:0 2px 6px rgba(15,27,45,.08),0 12px 30px rgba(15,27,45,.10);
> ```
>
> **Barre supérieure** : marque « CatPilot » + badge « BÊTA » ; navigation à onglets **Générateur de rayon · Analyses catégorie · Données & fiabilité · Offres** (onglet actif souligné/coloré) ; à droite, l'étiquette de période **« MAT S26-2026 · France HM+SM »**, le bandeau **« DONNÉES DÉMO FICTIVES »** (à masquer dès qu'un vrai fichier est chargé), un sélecteur de thème (Plateforme · Encre & Cuivre · Éditorial · Vif) et le bouton d'ouverture du copilote.
>
> Chaque page commence par un bloc `hero` : `h1` + une phrase d'intro.
>
> ---
>
> # PARTIE C — PAGE « ANALYSES CATÉGORIE »
>
> **Titre :** « Analyses catégorie »
> **Intro :** *« Le diagnostic qui alimente le générateur — et la mesure d'uplift média selon la méthode run-rate vs période d'activation vs groupe de contrôle. »*
>
> ## Bandeau de 4 indicateurs (grille 4 colonnes)
> Chaque carte : titre en petit, **valeur en grand**, variation (vert `--green` si hausse, rouge `--red` si baisse), et une **puce « source »** au survol de laquelle apparaît le chemin exact du chiffre (fichier · onglet · période).
>
> | Indicateur | Valeur (démo) | Variation | Source affichée au survol |
> |---|---|---|---|
> | Marché catégorie | 46,2 M€ | +6,4 % vs N-1 | SELLOUT_DEMO.xlsx · DATA · MAT S26 |
> | PDM valeur client | 58,3 % | +1,8 pt | SELLOUT_DEMO.xlsx · DATA · MAT S26 |
> | Prix moyen | 9,84 € | +2,1 % | SELLOUT_DEMO.xlsx · CA÷vol · MAT |
> | DN moyenne client | 71 | −3 pts vs conc. leader | SELLOUT_DEMO.xlsx · DISTRIB |
>
> > **⚠ Point de rigueur — à traiter, pas à recopier aveuglément.** Ces quatre valeurs sont **codées en dur** dans le prototype : ce sont des données de démonstration. En production, elles doivent être **calculées depuis le fichier chargé** (marché = somme des CA du périmètre ; PDM = part de la marque désignée comme « ta marque » ; prix moyen = CA ÷ volume ; DN = moyenne pondérée). Tant qu'aucun fichier n'est chargé, affiche-les comme démo avec le bandeau « DONNÉES DÉMO FICTIVES ». **Ne publie jamais un chiffre codé en dur en le faisant passer pour une mesure.**
>
> ## Deux cartes côte à côte
>
> **« Dynamique segments — CA MAT & croissance »** : graphique à barres par segment, croissance affichée par segment, puce « source ».
>
> **« Uplift média — campagne Barbe S18-S24 »** : courbe hebdomadaire du segment médiatisé et du segment de contrôle, avec la période d'activation surlignée. Sous le graphique, un **encadré verdict** :
> *« **Uplift net ≈ +12,4 pts** : accélération barbe (21,4 % vs run-rate 8,2 %) corrigée de la dérive du contrôle (cheveux non médiatisé : 9,0 %). Formule : (21,4 − 8,2) − (9,0 − 8,2). »* + puce « calcul ».
>
> **La méthode d'analyse doit rester visible à l'écran** : c'est elle qui rend le chiffre défendable devant un acheteur. Trois éléments obligatoires : le **run-rate** (tendance avant campagne), la **période d'activation**, et le **groupe de contrôle** (un segment non médiatisé). L'uplift n'est jamais la simple croissance de la période.
>
> ---
>
> # PARTIE D — PAGE « DONNÉES & FIABILITÉ »
>
> **Titre :** « Données & fiabilité »
> **Intro :** *« Ce que la plateforme consomme pour fonctionner en autonomie — et les garde-fous natifs. Le LLM rédige ; le code calcule. »*
>
> ## Carte « Sources requises par catégorie » (tableau)
> Colonnes : Donnée · Granularité · Usage · Statut démo.
>
> | Donnée | Granularité | Usage | Statut |
> |---|---|---|---|
> | Panel sell-out (Nielsen/Circana) | EAN × enseigne × semaine · 104 sem. | CA, vol., prix, DN → scores | FICTIF CHARGÉ (vert) |
> | Sell-in ERP client | EAN × mois · unités | Contrôle volumes (jamais la valeur) | FICTIF CHARGÉ (vert) |
> | Grille marge distributeur | EAN · tarif + PVC | Marqueur marge/cm | FICTIF CHARGÉ (vert) |
> | Dimensions produits (GS1) | EAN · largeur mm | Facings réels ≠ 7,5 cm forfaitaire | **V2** (or) |
> | Photos de rayon | 1-2 / élément / magasin | Relevé existant auto + contraintes meuble | **V2** (or) |
>
> ## Carte « Garde-fous natifs » (tableau Contrôle / Statut)
> Anti-double-compte (agrégats vs composantes) — PASSÉ · Alignement des fenêtres N vs N-1 — PASSÉ · Recalcul indépendant des totaux (±0,5) — PASSÉ · Parité des facings & minimum 2/réf — ACTIF · Traçabilité chiffre → fichier·onglet·période — ACTIF.
>
> Note de bas de carte : **« Règle produit : un chiffre sans source identifiée n'est pas publié. »**
>
> > En production, ces statuts doivent refléter les **contrôles réellement exécutés sur le fichier chargé** (nombre de lignes d'agrégat écartées, échelle appliquée, références sans montant), pas des valeurs figées.
>
> ---
>
> # PARTIE E — PAGE « OFFRES » (dans l'app) + MODALE LICENCE
>
> **Titre centré :** « Des plans de rayon qui gagnent des facings »
> **Intro :** *« Espace démo gratuit pour évaluer, abonnement Pro pour travailler sur vos données — mensuel sans engagement ou annuel avec deux mois offerts. »*
>
> **Bascule de facturation** : deux onglets **Mensuel / Annuel** (Annuel actif par défaut) + pastille **« 2 mois offerts »**. Elle met à jour le prix affiché en direct (1 200 € /mois ↔ 1 000 € /mois, mention « facturé 12 000 € /an »).
>
> Trois offres, identiques à celles de la landing (Partie A). Le contenu de la Démo **doit refléter le bridage réel** : *1 élément · de la ½ planche à 6 planches · Plan de masse + plan au facing · Copilote embarqué*, avec **« Trame de présentation acheteur »**, « Vos données (upload actif) » et « Export .pptx / .xlsx » **barrés** (non inclus).
>
> Note de bas de page : *« Bêta : l'activation et le paiement (Stripe) seront branchés côté serveur. »*
>
> **Modale « Activer une licence Pro »** : fond assombri, carte blanche 420 px, texte *« Saisis ta clé (format XXXX-XXXX). En bêta : la clé **DEMO-PRO** active la simulation. »*, champ + bouton « Activer », zone de retour sous le champ. Fermeture au clic sur le fond.
> En production, cette modale est remplacée par le **parcours d'abonnement Stripe** ; le statut Pro vient du serveur, jamais d'une clé saisie côté navigateur.
>
> ---
>
> # PARTIE F — COPILOTE (tiroir latéral)
>
> Ouvert par le bouton de la barre supérieure, glisse depuis la droite.
> - En-tête : **« Discussion — copilote catégorie »**, sous-titre *« Ancré sur ton plan en cours · réponses traçables »*, badge de mode (**IA EMBARQUÉE** en démo / **IA CONNECTÉE** en Pro), bouton de fermeture.
> - Fil de discussion, puis **suggestions cliquables** contextuelles.
> - Champ de saisie : *« Pose ta question ou donne un ordre… »* + bouton d'envoi.
> - Le copilote doit pouvoir **agir sur le plan** (modifier une pondération, régénérer), pas seulement répondre.
> - En Pro, l'IA connectée passe par une **route serveur** ; la clé API ne doit jamais apparaître côté navigateur.
>
> ---
>
> ## Critères d'acceptation (montre-les-moi)
> 1. La landing s'affiche en premier ; « Ouvrir la démo » bascule vers l'application sans rechargement ; un lien « ← Accueil » revient à la landing.
> 2. La landing utilise Bricolage Grotesque + Inter ; l'application utilise Aptos. Les deux identités coexistent.
> 3. Les 4 onglets de l'application changent de page et l'onglet actif est visuellement marqué.
> 4. Page Analyses : les 4 indicateurs s'affichent avec leur puce « source » au survol, et l'encadré d'uplift média montre la formule.
> 5. Page Données : les deux tableaux s'affichent avec les statuts colorés (vert = passé/actif, or = V2).
> 6. Page Offres : la bascule Mensuel/Annuel change le prix en direct ; la Démo montre bien la trame comme **non incluse**.
> 7. La modale licence s'ouvre, accepte `DEMO-PRO`, et débloque 4 éléments + la trame.
> 8. Le copilote s'ouvre et se ferme, et affiche son badge de mode.
> 9. En dessous de 960 px, tout passe en une colonne et reste utilisable.
>
> **Commence par la Partie A (landing) et attends ma validation avant la Partie B.**

---

## Récapitulatif des documents

| Document | Couvre |
|---|---|
| `PROMPT_FLOW_UX_CatPilot.md` | Le parcours : dépôt du fichier → animation → confirmation → wizard 5 étapes → plan généré → trame |
| **`PROMPT_UI_COMPLET_CatPilot.md`** (ce document) | Landing, coque de l'app, pages Analyses / Données / Offres, modale licence, copilote |
| `PROMPT_CLAUDE_CODE_CatPilot.md` | La partie technique : Next.js, Supabase, Stripe, proxy IA, déploiement |

Donne les trois à Claude Code, mais fais-lui traiter **un écran à la fois**, avec validation entre chaque. C'est ce qui évite la dérive visuelle.
