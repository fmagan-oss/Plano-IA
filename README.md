# CatPilot

Le category management assisté : d'un export panel (Nielsen / Circana) à un
**plan de masse**, un **planogramme au facing** et une **trame de présentation
acheteur**, en quelques secondes. SaaS complet : comptes, abonnements Stripe,
déblocage Pro, copilote IA — **aucun secret côté navigateur**.

Stack : **Next.js (App Router) + TypeScript**, **Supabase** (auth + Postgres),
**Stripe** (Billing + Checkout + Portal + webhooks + Tax), **Anthropic**
(copilote IA via proxy serveur). Déployable sur **Vercel**.

---

## État d'avancement

- [x] **M1 — Application & scaffold** : landing `/`, app `/app` (upload Excel/CSV
  SheetJS, plan de masse, planogramme au facing, blocs marque, nouveautés,
  4 variantes, copilote déterministe).
- [x] **M2 — Auth Supabase** (magic link) : `/login`, `/auth/callback`,
  `/app` protégé, table `profiles` + RLS + trigger.
- [x] **M3 — Paiements Stripe** : 3 offres (Démo / Pro Mensuel 1 200 € HT /
  Pro Annuel 12 000 € HT), Checkout (mode abonnement, `client_reference_id` =
  user id), **Stripe Tax** + collecte n° TVA, Customer Portal, webhook
  `/api/stripe/webhook` **à signature vérifiée** et **idempotent**.
- [x] **M4 — Déblocage Pro réel** : plus de simulation client ; le statut vient
  de la session serveur (profil Supabase, miroir de Stripe). Injecté au
  chargement de `/app`. Free = 1 variante + trame verrouillée ; Pro = 4
  variantes + trame.
- [x] **M5 — Proxy IA** : `/api/copilot` appelle Anthropic avec
  `ANTHROPIC_API_KEY` (**serveur uniquement**), re-vérifie le statut Pro côté
  serveur, rate-limit par utilisateur. Free garde le copilote déterministe.
- [x] **M6 — Déploiement** : `robots.txt` + `sitemap.xml`, variables d'env
  documentées, prêt pour Vercel + webhook Stripe prod.
- [x] **M7 — Sièges nominatifs & espace de travail** :
  - Tarification **par siège** (quantity Stripe) : Pro 149 € HT/siège/mois ou
    1 490 € HT/siège/an ; pack Team = 10 sièges (1 200 € HT/mois) ; Enterprise
    sur devis. Montants à valider avec des prospects avant publication.
  - **Sièges nominatifs** anti-partage : 1 siège = 1 personne (e-mail
    personnel, magic link). Le titulaire invite/retire les membres depuis
    « Mon compte » ; quota appliqué côté serveur ; les membres héritent du Pro
    (RPC `my_team_owner_pro`, security definer).
  - **« Mes présentations »** : chaque analyse (données + réglages) peut être
    enregistrée et rouverte à l'identique (`/presentations`, RLS par
    utilisateur).
  - **Export PowerPoint & PDF (Pro)** : génération d'un vrai `.pptx` 4 diapos
    (titre, plan de masse, planogramme dessiné, trame acheteur) côté
    navigateur via pptxgenjs — aucune donnée ne quitte le poste ; export PDF
    via mise en page d'impression dédiée. La trame verrouillée (démo) est
    exclue de l'impression.
  - Migration : `supabase/migrations/0003_seats_presentations.sql`.

> **Sécurité (vérifié)** : `grep` du bundle client → aucun secret serveur
> (Anthropic, Stripe, service_role, webhook). Seules les clés publiques
> `NEXT_PUBLIC_*` Supabase apparaissent. La source de vérité du statut =
> Stripe → miroir Supabase (via webhook) → l'UI ne fait que refléter.

---

## Démarrer en local

```bash
npm install
cp .env.local.example .env.local   # puis renseignez les valeurs
npm run dev                         # http://localhost:3000
```

Sans variables d'environnement, l'app reste **démoable** : `/app` est ouverte,
et vous pouvez charger le jeu d'exemple. Les protections (auth, paiements, IA)
s'activent automatiquement dès que les clés sont renseignées.

Pour prévisualiser les fonctionnalités Pro en local sans abonnement Stripe :
`NEXT_PUBLIC_DEV_FORCE_PRO=1` dans `.env.local` (à laisser vide en prod).

---

## Configuration des services (à faire de votre côté)

