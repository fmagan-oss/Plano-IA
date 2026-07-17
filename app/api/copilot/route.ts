import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '../../lib/supabase/server';
import { getOrCreateProfile, isProActive } from '../../lib/profile';

export const runtime = 'nodejs';

// Simple per-user, per-instance rate limiter. NOTE: in-memory only — for a
// multi-instance deployment, back this with a shared store (e.g. Upstash Redis).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;
const hits = new Map<string, number[]>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(userId, recent);
  return recent.length > MAX_REQUESTS;
}

/**
 * Server-side AI proxy. The ANTHROPIC_API_KEY lives only here and is never
 * shipped to the client. The Pro entitlement is re-checked server-side — the
 * connected copilot is a Pro-only feature.
 */
export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Copilote IA non configuré (clé API absente)." }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Authentification non configurée.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  // Re-verify the Pro status server-side — never trust the client.
  const profile = await getOrCreateProfile(supabase, user);
  if (!isProActive(profile)) {
    return NextResponse.json({ error: 'Copilote IA réservé au Pro.' }, { status: 403 });
  }

  if (rateLimited(user.id)) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { question?: string; context?: string };
  const question = (body.question ?? '').toString().slice(0, 2000).trim();
  if (!question) {
    return NextResponse.json({ error: 'Question vide.' }, { status: 400 });
  }
  const context = (body.context ?? '').toString().slice(0, 6000);

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      system:
        "Tu es le copilote de CatPilot, un outil de category management pour la grande distribution. " +
        "Tu aides des category managers à construire des planogrammes, arbitrer le linéaire et préparer " +
        "leurs rendez-vous acheteurs. Réponds en français, de façon concrète et actionnable, en t'appuyant " +
        "sur les données du rayon fournies. Sois concis : va droit au but avec des recommandations chiffrées " +
        'quand c\'est possible. Ne divulgue jamais de secret technique.',
      messages: [
        {
          role: 'user',
          content: context
            ? `Contexte du rayon analysé :\n${context}\n\nQuestion : ${question}`
            : question,
        },
      ],
    });

    const answer = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return NextResponse.json({ answer: answer || 'Aucune réponse générée.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erreur inconnue';
    return NextResponse.json({ error: `Appel IA échoué : ${message}` }, { status: 502 });
  }
}
