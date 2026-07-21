'use client';

import { T, useLocale } from '../lib/i18n';

export default function PresentationsHeader() {
  const { locale } = useLocale();
  const t = T[locale].pres;
  return (
    <div className="account-head">
      <div>
        <h1>{t.title}</h1>
        <p className="muted">{t.sub}</p>
      </div>
    </div>
  );
}
