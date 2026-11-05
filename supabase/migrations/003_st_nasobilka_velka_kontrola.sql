-- Mistr násobilky: jednorázová Velká kontrola (výsledek + datum + počet chyb)
-- Spusť v Supabase SQL Editoru.

create table if not exists public.st_nasobilka_velka_kontrola (
  user_id uuid primary key references auth.users(id) on delete cascade,
  datum date not null,
  chyb integer not null default 0
    check (chyb >= 0),
  uspech boolean not null default false,
  dokonceno_at timestamptz not null default now()
);

alter table public.st_nasobilka_velka_kontrola enable row level security;

drop policy if exists "vlastni_nasobilka_velka_kontrola" on public.st_nasobilka_velka_kontrola;
create policy "vlastni_nasobilka_velka_kontrola" on public.st_nasobilka_velka_kontrola
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
