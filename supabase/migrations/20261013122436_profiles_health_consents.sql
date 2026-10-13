-- Lot 3 — account, character, health data and consents (PLAN §2).
-- GDPR: deleting the auth.users row erases everything below in cascade (one-click account deletion).
-- Health data (sex, height, weight, drinking habit) is special-category data (GDPR art. 9): it lives in its
-- own table, readable by its owner only, and can only be written while an explicit consent is active.

create extension if not exists citext with schema extensions;

create type public.sex as enum ('f', 'm', 'autre');
create type public.drinking_habit as enum ('occasionnel', 'regulier', 'frequent');
create type public.consent_kind as enum ('cgu', 'health_data', 'gauge_sharing');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Consents (journal kept as proof of consent; revoked rows are kept, never re-activated)
-- ---------------------------------------------------------------------------
create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.consent_kind not null,
  -- Per-party consent for gauge sharing; the foreign key to parties is added in lot 4.
  party_id uuid,
  version text not null check (char_length(version) between 1 and 40),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= granted_at),
  check ((kind = 'gauge_sharing') = (party_id is not null))
);

create unique index consents_one_active_idx
  on public.consents (user_id, kind, coalesce(party_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where revoked_at is null;
create index consents_user_id_idx on public.consents (user_id);

-- A consent can only be revoked, once: no other column may change and a revocation is final.
create function public.consents_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.revoked_at is not null then
    raise exception 'consent % is already revoked', old.id using errcode = 'check_violation';
  end if;
  if (new.user_id, new.kind, new.party_id, new.version, new.granted_at)
     is distinct from (old.user_id, old.kind, old.party_id, old.version, old.granted_at) then
    raise exception 'only revoked_at can change on a consent' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger consents_guard_update
  before update on public.consents
  for each row execute function public.consents_guard_update();

create function public.has_active_consent(p_kind public.consent_kind)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.consents c
    where c.user_id = (select auth.uid())
      and c.kind = p_kind
      and c.party_id is null
      and c.revoked_at is null
  );
$$;

-- ---------------------------------------------------------------------------
-- Profiles (the character): pseudo, avatar, birth year only (data minimisation)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  pseudo extensions.citext not null unique
    check (char_length(pseudo) between 3 and 20 and pseudo::text ~ '^[A-Za-z0-9_.-]+$'),
  avatar text not null
    check (avatar in ('bulle', 'citron', 'menthe', 'corail', 'nuit', 'etoile', 'lune', 'eclair')),
  birth_year smallint not null,
  adult_confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18+ only. The exact birth date is checked by the app before insert and never stored;
-- the database still refuses any birth year that cannot be an adult this year.
create function public.profiles_guard_age()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_year < 1900 or new.birth_year > extract(year from now())::int - 18 then
    raise exception 'Picomètre is for adults only' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_age
  before insert or update of birth_year on public.profiles
  for each row execute function public.profiles_guard_age();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Health data (GDPR art. 9) — owner only, explicit consent required
-- ---------------------------------------------------------------------------
create table public.profile_health (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  sex public.sex not null,
  height_cm smallint not null check (height_cm between 130 and 230),
  weight_kg numeric(4, 1) not null check (weight_kg between 35 and 250),
  habit public.drinking_habit not null,
  updated_at timestamptz not null default now()
);

create trigger profile_health_set_updated_at
  before update on public.profile_health
  for each row execute function public.set_updated_at();

-- Withdrawing the health-data consent erases the health data (GDPR art. 7(3) and 17).
create function public.erase_health_data_on_revoke()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.profile_health where user_id = new.user_id;
  return new;
end;
$$;

create trigger consents_erase_health_data
  after update of revoked_at on public.consents
  for each row
  when (new.kind = 'health_data' and new.revoked_at is not null)
  execute function public.erase_health_data_on_revoke();

-- ---------------------------------------------------------------------------
-- Privileges and Row Level Security
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.profile_health, public.consents from anon, authenticated;
grant select, insert, update (pseudo, avatar, birth_year) on public.profiles to authenticated;
grant select, insert, update (sex, height_cm, weight_kg, habit), delete on public.profile_health to authenticated;
grant select, insert (kind, party_id, version), update (revoked_at) on public.consents to authenticated;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.profile_health enable row level security;
alter table public.profile_health force row level security;
alter table public.consents enable row level security;
alter table public.consents force row level security;

-- profiles: own row only for now (friends and party members see pseudo/avatar via a view in lot 7).
create policy "profiles: owner reads" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: owner creates after accepting the terms" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()) and public.has_active_consent('cgu'));
create policy "profiles: owner updates" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- profile_health: owner only, never shared, writes need the health-data consent.
create policy "profile_health: owner reads" on public.profile_health
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profile_health: owner creates with consent" on public.profile_health
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.has_active_consent('health_data'));
create policy "profile_health: owner updates with consent" on public.profile_health
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.has_active_consent('health_data'));
create policy "profile_health: owner deletes" on public.profile_health
  for delete to authenticated using (user_id = (select auth.uid()));

-- consents: own journal; new consents start active, revocation through revoked_at only.
create policy "consents: owner reads" on public.consents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "consents: owner grants" on public.consents
  for insert to authenticated with check (user_id = (select auth.uid()) and revoked_at is null);
create policy "consents: owner revokes" on public.consents
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
