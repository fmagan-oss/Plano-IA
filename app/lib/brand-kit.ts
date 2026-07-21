/**
 * Charte de marque : appliquée à l'export PowerPoint pour coller à l'ADN de
 * la marque du client. Les couleurs peuvent être saisies à la main ou
 * extraites automatiquement d'un template PowerPoint (.pptx / .potx) fourni
 * par l'utilisateur — un .pptx est une archive ZIP dont le thème
 * (ppt/theme/theme1.xml) contient la palette officielle.
 *
 * L'extracteur est isomorphe (regex, pas de DOMParser) : testable côté Node,
 * exécuté côté navigateur (le template ne quitte jamais le poste).
 */

export interface BrandKit {
  company?: string | null;
  /** Logo en data-URL (png/jpeg, léger). */
  logoData?: string | null;
  colors?: BrandColors | null;
}

export interface BrandColors {
  /** Couleur d'accent principale (titres, éléments forts). */
  primary?: string;
  /** Couleur foncée (fond de la diapo de titre). */
  dark?: string;
  /** Palette complète extraite du thème, à titre indicatif. */
  scheme?: Record<string, string>;
}

const ZIP_EOCD = 0x06054b50;
const ZIP_CDIR = 0x02014b50;
const ZIP_LOCAL = 0x04034b50;

async function inflateEntry(u8: Uint8Array, dv: DataView, entry: { method: number; csize: number; lho: number }): Promise<string> {
  const q = entry.lho;
  if (dv.getUint32(q, true) !== ZIP_LOCAL) throw new Error('local header');
  const fn = dv.getUint16(q + 26, true);
  const ex = dv.getUint16(q + 28, true);
  const bytes = u8.subarray(q + 30 + fn + ex, q + 30 + fn + ex + entry.csize);
  if (entry.method === 0) return new TextDecoder().decode(bytes);
  if (entry.method === 8) {
    const ab = await new Response(
      new Blob([bytes as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    ).arrayBuffer();
    return new TextDecoder().decode(ab);
  }
  throw new Error('méthode de compression inconnue');
}

/**
 * Extrait la palette du thème d'un .pptx/.potx.
 * Retourne les couleurs du clrScheme (dk1/lt1/dk2/lt2/accent1..6) en hex.
 */
export async function extractPptxTheme(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const dv = new DataView(buffer);
  const u8 = new Uint8Array(buffer);
  let eocd = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 22 - 65557); i--) {
    if (dv.getUint32(i, true) === ZIP_EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Fichier PowerPoint illisible (archive invalide).');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const td = new TextDecoder();
  let theme: { method: number; csize: number; lho: number } | null = null;
  for (let e = 0; e < count; e++) {
    if (dv.getUint32(p, true) !== ZIP_CDIR) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const fnlen = dv.getUint16(p + 28, true);
    const extlen = dv.getUint16(p + 30, true);
    const cmtlen = dv.getUint16(p + 32, true);
    const lho = dv.getUint32(p + 42, true);
    const name = td.decode(u8.subarray(p + 46, p + 46 + fnlen));
    if (/^ppt\/theme\/theme1\.xml$/.test(name)) theme = { method, csize, lho };
    p += 46 + fnlen + extlen + cmtlen;
  }
  if (!theme) throw new Error('Aucun thème trouvé dans ce fichier PowerPoint.');
  const xml = await inflateEntry(u8, dv, theme);

  const schemeMatch = xml.match(/<a:clrScheme[\s\S]*?<\/a:clrScheme>/);
  if (!schemeMatch) throw new Error('Palette de couleurs introuvable dans le thème.');
  const scheme = schemeMatch[0];

  const colors: Record<string, string> = {};
  for (const tag of ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6']) {
    const m = scheme.match(
      new RegExp(`<a:${tag}>[\\s\\S]*?(?:<a:srgbClr val="([0-9A-Fa-f]{6})"|<a:sysClr[^>]*lastClr="([0-9A-Fa-f]{6})")`)
    );
    const hexVal = m?.[1] || m?.[2];
    if (hexVal) colors[tag] = `#${hexVal.toUpperCase()}`;
  }
  if (!Object.keys(colors).length) throw new Error('Palette de couleurs introuvable dans le thème.');
  return colors;
}
