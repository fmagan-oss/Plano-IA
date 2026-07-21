import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { getOrCreateProfile, isProActive } from '../../lib/profile';

export const runtime = 'nodejs';

/**
 * Named-seat management for the subscription owner.
 * The owner occupies one seat; team_members holds the additional seats.
 * Seat cap = profile.seats (mirrored from the Stripe subscription quantity).
 */
async function ctx() {
  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: 'Authentification non configurée.' }, { status: 503 }) };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Non authentifié.' }, { status: 401 }) };
  const profile = await getOrCreateProfile(supabase, user);
  return { supabase, user, profile };
}

export async function GET() {
  const c = await ctx();
  if ('error' in c) return c.error;
  const { data: members } = await c.supabase!
    .from('team_members')
    .select('id, email, created_at')
    .eq('owner_id', c.user!.id)
    .order('created_at');
  return NextResponse.json({
    seats: c.profile?.seats ?? 1,
    used: 1 + (members?.length ?? 0),
    members: members ?? [],
    pro: isProActive(c.profile ?? null),
  });
}

export async function POST(request: Request) {
  const c = await ctx();
  if ('error' in c) return c.error;
  if (!isProActive(c.profile ?? null)) {
    return NextResponse.json({ error: 'Un abonnement Pro actif est requis pour inviter des membres.' }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = (body.email ?? '').toString().trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  if (email === (c.user!.email ?? '').toLowerCase()) {
    return NextResponse.json({ error: 'Vous occupez déjà un siège (titulaire).' }, { status: 400 });
  }

  const seats = c.profile?.seats ?? 1;
  const { count } = await c.supabase!
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', c.user!.id);
  // Occupés après ajout = 1 (titulaire) + membres existants + 1 (nouveau).
  if ((count ?? 0) + 2 > seats) {
    return NextResponse.json(
      { error: `Tous les sièges sont utilisés (${seats}). Augmentez la quantité de sièges via « Gérer mon abonnement ».` },
      { status: 400 }
    );
  }

  const { error } = await c.supabase!.from('team_members').insert({ owner_id: c.user!.id, email });
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cette adresse occupe déjà un siège.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Impossible d’ajouter ce membre.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const c = await ctx();
  if ('error' in c) return c.error;
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });
  // RLS restricts the delete to rows owned by the caller.
  const { error } = await c.supabase!.from('team_members').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Suppression impossible.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
