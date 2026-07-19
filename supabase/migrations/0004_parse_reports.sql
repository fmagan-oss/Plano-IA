-- CatPilot — signalements « mauvaise lecture » (entraînement du parseur)
-- Chaque signalement conserve les en-têtes + 3 lignes d'exemple + le mapping
-- détecté : la matière première de l'enrichissement du dictionnaire
-- (routine nocturne / revue manuelle). Lu côté admin via la service_role.

create table if not exists public.parse_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  file_name  text,
  headers    jsonb not null,
  sample     jsonb,
  detected   jsonb,
  comment    text,
  status     text not null default 'new' check (status in ('new', 'processed', 'ignored')),
  created_at timestamptz not null default now()
);

create index if not exists parse_reports_status_created
  on public.parse_reports (status, created_at desc);

alter table public.parse_reports enable row level security;

drop policy if exists "parse_reports_insert_own" on public.parse_reports;
create policy "parse_reports_insert_own"
  on public.parse_reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "parse_reports_select_own" on public.parse_reports;
create policy "parse_reports_select_own"
  on public.parse_reports for select
  using (auth.uid() = user_id);
