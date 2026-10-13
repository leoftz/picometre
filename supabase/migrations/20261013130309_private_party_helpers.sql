-- Lot 4 follow-ups.
-- 1. Security advisor: nothing beyond the tables should be reachable through the API.
--    Party membership helpers move to a non-exposed schema; RLS policies keep working (they reference
--    functions by identity, not by name, and the execute grant to authenticated moves with them).
--    Trigger functions are never meant to be called directly.
-- 2. PLAN Q-12 (decided 2026-10-13): every member can plan their own drinks and cocktails;
--    the host still manages all of them.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_party_member(uuid) set schema private;
alter function public.is_party_host(uuid) set schema private;

revoke execute on function public.add_host_participant() from public, anon, authenticated;
revoke execute on function public.erase_health_data_on_revoke() from public, anon, authenticated;
revoke execute on function public.consents_guard_update() from public, anon, authenticated;
revoke execute on function public.profiles_guard_age() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.check_drink_bank() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Q-12: who added a planned drink. Not personal data once the person is gone (generic drink),
-- so the drink stays for the group and only the link is cleared when its author deletes their account.
-- ---------------------------------------------------------------------------
alter table public.party_drinks
  add column added_by uuid default auth.uid() references public.profiles (id) on delete set null;
update public.party_drinks d set added_by = p.host_id from public.parties p where p.id = d.party_id;
create index party_drinks_added_by_idx on public.party_drinks (added_by);

create function private.can_edit_party_drink(p_drink_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.party_drinks d
    where d.id = p_drink_id
      and (d.added_by = (select auth.uid()) or private.is_party_host(d.party_id))
  );
$$;

revoke execute on function private.can_edit_party_drink(uuid) from public, anon;
grant execute on function private.can_edit_party_drink(uuid) to authenticated;

drop policy "party_drinks: host inserts" on public.party_drinks;
drop policy "party_drinks: host updates" on public.party_drinks;
drop policy "party_drinks: host deletes" on public.party_drinks;
drop policy "cocktail_ingredients: host manages" on public.cocktail_ingredients;

create policy "party_drinks: members add their own" on public.party_drinks
  for insert to authenticated
  with check (private.is_party_member(party_id) and added_by = (select auth.uid()));
create policy "party_drinks: author or host updates" on public.party_drinks
  for update to authenticated
  using (private.can_edit_party_drink(id))
  with check (private.is_party_member(party_id));
create policy "party_drinks: author or host deletes" on public.party_drinks
  for delete to authenticated using (private.can_edit_party_drink(id));

create policy "cocktail_ingredients: author or host manages" on public.cocktail_ingredients
  for all to authenticated
  using (private.can_edit_party_drink(party_drink_id))
  with check (private.can_edit_party_drink(party_drink_id));
