-- Lot 9 — trophies (PLAN §2, E13). Never a reward for a quantity of alcohol (charte §9).
-- Values mirror config/objectifs.ts TROPHIES (docs/parametres-scientifiques.md#P-58, #P-59).
-- - « As du joker eau » and « Capitaine de soirée » are awarded by the database when the host ends the party.
-- - « Atterrissage parfait » needs the estimate, which only runs on the device (health data never leaves it):
--   the participant claims it, and the database checks everything it can (party ended, no Stop, objective cap).
-- Trophies are private; the group sees them only while their owner shares their gauge with the party.

-- ---------------------------------------------------------------------------
-- Peak level of a shared gauge (a level, never a value in g/L): what « Capitaine de soirée » compares.
-- ---------------------------------------------------------------------------
alter table public.gauge_shares add column peak_level smallint not null default 1 check (peak_level between 1 and 4);
grant insert (peak_level), update (peak_level) on public.gauge_shares to authenticated;

create or replace function public.guard_gauge_share()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  entry jsonb;
begin
  if jsonb_typeof(new.schedule) <> 'array' or jsonb_array_length(new.schedule) > 48 then
    raise exception 'invalid schedule' using errcode = 'check_violation';
  end if;
  for entry in select * from jsonb_array_elements(new.schedule) loop
    if jsonb_typeof(entry) <> 'object'
       or (select count(*) from jsonb_object_keys(entry)) <> 2
       or jsonb_typeof(entry -> 'at') <> 'string'
       or jsonb_typeof(entry -> 'level') <> 'number'
       or (entry ->> 'level') not in ('1', '2', '3', '4') then
      raise exception 'invalid schedule entry' using errcode = 'check_violation';
    end if;
    perform (entry ->> 'at')::timestamptz;
  end loop;
  -- A Stop stays for the rest of the party (docs/parametres-scientifiques.md#P-54), and a peak never goes down.
  if tg_op = 'UPDATE' then
    new.stopped := new.stopped or old.stopped;
    new.peak_level := greatest(new.peak_level, old.peak_level);
  end if;
  new.peak_level := greatest(new.peak_level, new.level, case when new.stopped then 4 else 1 end);
  new.computed_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Trophies
-- ---------------------------------------------------------------------------
create type public.trophy_kind as enum ('capitaine', 'joker_eau', 'atterrissage');

create table public.trophies (
  id bigint generated always as identity primary key,
  party_id uuid not null,
  user_id uuid not null,
  kind public.trophy_kind not null,
  awarded_at timestamptz not null default now(),
  unique (party_id, user_id, kind),
  foreign key (party_id, user_id) references public.party_participants (party_id, user_id) on delete cascade
);

create index trophies_user_id_idx on public.trophies (user_id);

-- Awarded once, when the party ends.
create function public.award_party_trophies()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sharers int;
begin
  -- P-58 « As du joker eau »: at least 2 waters, and at least 1 water per 2 alcoholic drinks.
  insert into public.trophies (party_id, user_id, kind)
  select new.id, p.user_id, 'joker_eau'
  from public.party_participants p
  join lateral (
    select count(*) filter (where c.is_water) as water, count(*) filter (where c.ethanol_g > 0) as alcoholic
    from public.consumptions c
    where c.party_id = p.party_id and c.user_id = p.user_id
  ) n on true
  where p.party_id = new.id and p.invite_status = 'accepted'
    and n.water >= 2 and n.water * 2 >= n.alcoholic
  on conflict do nothing;

  -- P-59 « Capitaine de soirée »: lowest peak level among at least 2 participants sharing their gauge.
  select count(*) into sharers
  from public.gauge_shares s
  join public.party_participants p on p.party_id = s.party_id and p.user_id = s.user_id
  where s.party_id = new.id and p.share_gauge and p.invite_status = 'accepted';
  if sharers >= 2 then
    insert into public.trophies (party_id, user_id, kind)
    select new.id, s.user_id, 'capitaine'
    from public.gauge_shares s
    join public.party_participants p on p.party_id = s.party_id and p.user_id = s.user_id
    where s.party_id = new.id and p.share_gauge and p.invite_status = 'accepted'
      and s.peak_level = (select min(peak_level) from public.gauge_shares where party_id = new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.award_party_trophies() from public, anon, authenticated;

create trigger parties_award_trophies
  after update of status on public.parties
  for each row
  when (new.status = 'ended' and old.status is distinct from 'ended')
  execute function public.award_party_trophies();

-- « Atterrissage parfait »: claimed by the participant's device, which ran the estimate (P-51 to P-54).
-- Intentionally callable by signed-in users, for themselves only.
create function public.claim_landing_trophy(p_party_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  mine public.participant_private;
  total numeric;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if not exists (select 1 from public.parties where id = p_party_id and status = 'ended')
     or not exists (
       select 1 from public.party_participants
       where party_id = p_party_id and user_id = me and invite_status = 'accepted'
     ) then
    return false;
  end if;
  select * into mine from public.participant_private where party_id = p_party_id and user_id = me;
  if mine.objective is null or mine.stop_locked_at is not null then
    return false;
  end if;
  -- docs/parametres-scientifiques.md#P-51 — the cap of « Zéro gueule de bois » (20 g, config/objectifs.ts).
  select coalesce(sum(ethanol_g), 0) into total from public.consumptions where party_id = p_party_id and user_id = me;
  if mine.objective = 'zero_gdb' and total > 20 then
    return false;
  end if;
  insert into public.trophies (party_id, user_id, kind) values (p_party_id, me, 'atterrissage') on conflict do nothing;
  return true;
end;
$$;

revoke execute on function public.claim_landing_trophy(uuid) from public, anon;
grant execute on function public.claim_landing_trophy(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Privileges and Row Level Security: read only; trophies are never written directly.
-- ---------------------------------------------------------------------------
revoke all on public.trophies from anon, authenticated;
grant select on public.trophies to authenticated;

alter table public.trophies enable row level security;
alter table public.trophies force row level security;

create policy "trophies: owner, or accepted members while shared" on public.trophies
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (private.is_accepted_member(party_id) and private.shares_gauge(party_id, user_id))
  );