### 1. Supabase (M2)
1. Créez un projet sur [supabase.com](https://supabase.com).
2. *SQL Editor* → exécutez `supabase/migrations/0001_profiles.sql` puis
   `supabase/migrations/0002_stripe_events.sql`.
3. *Authentication → URL Configuration* : Site URL `http://localhost:3000`,
   Redirect URL `http://localhost:3000/auth/callback` (+ vos URLs de prod).
4. *Project Settings → API* : renseignez `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Stripe (M3)
1. Mode **test**. Créez 2 prix récurrents **par siège** (HT) : 149 €/mois et
   1 490 €/an. Copiez les `price_...` dans `STRIPE_PRICE_PRO_MONTHLY` /
   `STRIPE_PRICE_PRO_YEARLY`. Le nombre de sièges est la quantité Stripe
   (modifiable via le Customer Portal — activez-y la modification de quantité).
2. *Developers → API keys* → `STRIPE_SECRET_KEY` (`sk_test_...`).
3. Activez **Stripe Tax** (*Settings → Tax*).
4. Webhook (local) : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   → copiez le `whsec_...` dans `STRIPE_WEBHOOK_SECRET`. Événements traités :
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`.

### 3. Anthropic (M5)
- [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY`.
  Modèle par défaut : `claude-opus-4-8` (override via `ANTHROPIC_MODEL`).

### 4. Vercel (M6)
1. Importez le repo, ajoutez toutes les variables d'env (voir
   `.env.local.example`) + `NEXT_PUBLIC_SITE_URL` = votre domaine.
2. Créez un webhook Stripe **de prod** vers
   `https://VOTRE-DOMAINE/api/stripe/webhook`, mettez le nouveau `whsec_...`.
3. Ajoutez les Redirect URLs de prod dans Supabase.
4. Basculez Stripe en **live** une fois le cycle test validé.

---

## Critères d'acceptation

1. Visiteur non connecté → landing ; `/app` redirige vers `/login` (307). ✅
2. Connexion magic link → profil créé. ✅
3. Achat Pro (carte test) → webhook → `plan=pro` → `/app` : 4 variantes +
   trame débloquées. ✅ (cycle à valider avec vos clés Stripe)
4. Résiliation via Customer Portal → webhook → retour `free` → bridage
   réappliqué. ✅
5. `/api/copilot` répond ; la clé Anthropic n'apparaît nulle part côté client. ✅
6. `grep` du bundle client : aucune clé secrète. ✅

---

## Architecture

```
app/
  layout.tsx            Layout + header commun
  page.tsx             Landing (/) — offres branchées sur Stripe Checkout
  app/page.tsx         Application (/app) — protégée, injecte le statut Pro serveur
  compte/page.tsx      Compte (/compte) — statut, Checkout, Customer Portal
  login/page.tsx       Connexion magic link
  auth/callback        Échange code → session (PKCE)
  auth/signout         Déconnexion
  api/
    stripe/checkout    Crée une session Checkout (abonnement)
    stripe/portal      Ouvre le Customer Portal
    stripe/webhook     Webhook signé + idempotent → miroir Supabase
    copilot            Proxy IA Anthropic (clé serveur, Pro revérifié)
  components/          Header, CatPilotApp, PlanogramView, PlanDeMasse,
                       BuyerFrame, Copilot, BillingButtons
  lib/
    parse.ts           Lecture Excel/CSV + détection colonnes (SheetJS)
    planogram.ts       Allocation facings, variantes, trame, copilote déterministe
    stripe.ts          Client Stripe serveur
    stripe-sync.ts     Miroir abonnement → profil
    profile.ts         Profil + entitlement Pro
    supabase/          Clients navigateur / serveur / admin (service role)
middleware.ts          Refresh de session Supabase
supabase/migrations/   0001_profiles.sql, 0002_stripe_events.sql
```

### Logique d'allocation
Chaque variante pondère les références (Équilibré = 45 % CA + 35 % volume +
20 % marge ; Rotation = volume ; Marge = marge ; CA = chiffre d'affaires),
répartit les facings par plus fort reste, garde les blocs marques contigus et
remonte les nouveautés au niveau des yeux.

> ⚠️ Avant la prod : la dépendance `xlsx` (SheetJS) npm a des avis de sécurité
> connus — basculer vers la distribution officielle SheetJS. Le rate-limit du
> proxy IA est en mémoire (par instance) — à remplacer par un store partagé
> (ex. Upstash Redis) en multi-instance.
