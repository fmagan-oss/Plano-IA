'use client';

import Link from 'next/link';
import { CheckoutButton } from './components/BillingButtons';
import { T, useLocale } from './lib/i18n';

const FEATURE_ICONS = ['▤', '◧', '◎'];

export default function LandingPage() {
  const { locale } = useLocale();
  const t = T[locale].landing;

  return (
    <div className="landing">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>
            {t.h1a}<span className="grad">{t.h1b}</span>{t.h1c}
          </h1>
          <p className="hero-sub">{t.sub}</p>
          <div className="hero-cta">
            <Link href="/app" className="btn btn-primary btn-lg">{t.ctaDemo}</Link>
            <Link href="#offres" className="btn btn-ghost btn-lg">{t.ctaOffers}</Link>
          </div>
          <p className="hero-note">{t.note}</p>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="mini-plano">
            <div className="mini-plano-bar">
              <span className="mini-plano-dot" />
              <span className="mini-plano-dot" />
              <span className="mini-plano-dot" />
              <span>{t.windowTitle}</span>
            </div>
            <div className="mini-plano-body">
              {HERO_SHELVES.map((shelf, r) => (
                <div className="mini-shelf" key={r}>
                  {shelf.map((block, i) => (
                    <span className="mini-block" key={i} style={{ flexGrow: block.width }}>
                      {block.cells.map((w, j) => (
                        <span
                          key={j}
                          className="mini-cell"
                          style={{ background: block.color, flexGrow: w }}
                        />
                      ))}
                    </span>
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
          <h2>{t.featuresTitle}</h2>
          <p>{t.featuresSub}</p>
        </div>
        <div className="cards-3">
          {t.features.map((f, i) => (
            <article className="feature-card" key={i}>
              <div className="feature-icon">{FEATURE_ICONS[i]}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section section-alt">
        <div className="section-head">
          <h2>{t.howTitle}</h2>
          <p>{t.howSub}</p>
        </div>
        <ol className="steps">
          {t.steps.map((s, i) => (
            <li key={i}>
              <span className="step-n">{i + 1}</span>
              <div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* PRICING */}
      <section className="section" id="offres">
        <div className="section-head">
          <h2>{t.pricingTitle}</h2>
          <p>{t.pricingSub}</p>
        </div>
        <div className="pricing">
          <article className="price-card">
            <h3>{t.demoPlan.name}</h3>
            <p className="price">{t.demoPlan.price} <span>{t.demoPlan.period}</span></p>
            <ul>
              {t.demoPlan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <Link href="/app" className="btn btn-ghost btn-block">{t.demoPlan.cta}</Link>
          </article>

          <article className="price-card featured">
            <div className="ribbon">{t.proPlan.ribbon}</div>
            <h3>{t.proPlan.name}</h3>
            <p className="price">{t.proPlan.price} <span>{t.proPlan.period}</span></p>
            <ul>
              {t.proPlan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <CheckoutButton plan="monthly">{t.proPlan.cta}</CheckoutButton>
          </article>

          <article className="price-card">
            <h3>{t.yearPlan.name}</h3>
            <p className="price">{t.yearPlan.price} <span>{t.yearPlan.period}</span></p>
            <ul>
              {t.yearPlan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <CheckoutButton plan="yearly" className="btn btn-ghost btn-block">{t.yearPlan.cta}</CheckoutButton>
          </article>
        </div>

        <div className="enterprise-note">
          <div>
            <h4>{t.enterprise.title}</h4>
            <p>{t.enterprise.text}</p>
          </div>
          <a href="mailto:contact@catpilot.app?subject=Devis%20CatPilot" className="btn btn-outline">
            {t.enterprise.cta}
          </a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-band">
        <h2>{t.ctaBandTitle}</h2>
        <p>{t.ctaBandText}</p>
        <Link href="/app" className="btn btn-primary btn-lg">{t.ctaBandBtn}</Link>
      </section>
    </div>
  );
}

// Merchandising rule for the mock: a brand color is either a full shelf, or a
// rectangle spanning adjacent shelves with vertically aligned boundaries
// (clean brand "descentes"). Cells inside a block are individual SKUs.
type HeroBlock = { color: string; width: number; cells: number[] };
const AMBER = '#ca8a04', CYAN = '#0891b2', VIOLET = '#7c3aed', BLUE = '#2563eb';
const GREEN = '#16a34a', PINK = '#db2777', SKY = '#0284c7';
const HERO_SHELVES: HeroBlock[][] = [
  // Shelves 1–2: amber (6) + cyan (6) rectangles, boundaries aligned
  [{ color: AMBER, width: 6, cells: [4, 2] }, { color: CYAN, width: 6, cells: [3, 3] }],
  [{ color: AMBER, width: 6, cells: [3, 3] }, { color: CYAN, width: 6, cells: [6] }],
  // Shelves 3–4: violet (7) + blue (5) rectangles, boundaries aligned
  [{ color: VIOLET, width: 7, cells: [4, 3] }, { color: BLUE, width: 5, cells: [5] }],
  [{ color: VIOLET, width: 7, cells: [3, 4] }, { color: BLUE, width: 5, cells: [2, 3] }],
  // Shelf 5: single-shelf brands (hues distinct from the blocks above them)
  [{ color: SKY, width: 3, cells: [3] }, { color: GREEN, width: 4, cells: [2, 2] }, { color: PINK, width: 5, cells: [3, 2] }],
];
