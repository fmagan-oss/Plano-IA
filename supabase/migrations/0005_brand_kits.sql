-- CatPilot — charte de marque (ADN de marque appliqué aux exports)
-- Un enregistrement par utilisateur : nom de marque, logo (data-URL, léger),
-- couleurs (extraites d'un template PowerPoint client ou choisies à la main).

create table if not exists public.brand_kits (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  company    text,
  logo_data  text,
  colors     jsonb,
  updated_at timestamptz not null default now()
);

alter table public.brand_kits enable row level security;

drop policy if exists "brand_kits_owner_all" on public.brand_kits;
create policy "brand_kits_owner_all"
  on public.brand_kits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists brand_kits_set_updated_at on public.brand_kits;
create trigger brand_kits_set_updated_at
  before update on public.brand_kits
  for each row execute function public.set_updated_at();
