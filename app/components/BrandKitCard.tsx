'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { extractPptxTheme, type BrandColors } from '../lib/brand-kit';

/**
 * Charte de marque : nom, logo, couleurs — appliqués aux exports PowerPoint.
 * Les couleurs peuvent être extraites automatiquement d'un template
 * PowerPoint (.pptx/.potx) du client ; le fichier ne quitte pas le poste.
 */
export default function BrandKitCard() {
  const [company, setCompany] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [primary, setPrimary] = useState('#2B3FF5');
  const [dark, setDark] = useState('#10163A');
  const [scheme, setScheme] = useState<Record<string, string> | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setLoaded(true); return; }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoaded(true); return; }
      const { data: kit } = await supabase
        .from('brand_kits')
        .select('company, logo_data, colors')
        .eq('user_id', data.user.id)
        .maybeSingle();
      if (kit) {
        setCompany(kit.company ?? '');
        setLogo(kit.logo_data ?? null);
        const c = (kit.colors ?? {}) as BrandColors;
        if (c.primary) setPrimary(c.primary);
        if (c.dark) setDark(c.dark);
        if (c.scheme) setScheme(c.scheme);
      }
      setLoaded(true);
    });
  }, []);

  function onLogoFile(file: File) {
    setNote(null);
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      if (data.length > 400_000) {
        setNote('Logo trop lourd — utilisez une image de moins de ~300 Ko (PNG/JPG).');
        return;
      }
      setLogo(data);
    };
    reader.readAsDataURL(file);
  }

  async function onTemplateFile(file: File) {
    setNote(null);
    try {
      const colors = await extractPptxTheme(await file.arrayBuffer());
      const nextPrimary = colors.accent1 || colors.dk2;
      const nextDark = colors.dk2 || colors.dk1;
      if (nextPrimary) setPrimary(nextPrimary);
      if (nextDark) setDark(nextDark);
      setScheme(colors);
      setNote(`Palette extraite de « ${file.name} » : ${Object.values(colors).slice(0, 6).join(' · ')}. Ajustez si besoin puis enregistrez.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Extraction impossible.');
    }
  }

  async function save() {
    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('brand_kits').upsert({
      user_id: user.id,
      company: company.trim() || null,
      logo_data: logo,
      colors: { primary, dark, scheme },
    });
    setNote(error ? 'Enregistrement impossible.' : 'Charte enregistrée ✓ — elle s’applique à vos prochains exports PowerPoint.');
    setBusy(false);
  }

  if (!loaded) return null;

  return (
    <div className="account-card">
      <h2>Charte de marque</h2>
      <p className="muted">
        Vos exports PowerPoint reprennent l’ADN de votre marque : nom, logo et couleurs. Importez votre template
        PowerPoint pour récupérer automatiquement votre palette officielle — le fichier est lu sur votre poste,
        il n’est envoyé nulle part.
      </p>

      <div className="brandkit-grid">
        <label className="brandkit-field">
          Nom de la marque / société
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex. Maison Dupont" />
        </label>

        <label className="brandkit-field">
          Logo (PNG/JPG, fond transparent conseillé)
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogoFile(f); e.target.value = ''; }}
          />
        </label>

        <label className="brandkit-field">
          Couleur principale
          <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
        </label>

        <label className="brandkit-field">
          Couleur foncée (fond de titre)
          <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} />
        </label>
      </div>

      {logo && (
        <div className="brandkit-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Logo" />
          <button className="btn btn-ghost btn-sm" onClick={() => setLogo(null)}>Retirer le logo</button>
        </div>
      )}

      <div className="brandkit-template">
        <label className="btn btn-ghost">
          Importer les couleurs depuis mon template PowerPoint (.pptx / .potx)
          <input
            type="file"
            accept=".pptx,.potx"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onTemplateFile(f); e.target.value = ''; }}
          />
        </label>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer la charte'}
        </button>
      </div>

      {scheme && (
        <div className="brandkit-swatches">
          {Object.entries(scheme).map(([k, v]) => (
            <span key={k} className="brandkit-swatch" style={{ background: v }} title={`${k} ${v}`} />
          ))}
        </div>
      )}
      {note && <p className="brandkit-note">{note}</p>}
    </div>
  );
}
