'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Locale = 'fr' | 'en';

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: 'fr',
  setLocale: () => {},
});

/** Persists the visitor's language choice (localStorage). Default: French. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  useEffect(() => {
    const saved = window.localStorage.getItem('catpilot.locale');
    if (saved === 'en' || saved === 'fr') setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    window.localStorage.setItem('catpilot.locale', l);
    document.documentElement.lang = l;
  }

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

/* ------------------------------------------------------------------ */
/* UI dictionaries                                                     */
/* ------------------------------------------------------------------ */

export const T = {
  fr: {
    nav: { home: 'Accueil', offers: 'Offres', app: 'Application', pres: 'Mes présentations' },
    header: { signin: 'Se connecter', signout: 'Se déconnecter', free: 'Gratuit', pro: 'Pro' },
    landing: {
      eyebrow: 'Category management assisté',
      h1a: 'Du fichier panel au ',
      h1b: 'planogramme au facing',
      h1c: ', en quelques secondes.',
      sub: 'CatPilot lit vos exports Nielsen / Circana et génère automatiquement le plan de masse, le planogramme au facing et la trame de présentation acheteur. Blocs par marque, détection des nouveautés, 4 variantes stratégiques.',
      ctaDemo: 'Ouvrir la démo',
      ctaOffers: 'Voir les offres',
      note: 'Aucune installation. Importez un Excel/CSV, ou testez avec le jeu d’exemple.',
      windowTitle: 'Planogramme — Rayon Énergisants',
      featuresTitle: 'Ce que CatPilot produit pour vous',
      featuresSub: 'Trois livrables prêts à présenter, à partir d’un seul fichier.',
      features: [
        { title: 'Plan de masse', text: 'Répartition du linéaire par marque et segment, alignée sur le poids marché (CA, volume, marge).' },
        { title: 'Planogramme au facing', text: 'Placement rayon par niveaux, blocs marques homogènes, nouveautés remontées au niveau des yeux.' },
        { title: 'Trame acheteur', text: 'Une présentation structurée — synthèse catégorie, moves clés, impact attendu — prête pour le rendez-vous.' },
      ],
      howTitle: 'Comment ça marche',
      howSub: 'Le workflow d’un category manager, automatisé.',
      steps: [
        { title: 'Importez votre panel', text: 'Excel ou CSV Nielsen/Circana. CatPilot détecte automatiquement les colonnes (marque, EAN, CA, volume, marge, nouveauté).' },
        { title: 'Choisissez une stratégie', text: 'Équilibré, Rotation, Marge ou CA. Chaque variante réalloue le facing selon votre objectif.' },
        { title: 'Générez et présentez', text: 'Plan de masse, planogramme et trame acheteur, prêts à exporter et à défendre en rendez-vous enseigne.' },
      ],
      pricingTitle: 'Offres',
      pricingSub: 'Tarification par siège nominatif. Tarifs HT — facturation B2B conforme (TVA intracommunautaire, autoliquidation UE).',
      demoPlan: { name: 'Démo', price: '0 €', period: '/ toujours', features: ['Import Excel / CSV', 'Plan de masse + planogramme', '1 variante stratégique', 'Trame acheteur verrouillée', 'Copilote déterministe embarqué'], cta: 'Essayer la démo' },
      proPlan: { ribbon: 'Le plus choisi', name: 'Pro', price: '149 €', period: 'HT / siège / mois', features: ['Tout de la Démo, plus :', '4 variantes (Équilibré / Rotation / Marge / CA)', 'Trame acheteur + espace « Mes présentations »', 'Copilote IA connecté', 'Siège nominatif — 1 personne par siège', 'Annuel : 1 490 € HT / siège (2 mois offerts)'], cta: 'Passer en Pro' },
      yearPlan: { name: 'Team', price: '1 200 €', period: 'HT / mois — 10 sièges', features: ['Tout du Pro', '10 sièges nominatifs inclus (120 €/siège)', 'Facturation centralisée', 'Support prioritaire'], cta: 'Choisir Team' },
      enterprise: { title: 'Gros comptes / virement sur facture', text: 'Offre annuelle sur devis, réglable par virement. Pas de carte imposée : nous établissons une facture conforme à votre process achats.', cta: 'Demander un devis' },
      ctaBandTitle: 'Prêt à construire votre prochain rayon ?',
      ctaBandText: 'Importez un fichier ou lancez le jeu d’exemple — vous avez un planogramme en moins d’une minute.',
      ctaBandBtn: 'Ouvrir l’application',
    },
    login: {
      title: 'Se connecter à CatPilot',
      sub: 'Entrez votre e-mail : nous vous envoyons un lien de connexion sécurisé (magic link), sans mot de passe.',
      emailLabel: 'Adresse e-mail professionnelle',
      submit: 'Recevoir mon lien de connexion',
      sending: 'Envoi…',
      sentTitle: 'Vérifiez votre boîte mail',
      sentText: (email: string) => `Un lien de connexion a été envoyé à ${email}. Cliquez dessus pour accéder à l’application.`,
      other: 'Utiliser une autre adresse',
      back: '← Retour à l’accueil',
      error: 'Une erreur est survenue.',
    },
    app: {
      title: 'Application CatPilot',
      sub: 'Générateur de planogrammes au facing à partir d’un export panel.',
      demo: 'Démo',
      pro: 'Pro',
      upTitle: 'Importez votre export panel',
      upText: 'Glissez un fichier Excel/CSV (Nielsen, Circana…) ou parcourez vos fichiers.',
      upBtn: 'Choisir un fichier',
      upSample: 'Charger le jeu d’exemple',
      upBusy: 'Lecture…',
      upFormats: 'Colonnes reconnues automatiquement : marque, EAN/gencod, libellé produit, segment, CA, volume, marge, prix, nouveauté.',
      dsRefs: (n: number, b: number, nov: number) => `${n} références · ${b} marques · ${nov} nouveauté(s)`,
      shelves: 'Niveaux',
      facingsPerShelf: 'Facings/niveau',
      changeFile: 'Changer de fichier',
      mapping: 'Colonnes détectées dans le fichier',
      notDetected: 'non détectée',
      lockTitle: 'Variante réservée au Pro',
      lockText: 'La démo donne accès à 1 variante. Passez en Pro pour comparer les 4 stratégies (Équilibré, Rotation, Marge, CA) et débloquer la trame acheteur.',
      lockCta: 'Passer en Pro',
      masse: 'Plan de masse',
      masseSub: 'Répartition du linéaire par marque',
      thBrand: 'Marque', thRefs: 'Réf.', thFacings: 'Facings', thShare: '% linéaire', thRev: '% CA', thGap: 'Écart',
      masseHelp: '« Écart » = part de linéaire − part de CA. Un écart positif signale une marque sur-facée vs son poids commercial ; négatif, une opportunité de gagner du linéaire.',
      copilot: 'Copilote', copilotSub: 'Lecture automatique du rayon',
      copilotAi: 'Copilote IA connecté',
      copilotLocked: 'Posez vos questions à un copilote IA connecté à vos données (analyse, argumentaire acheteur).',
      copilotUnlock: 'Débloquer avec Pro',
      copilotPlaceholder: 'Ex. Comment défendre la nouveauté Prime face à l’acheteur ?',
      copilotAsk: 'Demander',
      plano: 'Planogramme au facing',
      planoMeta: (f: number, s: number) => `${f} facings · ${s} niveaux`,
      shelfEmpty: '— espace libre —',
      trame: 'Trame de présentation acheteur',
      trameLockTitle: 'Trame acheteur réservée au Pro',
      trameLockText: 'Débloquez la trame de présentation prête à défendre en rendez-vous enseigne, et les 4 variantes stratégiques.',
      trameEyebrow: 'Synthèse catégorie',
      trameMoves: 'Moves clés', trameNov: 'Nouveautés', trameImpact: 'Impact attendu',
      save: 'Enregistrer', saving: 'Enregistrement…', savedOk: 'Enregistré ✓', saveError: 'Échec de l’enregistrement.',
      savePrompt: 'Nom de la présentation :',
    },
    pres: {
      title: 'Mes présentations',
      sub: 'Toutes vos analyses sauvegardées — rouvrez-les à l’identique en un clic.',
      empty: 'Aucune présentation enregistrée pour l’instant. Dans l’application, cliquez sur « Enregistrer » après avoir généré un planogramme.',
      open: 'Ouvrir', del: 'Supprimer',
      savedOn: (d: string) => `Enregistrée le ${d}`,
      appLink: 'Ouvrir l’application',
    },
    footer: { tagline: 'Category management assisté.', contact: 'Contact' },
  },
  en: {
    nav: { home: 'Home', offers: 'Pricing', app: 'App', pres: 'My presentations' },
    header: { signin: 'Sign in', signout: 'Sign out', free: 'Free', pro: 'Pro' },
    landing: {
      eyebrow: 'Assisted category management',
      h1a: 'From panel file to ',
      h1b: 'facing-level planogram',
      h1c: ', in seconds.',
      sub: 'CatPilot reads your Nielsen / Circana exports and automatically generates the space plan, the facing-level planogram and the buyer presentation deck. Brand blocking, new-product detection, 4 strategic variants.',
      ctaDemo: 'Open the demo',
      ctaOffers: 'See pricing',
      note: 'No install. Import an Excel/CSV file, or try the sample dataset.',
      windowTitle: 'Planogram — Energy drinks aisle',
      featuresTitle: 'What CatPilot produces for you',
      featuresSub: 'Three ready-to-present deliverables, from a single file.',
      features: [
        { title: 'Space plan', text: 'Shelf-space split by brand and segment, aligned with market weight (value, volume, margin).' },
        { title: 'Facing-level planogram', text: 'Shelf-by-shelf placement, consistent brand blocks, new products raised to eye level.' },
        { title: 'Buyer deck', text: 'A structured presentation — category summary, key moves, expected impact — ready for the meeting.' },
      ],
      howTitle: 'How it works',
      howSub: 'A category manager’s workflow, automated.',
      steps: [
        { title: 'Import your panel', text: 'Nielsen/Circana Excel or CSV. CatPilot auto-detects columns (brand, EAN, value, volume, margin, novelty).' },
        { title: 'Pick a strategy', text: 'Balanced, Rotation, Margin or Value. Each variant reallocates facings to your objective.' },
        { title: 'Generate and present', text: 'Space plan, planogram and buyer deck, ready to export and defend with the retailer.' },
      ],
      pricingTitle: 'Pricing',
      pricingSub: 'Per-named-seat pricing. Prices excl. VAT — compliant B2B invoicing (EU VAT, reverse charge).',
      demoPlan: { name: 'Demo', price: '€0', period: '/ forever', features: ['Excel / CSV import', 'Space plan + planogram', '1 strategic variant', 'Buyer deck locked', 'Built-in deterministic copilot'], cta: 'Try the demo' },
      proPlan: { ribbon: 'Most popular', name: 'Pro', price: '€149', period: 'excl. VAT / seat / month', features: ['Everything in Demo, plus:', '4 variants (Balanced / Rotation / Margin / Value)', 'Buyer deck + “My presentations” space', 'Connected AI copilot', 'Named seat — 1 person per seat', 'Yearly: €1,490 excl. VAT / seat (2 months free)'], cta: 'Go Pro' },
      yearPlan: { name: 'Team', price: '€1,200', period: 'excl. VAT / month — 10 seats', features: ['Everything in Pro', '10 named seats included (€120/seat)', 'Centralized billing', 'Priority support'], cta: 'Choose Team' },
      enterprise: { title: 'Key accounts / pay by bank transfer', text: 'Yearly plan on quote, payable by transfer. No card required: we issue an invoice that fits your procurement process.', cta: 'Request a quote' },
      ctaBandTitle: 'Ready to build your next aisle?',
      ctaBandText: 'Import a file or load the sample dataset — you’ll have a planogram in under a minute.',
      ctaBandBtn: 'Open the app',
    },
    login: {
      title: 'Sign in to CatPilot',
      sub: 'Enter your email: we’ll send you a secure sign-in link (magic link), no password needed.',
      emailLabel: 'Work email address',
      submit: 'Send me a sign-in link',
      sending: 'Sending…',
      sentTitle: 'Check your inbox',
      sentText: (email: string) => `A sign-in link has been sent to ${email}. Click it to open the app.`,
      other: 'Use another address',
      back: '← Back to home',
      error: 'Something went wrong.',
    },
    app: {
      title: 'CatPilot App',
      sub: 'Facing-level planogram generator from a panel export.',
      demo: 'Demo',
      pro: 'Pro',
      upTitle: 'Import your panel export',
      upText: 'Drop an Excel/CSV file (Nielsen, Circana…) or browse your files.',
      upBtn: 'Choose a file',
      upSample: 'Load the sample dataset',
      upBusy: 'Reading…',
      upFormats: 'Auto-detected columns: brand, EAN/barcode, product label, segment, value, volume, margin, price, novelty.',
      dsRefs: (n: number, b: number, nov: number) => `${n} SKUs · ${b} brands · ${nov} new product(s)`,
      shelves: 'Shelves',
      facingsPerShelf: 'Facings/shelf',
      changeFile: 'Change file',
      mapping: 'Columns detected in the file',
      notDetected: 'not detected',
      lockTitle: 'Pro-only variant',
      lockText: 'The demo gives access to 1 variant. Go Pro to compare all 4 strategies (Balanced, Rotation, Margin, Value) and unlock the buyer deck.',
      lockCta: 'Go Pro',
      masse: 'Space plan',
      masseSub: 'Shelf-space split by brand',
      thBrand: 'Brand', thRefs: 'SKUs', thFacings: 'Facings', thShare: '% of shelf', thRev: '% of value', thGap: 'Gap',
      masseHelp: '“Gap” = shelf share − value share. A positive gap flags an over-faced brand vs its commercial weight; a negative one, an opportunity to gain space.',
      copilot: 'Copilot', copilotSub: 'Automatic aisle read-out',
      copilotAi: 'Connected AI copilot',
      copilotLocked: 'Ask questions to an AI copilot connected to your data (analysis, buyer arguments).',
      copilotUnlock: 'Unlock with Pro',
      copilotPlaceholder: 'E.g. How do I defend the Prime novelty to the buyer?',
      copilotAsk: 'Ask',
      plano: 'Facing-level planogram',
      planoMeta: (f: number, s: number) => `${f} facings · ${s} shelves`,
      shelfEmpty: '— free space —',
      trame: 'Buyer presentation deck',
      trameLockTitle: 'Buyer deck is Pro-only',
      trameLockText: 'Unlock the ready-to-defend presentation deck and the 4 strategic variants.',
      trameEyebrow: 'Category summary',
      trameMoves: 'Key moves', trameNov: 'New products', trameImpact: 'Expected impact',
      save: 'Save', saving: 'Saving…', savedOk: 'Saved ✓', saveError: 'Save failed.',
      savePrompt: 'Presentation name:',
    },
    pres: {
      title: 'My presentations',
      sub: 'All your saved analyses — reopen them identically in one click.',
      empty: 'No saved presentation yet. In the app, click “Save” after generating a planogram.',
      open: 'Open', del: 'Delete',
      savedOn: (d: string) => `Saved on ${d}`,
      appLink: 'Open the app',
    },
    footer: { tagline: 'Assisted category management.', contact: 'Contact' },
  },
} as const;

export type Dict = (typeof T)['fr'];
