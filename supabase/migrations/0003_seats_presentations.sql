-- CatPilot — M7 : sièges nominatifs + espace « Mes présentations »

-- 1) Nombre de sièges porté par l'abonnement Stripe (quantity), miroir ici.
alter table public.profiles
  add column if not exists seats integer not null default 1;

-- 2) Membres d'équipe : chaque siège = une personne nommée (e-mail personnel),
--    rattachée au titulaire de l'abonnement (owner). Le titulaire occupe un
--    siège ; la table ne contient que les sièges supplémentaires.
create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  email      text not null,
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists team_members_owner_email
  on public.team_members (owner_id, lower(email));

alter table public.team_members enable row level security;

drop policy if exists "team_owner_all" on public.team_members;
create policy "team_owner_all"
  on public.team_members for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "team_member_read" on public.team_members;
create policy "team_member_read"
  on public.team_members for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Un membre est-il couvert par l'abonnement Pro actif de son titulaire ?
-- (security definer : le membre n'a pas le droit de lire le profil du titulaire)
create or replace function public.my_team_owner_pro()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    join public.profiles p on p.id = tm.owner_id
    where lower(tm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and p.plan = 'pro'
      and p.subscription_status = 'active'
  );
$$;

-- 3) Espace « Mes présentations » : une ligne = une analyse sauvegardée
--    (données importées + réglages). La génération étant déterministe,
--    stocker les entrées suffit pour rouvrir à l'identique.
create table if not exists public.presentations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists presentations_user_created
  on public.presentations (user_id, created_at desc);

alter table public.presentations enable row level security;

drop policy if exists "presentations_owner_all" on public.presentations;
create policy "presentations_owner_all"
  on public.presentations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists presentations_set_updated_at on public.presentations;
create trigger presentations_set_updated_at
  before update on public.presentations
  for each row execute function public.set_updated_at();
