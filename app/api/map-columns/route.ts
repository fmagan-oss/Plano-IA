import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '../../lib/supabase/server';

export const runtime = 'nodejs';

// Simple per-user, per-instance rate limiter (same caveat as /api/copilot:
// use a shared store when scaling to multiple instances).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const hits = new Map<string, number[]>();
function rateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(userId, recent);
  return recent.length > MAX_REQUESTS;
}

const FIELDS = ['brand', 'ean', 'name', 'segment', 'revenue', 'volume', 'margin', 'price', 'isNew'] as const;

/**
 * AI mapping net: when the deterministic dictionary fails, Claude proposes a
 * column mapping from the header row + 3 sample rows. Only that excerpt is
 * sent — never the full file. The user confirms the result in the UI.
 */
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Analyse IA non configurée (clé API absente)." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Authentification non configurée.' }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  if (rateLimited(user.id)) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { headers?: unknown[]; sample?: unknown[][] };
  const headers = (body.headers ?? []).map((h) => String(h ?? '')).slice(0, 60);
  const sample = (body.sample ?? []).slice(0, 3).map((r) => (Array.isArray(r) ? r.slice(0, 60) : []));
  if (!headers.length) return NextResponse.json({ error: 'En-têtes manquants.' }, { status: 400 });

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 400,
      system:
        'Tu associes les colonnes d’un export panel retail (Nielsen/Circana ou format maison) aux champs CatPilot. ' +
        'Champs : brand (marque/fabricant), ean (code EAN/gencod), name (libellé produit), segment, revenue (CA valeur), ' +
        'volume (unités), margin (marge), price (prix unitaire), isNew (indicateur nouveauté). ' +
        'Réponds UNIQUEMENT avec un objet JSON {"brand":i|null,...} où i est l’index 0-based de la colonne. ' +
        'null si aucune colonne ne correspond. Aucun texte hors du JSON.',
      messages: [
        {
          role: 'user',
          content:
            `En-têtes (index: libellé) :\n${headers.map((h, i) => `${i}: ${h}`).join('\n')}\n\n` +
            `Lignes d'exemple :\n${sample.map((r) => JSON.stringify(r)).join('\n')}`,
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();

    const raw = JSON.parse(text) as Record<string, unknown>;
    const mapping: Record<string, number | null> = {};
    for (const f of FIELDS) {
      const v = raw[f];
      mapping[f] = typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < headers.length ? v : null;
    }
    return NextResponse.json({ mapping });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erreur inconnue';
    return NextResponse.json({ error: `Analyse IA échouée : ${msg}` }, { status: 502 });
  }
}
