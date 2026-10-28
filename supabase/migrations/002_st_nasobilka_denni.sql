-- Mistr násobilky: denní počet úspěšných kol
-- Spusť v Supabase SQL Editoru.

create table if not exists public.st_nasobilka_denni (
  user_id uuid not null references auth.users(id) on delete cascade,
  datum date not null,
  uspesna_kola integer not null default 0
    check (uspesna_kola >= 0),
  primary key (user_id, datum)
);

alter table public.st_nasobilka_denni enable row level security;

drop policy if exists "vlastni_nasobilka_denni" on public.st_nasobilka_denni;
create policy "vlastni_nasobilka_denni" on public.st_nasobilka_denni
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Atomické +1 (bezpečné při hraní na dvou zařízeních).
create or replace function public.increment_nasobilka_kola(p_datum date)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.st_nasobilka_denni (user_id, datum, uspesna_kola)
  values (v_uid, p_datum, 1)
  on conflict (user_id, datum)
  do update set uspesna_kola = public.st_nasobilka_denni.uspesna_kola + 1
  returning public.st_nasobilka_denni.uspesna_kola into v_count;

  return v_count;
end;
$$;

revoke all on function public.increment_nasobilka_kola(date) from public;
grant execute on function public.increment_nasobilka_kola(date) to authenticated;
