'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { T, useLocale } from '../lib/i18n';

interface Row { id: string; name: string; created_at: string }

export default function PresentationsList() {
  const { locale } = useLocale();
  const t = T[locale].pres;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setRows([]); return; }
    const { data } = await supabase
      .from('presentations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    await supabase.from('presentations').delete().eq('id', id);
    await load();
    setBusy(false);
  }

  if (rows === null) return null;

  if (!rows.length) {
    return (
      <div className="pres-empty">
        <p className="muted">{t.empty}</p>
        <Link href="/app" className="btn btn-primary">{t.appLink}</Link>
      </div>
    );
  }

  return (
    <ul className="pres-list">
      {rows.map((r) => (
        <li key={r.id}>
          <div className="pres-info">
            <strong>{r.name}</strong>
            <span className="muted">
              {t.savedOn(new Date(r.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB'))}
            </span>
          </div>
          <div className="pres-actions">
            <Link href={`/app?pres=${r.id}`} className="btn btn-primary btn-sm">{t.open}</Link>
            <button className="btn btn-ghost btn-sm" onClick={() => remove(r.id)} disabled={busy}>
              {t.del}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
