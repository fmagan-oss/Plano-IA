import Link from 'next/link';
import { CheckoutButton } from './components/BillingButtons';

export default function LandingPage() {
  return (
    <div className="landing">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">Category management assisté</p>
          <h1>
            Du fichier panel au <span className="grad">planogramme au facing</span>, en quelques secondes.
          </h1>
          <p className="hero-sub">
            CatPilot lit vos exports Nielsen / Circana et génère automatiquement le plan de masse, le
            planogramme au facing et la trame de présentation acheteur. Blocs par marque, détection des
            nouveautés, 4 variantes stratégiques.
          </p>
          <div className="hero-cta">
            <Link href="/app" className="btn btn-primary btn-lg">
              Ouvrir la démo
            </Link>
            <Link href="#offres" className="btn btn-ghost btn-lg">
              Voir les offres
            </Link>
          </div>
          <p className="hero-note">Aucune installation. Importez un Excel/CSV, ou testez avec le jeu d’exemple.</p>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="mini-plano">
            <div className="mini-plano-bar">
              <span className="mini-plano-dot" />
              <span className="mini-plano-dot" />
              <span className="mini-plano-dot" />
              <span>Planogramme — Rayon Énergisants</span>
            </div>
            <div className="mini-plano-body">
              {HERO_SHELVES.map((shelf, r) => (
                <div className="mini-shelf" key={r}>
                  {shelf.map(([color, span], c) => (
                    <span
                      key={c}
                      className="mini-cell"
                      style={{ background: color, flexGrow: span }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="section">
        <div className="section-head">
          <h2>Ce que CatPilot produit pour vous</h2>
          <p>Trois livrables prêts à présenter, à partir d’un seul fichier.</p>
        </div>
        <div className="cards-3">
          <article className="feature-card">
            <div className="feature-icon">▤</div>
            <h3>Plan de masse</h3>
            <p>Répartition du linéaire par marque et segment, alignée sur le poids marché (CA, volume, marge).</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">◧</div>
            <h3>Planogramme au facing</h3>
            <p>Placement rayon par niveaux, blocs marques homogènes, nouveautés remontées au niveau des yeux.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">◎</div>
            <h3>Trame acheteur</h3>
            <p>Une présentation structurée — synthèse catégorie, moves clés, impact attendu — prête pour le rendez-vous.</p>
          </article>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section section-alt">
        <div className="section-head">
          <h2>Comment ça marche</h2>
          <p>Le workflow d’un category manager, automatisé.</p>
        </div>
        <ol className="steps">
          <li>
            <span className="step-n">1</span>
            <div>
              <h4>Importez votre panel</h4>
              <p>Excel ou CSV Nielsen/Circana. CatPilot détecte automatiquement les colonnes (marque, CA, volume, marge, nouveauté).</p>
            </div>
          </li>
          <li>
            <span className="step-n">2</span>
            <div>
              <h4>Choisissez une stratégie</h4>
              <p>Équilibré, Rotation, Marge ou CA. Chaque variante réalloue le facing selon votre objectif.</p>
            </div>
          </li>
          <li>
            <span className="step-n">3</span>
            <div>
              <h4>Générez et présentez</h4>
              <p>Plan de masse, planogramme et trame acheteur, prêts à exporter et à défendre en rendez-vous enseigne.</p>
            </div>
          </li>
        </ol>
      </section>

      {/* PRICING */}
      <section className="section" id="offres">
        <div className="section-head">
          <h2>Offres</h2>
          <p>Tarifs HT. Facturation B2B conforme (TVA intracommunautaire, autoliquidation UE).</p>
        </div>
        <div className="pricing">
          <article className="price-card">
            <h3>Démo</h3>
            <p className="price">
              0 € <span>/ toujours</span>
            </p>
            <ul>
              <li>Import Excel / CSV</li>
              <li>Plan de masse + planogramme</li>
              <li><strong>1 variante</strong> stratégique</li>
              <li>Trame acheteur verrouillée</li>
              <li>Copilote déterministe embarqué</li>
            </ul>
            <Link href="/app" className="btn btn-ghost btn-block">
              Essayer la démo
            </Link>
          </article>

          <article className="price-card featured">
            <div className="ribbon">Le plus choisi</div>
            <h3>Pro Mensuel</h3>
            <p className="price">
              1 200 € <span>HT / mois</span>
            </p>
            <ul>
              <li>Tout de la Démo, plus :</li>
              <li><strong>4 variantes</strong> (Équilibré / Rotation / Marge / CA)</li>
              <li>Trame de présentation acheteur débloquée</li>
              <li>Copilote IA connecté</li>
              <li>Export & facturation B2B</li>
            </ul>
            <CheckoutButton plan="monthly">Passer en Pro</CheckoutButton>
          </article>

          <article className="price-card">
            <h3>Pro Annuel</h3>
            <p className="price">
              12 000 € <span>HT / an</span>
            </p>
            <ul>
              <li>Tout du Pro Mensuel</li>
              <li><strong>2 mois offerts</strong> (vs mensuel)</li>
              <li>Facture annuelle unique</li>
              <li>Support prioritaire</li>
            </ul>
            <CheckoutButton plan="yearly" className="btn btn-ghost btn-block">
              Choisir l’annuel
            </CheckoutButton>
          </article>
        </div>

        <div className="enterprise-note">
          <div>
            <h4>Gros comptes / virement sur facture</h4>
            <p>
              Offre annuelle sur devis, réglable par virement. Pas de carte imposée : nous établissons une facture
              conforme à votre process achats.
            </p>
          </div>
          <a href="mailto:contact@catpilot.app?subject=Demande%20de%20devis%20CatPilot" className="btn btn-outline">
            Demander un devis
          </a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-band">
        <h2>Prêt à construire votre prochain rayon ?</h2>
        <p>Importez un fichier ou lancez le jeu d’exemple — vous avez un planogramme en moins d’une minute.</p>
        <Link href="/app" className="btn btn-primary btn-lg">
          Ouvrir l’application
        </Link>
      </section>
    </div>
  );
}

// Contiguous brand blocks per shelf — [color, relative width]. Mirrors how a
// real planogram groups facings by brand.
const HERO_SHELVES: [string, number][][] = [
  [['#ca8a04', 6], ['#ca8a04', 3], ['#0891b2', 3]],
  [['#7c3aed', 4], ['#7c3aed', 5], ['#ca8a04', 3]],
  [['#7c3aed', 5], ['#7c3aed', 4], ['#2563eb', 3]],
  [['#2563eb', 3], ['#16a34a', 4], ['#16a34a', 3], ['#0891b2', 2]],
  [['#0284c7', 3], ['#16a34a', 3], ['#db2777', 4], ['#db2777', 2]],
];
