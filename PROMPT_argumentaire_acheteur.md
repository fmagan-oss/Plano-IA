# CatPilot — Argumentaire acheteur par Claude (circuit fermé)

> Objectif : transformer le plan **calculé** par CatPilot en **argumentaire de revue de gamme**,
> en t'appuyant sur l'IA de Claude — **sans construire d'IA**, sans serveur, sans coût par analyse.
>
> Principe (ta règle d'or) : **le code calcule, Claude rédige.** Le plan (facings, part de
> linéaire, KPI) sort de CatPilot et reste vérifiable. Claude n'invente aucun chiffre : il
> n'utilise que ce que tu lui donnes et **signale ce qui manque** au lieu de le combler.

---

## Étape 1 — Exporter depuis CatPilot (3 blocs à coller)

1. **Le plan au facing** — étape *« Le plan »* → **« Extraire le plan au facing (CSV) »**
   (position ; référence ; EAN ; marque ; facings ; cm).
2. **Les tableaux de justification** — étape *« L'analyse »* → bouton **Excel** (ou copie) de chaque
   tableau : fair share par marque, fair share par segment, productivité au cm, détail par réf,
   arbitrages.
3. **Les KPI marché** — page *« Analyses catégorie »* : marché lu, PDM de ta marque, prix moyen
   pondéré, croissance, périmètre (réf. & marques).

Puis **une ligne de contexte** : enseigne, catégorie, période, et ta marque cliente.

---

## Étape 2 — Le prompt (à copier tel quel dans Claude)

```
Tu es category manager pour un industriel PGC qui prépare une revue de gamme face à un
acheteur d'enseigne. À partir UNIQUEMENT des données ci-dessous (plan au facing, tableaux
de fair share, KPI marché, contexte), rédige l'argumentaire acheteur en cinq temps :

  1. Le marché & le conso       — la photo du marché et ce qui bouge
  2. L'ambition                 — où on veut amener le rayon, chiffré
  3. Ce qui change              — les mouvements de facings, bloc par bloc
  4. Les bénéfices              — pour le conso ET pour le magasin (CA/cm, rotation, marge)
  5. La décision                — ce qu'on demande à l'acheteur de valider

Règles STRICTES :
- N'utilise que les chiffres fournis. Ne devine, n'extrapole, n'arrondis AUCUNE valeur absente.
- Si une donnée manque pour étayer un point, écris-le explicitement (« donnée non fournie »)
  plutôt que de l'inventer.
- Chaque affirmation chiffrée doit être traçable à une ligne des données fournies.
- Distingue ce qui est MESURÉ (dans les données) de ce qui est une PROJECTION ou un avis.
- Pas de part de marché « 100 % » sans concurrent identifié ; pas de conclusion « mono-marque »
  si la marque n'est simplement pas renseignée.

Format : cinq sections courtes, à puces, prêtes à dérouler. Termine par
« Points où l'acheteur peut challenger » : 2 à 3 limites honnêtes du dossier.

=== CONTEXTE ===
[colle ta ligne de contexte]

=== PLAN AU FACING (CSV) ===
[colle le CSV]

=== FAIR SHARE & PRODUCTIVITÉ ===
[colle les tableaux]

=== KPI MARCHÉ ===
[colle les KPI de la page Analyses]
```

---

## Étape 3 — Exemple (sur les données de démonstration)

**Contexte collé :** Enseigne HM+SM France · catégorie Coloration homme · MAT S26-2026 · marque cliente KolorMen.
**Fair share collé (extrait) :** KolorMen 10 réf / 50 facings / PDL 73,5 % vs PDM 70,3 % (indice 105) ·
Grizzly 2 réf / 6 facings / PDL 8,8 % vs PDM 14,7 % (indice 60, sous-pondéré) · GX-One PDL 8,8 % vs
PDM 7,1 % (indice 124) · MDD PDL 5,9 % vs PDM 6,3 % (indice 93) · InstaTouch PDL 2,9 % vs PDM 1,6 %.
Total 68 facings / 510 cm.

**Ce que Claude produit alors (abrégé) :**

> **1. Le marché & le conso.** Catégorie coloration homme ; votre marque KolorMen pèse 70,3 % de
> PDM valeur sur le périmètre lu. *(Croissance et prix moyen : à compléter depuis la page Analyses —
> non fournis ici.)*
> **2. L'ambition.** Un rayon aligné sur le poids réel des marques : part de linéaire ≈ part de
> marché, ajustée des dynamiques.
> **3. Ce qui change.** On **renforce Grizzly** (sous-pondéré : PDL 8,8 % pour 14,7 % de PDM, indice
> 60) et on **tient KolorMen** légèrement au-dessus de son poids (indice 105) au titre du rôle de
> locomotive. InstaTouch et GX-One restent en sur-indice assumé (nouveautés / dynamique).
> **4. Les bénéfices.** Un linéaire plus juste limite le risque de rupture sur Grizzly et crédibilise
> le rayon côté acheteur ; la productivité au cm *(détail : tableau fourni)* arbitre les derniers facings.
> **5. La décision.** Valider le passage de Grizzly à un indice plus proche de 100, à linéaire
> constant (68 facings / 510 cm).
>
> **Points où l'acheteur peut challenger :** (a) l'indice 105 de KolorMen reste au-dessus de son
> poids — à défendre par le rôle de trafic ; (b) la croissance par marque n'est pas dans l'export,
> donc l'arbitrage « dynamique » est à étayer ; (c) PDM volume vs valeur non comparée ici.

👉 On voit le mécanisme : Claude **argumente** à partir des chiffres de CatPilot, **ne comble pas**
les trous (il les nomme), et laisse l'acheteur vérifier chaque chiffre dans l'export.

---

## Pourquoi c'est crédible en revue (et « gratuit »)

- **Les chiffres ne sont jamais générés par l'IA** : ils viennent du moteur déterministe de CatPilot,
  traçables à la source. Claude ne fait que la lecture et la mise en récit.
- **Circuit fermé** : rien ne part vers un produit tiers ; aucun appel d'API facturé ; aucune infra.
- **Coût** : pas de coût marginal par analyse. Seule condition — toi (et chaque collègue qui l'utilise)
  avoir un accès Claude. Ce n'est pas littéralement 0 €, c'est « zéro dev d'IA, zéro facture par plan ».
- **Confidentialité** : avant d'y coller de vraies données panel (licence Circana/Nielsen du client),
  vérifier que la licence autorise de les passer dans un outil d'IA. À cadrer, pas un blocage.
