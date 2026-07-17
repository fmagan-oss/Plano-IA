-- CatPilot — Stripe webhook idempotency (M3)
-- Each processed Stripe event id is recorded here; the webhook skips any id it
-- has already seen, making event handling idempotent.

create table if not exists public.stripe_events (
  id         text primary key,
  created_at timestamptz not null default now()
);

-- Written only by the service_role key (webhook). RLS on with no policies means
-- no client can read or write it.
alter table public.stripe_events enable row level security;
