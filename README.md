# CatPilot

Le category management assisté : d'un export panel (Nielsen / Circana) à un
**plan de masse**, un **planogramme au facing** et une **trame de présentation
acheteur**, en quelques secondes.

Application **Next.js (App Router) + TypeScript**, pensée pour devenir un SaaS
déployé sur Vercel (auth Supabase, paiements Stripe, proxy IA Anthropic).

---

## État d'avancement (jalons)

- [x] **M1 — Intégration & application** *(livré)*
  - Scaffold Next.js + TypeScript.
  - Landing page premium sur `/`.
  - Application CatPilot sur `/app` : upload Excel/CSV (SheetJS), détection
    automatique des colonnes, génération plan de masse + planogramme au facing
    + trame acheteur, blocs par marque, détection des nouveautés, 4 variantes
    stratégiques (Équilibré / Rotation / Marge / CA), copilote déterministe.
  - Bridage Pro **simulé** (`window.PRO` / toggle « Simuler Pro » dans le
    header) : démo = 1 variante + trame verrouillée ; pro = 4 variantes + trame.
- [ ] **M2 — Authentification (Supabase, magic link)**
- [ ] **M3 — Paiements (Stripe Billing + Checkout + Portal + webhooks + Tax)**
- [ ] **M4 — Déblocage Pro réel (session serveur remplace la simulation)**
- [ ] **M5 — Proxy IA `/api/copilot` (clé Anthropic côté serveur)**
- [ ] **M6 — Déploiement Vercel + robots/sitemap + domaine**

> Le bridage actuel est une **simulation côté client** (toggle dans le header).
> Il sera remplacé en M4 par l'entitlement réel issu de la session serveur.
> **Aucun secret n'est présent dans le code** à ce stade.

---

## Démarrer en local

```bash
npm install
npm run dev       # http://localhost:3000
# ou build de production :
npm run build && npm run start
```

- `/` — landing page + offres (Démo / Pro Mensuel 1 200 € HT / Pro Annuel 12 000 € HT).
- `/app` — l'application. Cliquez sur **« Charger le jeu d'exemple »** pour un
  aperçu immédiat sans fichier, ou importez votre propre export.

### Format de fichier attendu

Excel (`.xlsx`, `.xls`) ou CSV. Les colonnes sont détectées automatiquement
(insensible à la casse et aux accents) parmi ces intitulés :

| Champ | Intitulés reconnus (exemples) |
|---|---|
| Marque | marque, brand, fabricant, fournisseur |
| Produit | produit, référence, libellé, sku, ean |
| Segment | segment, sous-segment, catégorie, famille |
| CA | ca, chiffre d'affaires, ventes valeur, value |
| Volume | volume, unités, quantité, units |
| Marge | marge, margin, taux de marge |
| Prix | prix, price, pvc |
| Nouveauté | nouveauté, nouveau, new, innovation |

Au minimum, une colonne **marque** ou **produit** est nécessaire.

---

## Architecture

```
app/
  layout.tsx            Layout racine, header commun, provider Pro
  page.tsx             Landing page (/)
  app/page.tsx         Application (/app)
  providers.tsx        ProProvider (simulation window.PRO — remplacé en M4)
  globals.css          Design system
  components/
    Header.tsx          Header commun (logo, nav, état de session simulé)
    CatPilotApp.tsx     Orchestrateur de l'app (upload, variantes, gating)
    PlanDeMasse.tsx     Plan de masse (répartition linéaire par marque)
    PlanogramView.tsx   Planogramme au facing (niveaux, blocs marque)
    BuyerFrame.tsx      Trame de présentation acheteur (Pro)
    Copilot.tsx         Copilote déterministe + teaser IA connectée (Pro, M5)
  lib/
    types.ts            Types du domaine
    parse.ts            Lecture Excel/CSV + détection de colonnes (SheetJS)
    planogram.ts        Allocation de facings, variantes, trame, copilote
    brands.ts           Couleurs de marque déterministes
    sample.ts           Jeu de données d'exemple (rayon énergisants)
```

### Logique d'allocation

Chaque variante pondère les références différemment puis répartit les facings
par **plus fort reste** (largest-remainder), avec un minimum d'un facing par
référence et un bonus de présence pour les nouveautés :

- **Équilibré** : 45 % CA + 35 % volume + 20 % marge.
- **Rotation** : volume (unités).
- **Marge** : contribution marge.
- **CA** : chiffre d'affaires.

Les références sont ensuite posées en **blocs marques contigus**, best-sellers
en tête, nouveautés remontées vers le **niveau des yeux**.

---

## Prochaines étapes (avant M2)

Pour M2 (auth Supabase), il faudra préparer :

- un **projet Supabase** (URL, clé `anon`, clé `service_role`) ;
- puis M3 : un **compte Stripe** (mode test) et M5 : une **clé API Anthropic**.

Tous ces secrets iront dans des **variables d'environnement serveur uniquement**
(jamais dans le bundle client). Un fichier `.env.local.example` sera ajouté au
jalon correspondant.

> ⚠️ Note sécurité : la dépendance `xlsx` (SheetJS) publiée sur npm présente des
> avis de sécurité connus. Avant la mise en production (M6), on basculera vers la
> distribution officielle SheetJS ou une alternative maintenue.
