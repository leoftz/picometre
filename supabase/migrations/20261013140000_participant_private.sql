-- Lot 6 — privacy fix and permanent Stop.
-- 1. party_participants is readable by every member of a party, yet it held each participant's objective,
--    meal and (now) Stop: consumption-related data shown to the group without consent. These move to
--    participant_private, readable and writable by its owner only. Sharing with the group happens only
--    through the explicit gauge-sharing consent (lot 8).
-- 2. « Stop pour ce soir » is permanent for the party (docs/parametres-scientifiques.md#P-54): once the
--    device records it, it can never be changed or cleared.

create table public.participant_private (
  party_id uuid not null,
  user_id uuid not null,
  objective public.party_objective,
  meal_kind public.meal_kind,
  meal_at timestamptz,
  stop_locked_at timestamptz,
  primary key (party_id, user_id),
  foreign key (party_id, user_id) references public.party_participants (party_id, user_id) on delete cascade,
  check ((meal_kind is null or meal_kind = 'aucun') = (meal_at is null))
);

insert into public.participant_private (party_id, user_id, objective, meal_kind, meal_at)
select party_id, user_id, objective, meal_kind, meal_at from public.party_participants;

-- Dropping the columns also drops their check constraint and column grants.
alter table public.party_participants
  drop column objective,
  drop column meal_kind,
  drop column meal_at,
  drop column stop_locked_at;

-- Every participant gets their private row.
create function public.add_participant_private()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.participant_private (party_id, user_id) values (new.party_id, new.user_id)
  on conflict do nothing;
  return new;
end;
$$;

revoke execute on function public.add_participant_private() from public, anon, authenticated;

create trigger party_participants_add_private
  after insert on public.party_participants
  for each row execute function public.add_participant_private();

create function public.guard_stop_lock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.stop_locked_at is not null and new.stop_locked_at is distinct from old.stop_locked_at then
    raise exception 'the Stop of this party is permanent' using errcode = 'check_violation';
  end if;
  if new.stop_locked_at is not null and old.stop_locked_at is null and new.stop_locked_at > now() + interval '5 minutes' then
    raise exception 'a Stop cannot be dated in the future' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_stop_lock() from public, anon, authenticated;

create trigger participant_private_guard_stop_lock
  before update of stop_locked_at on public.participant_private
  for each row execute function public.guard_stop_lock();

revoke all on public.participant_private from anon, authenticated;
grant select, update (objective, meal_kind, meal_at, stop_locked_at) on public.participant_private to authenticated;

alter table public.participant_private enable row level security;
alter table public.participant_private force row level security;

create policy "participant_private: owner reads" on public.participant_private
  for select to authenticated using (user_id = (select auth.uid()));
create policy "participant_private: owner updates" on public.participant_private
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
