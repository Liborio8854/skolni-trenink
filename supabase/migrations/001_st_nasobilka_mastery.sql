-- Mistr násobilky: evidence stavu malé násobilky (2–9)
-- Spusť v Supabase SQL Editoru.

create table if not exists public.st_nasobilka_mastery (
  user_id uuid not null references auth.users(id) on delete cascade,
  priklad text not null,
  stav text not null default 'neznamo'
    check (stav in ('neznamo', 'ucim_se', 'umim', 'zafixovano')),
  serie integer not null default 0,
  blesk_dny text[] not null default '{}',
  blesk_ab boolean not null default false,
  blesk_ba boolean not null default false,
  aktualizovano timestamptz not null default now(),
  primary key (user_id, priklad)
);

create index if not exists st_nasobilka_mastery_user_idx
  on public.st_nasobilka_mastery (user_id);

alter table public.st_nasobilka_mastery enable row level security;

drop policy if exists "vlastni_nasobilka_mastery" on public.st_nasobilka_mastery;
create policy "vlastni_nasobilka_mastery" on public.st_nasobilka_mastery
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
