'use client';

import { T, useLocale } from '../lib/i18n';

export default function Footer() {
  const { locale } = useLocale();
  const t = T[locale];
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>© {new Date().getFullYear()} CatPilot — {t.footer.tagline}</span>
        <span className="footer-links">
          <a href="/#offres">{t.nav.offers}</a>
          <a href="/app">{t.nav.app}</a>
          <a href="mailto:contact@catpilot.app">{t.footer.contact}</a>
        </span>
      </div>
    </footer>
  );
}
