-- Lot 4 — drink and glass bank (docs/parametres-scientifiques.md §1.1), parties, participants,
-- planned drinks and cocktails (PLAN §2). Solo for now: guests arrive with friends in lot 7.

-- ---------------------------------------------------------------------------
-- Reference bank (read-only for users; changed by migrations only)
-- ---------------------------------------------------------------------------
create type public.drink_family as enum ('biere', 'cidre', 'vin', 'aperitif', 'spiritueux', 'liqueur', 'sans_alcool');

create table public.glass_sizes (
  slug text primary key,
  label text not null,
  volume_ml smallint not null check (volume_ml between 10 and 1000),
  param_ref text not null
);

create table public.drink_types (
  slug text primary key,
  label text not null,
  family public.drink_family not null,
  abv_default numeric(4, 1) not null,
  abv_min numeric(4, 1) not null,
  abv_max numeric(4, 1) not null,
  param_ref text not null,
  sort smallint not null,
  check (abv_min <= abv_default and abv_default <= abv_max and abv_min >= 0 and abv_max <= 100)
);

create table public.drink_type_glasses (
  drink_type text not null references public.drink_types (slug) on delete cascade,
  glass_size text not null references public.glass_sizes (slug) on delete cascade,
  is_default boolean not null default false,
  primary key (drink_type, glass_size)
);

create unique index drink_type_glasses_one_default_idx on public.drink_type_glasses (drink_type) where is_default;

-- BEGIN GENERATED BANK (npm run bank:sql — do not edit by hand)
insert into public.glass_sizes (slug, label, volume_ml, param_ref) values
  ('shot', 'Shot (3 cl)', 30, 'P-80'),
  ('dose', 'Dose (4 cl)', 40, 'P-81'),
  ('double', 'Double (5 cl)', 50, 'P-82'),
  ('dose-pastis', 'Dose de pastis (2 cl)', 20, 'P-83'),
  ('aperitif', 'Verre à apéritif (6 cl)', 60, 'P-84'),
  ('flute', 'Flûte (10 cl)', 100, 'P-85'),
  ('vin', 'Verre à vin (12 cl)', 120, 'P-86'),
  ('grand-vin', 'Grand verre à vin (15 cl)', 150, 'P-87'),
  ('demi', 'Demi ou bolée (25 cl)', 250, 'P-88'),
  ('33cl', 'Bouteille ou canette (33 cl)', 330, 'P-89'),
  ('pinte', 'Pinte (50 cl)', 500, 'P-90'),
  ('grand-aperitif', 'Grand verre à apéritif (8 cl)', 80, 'P-92'),
  ('verre', 'Verre (25 cl)', 250, 'P-93')
on conflict (slug) do update set label = excluded.label, volume_ml = excluded.volume_ml, param_ref = excluded.param_ref;

insert into public.drink_types (slug, label, family, abv_default, abv_min, abv_max, param_ref, sort) values
  ('biere-blonde', 'Bière blonde', 'biere', 5, 4, 5.5, 'P-60', 1),
  ('biere-blanche', 'Bière blanche', 'biere', 5, 4.5, 5.5, 'P-61', 2),
  ('biere-ipa', 'Bière IPA', 'biere', 6.5, 5.5, 7.5, 'P-62', 3),
  ('biere-ambree', 'Bière ambrée ou brune', 'biere', 6.5, 5, 8, 'P-63', 4),
  ('biere-forte', 'Bière forte ou triple', 'biere', 8.5, 7.5, 10, 'P-64', 5),
  ('biere-sans-alcool', 'Bière sans alcool', 'sans_alcool', 0.5, 0, 1.2, 'P-65', 6),
  ('cidre', 'Cidre', 'cidre', 5, 2, 6, 'P-66', 7),
  ('hard-seltzer', 'Hard seltzer ou prémix', 'cidre', 4.5, 4, 7, 'P-67', 8),
  ('vin-rouge', 'Vin rouge', 'vin', 13, 12, 14.5, 'P-68', 9),
  ('vin-blanc', 'Vin blanc', 'vin', 12, 11, 13.5, 'P-69', 10),
  ('vin-rose', 'Vin rosé', 'vin', 12.5, 11, 13.5, 'P-70', 11),
  ('effervescent', 'Effervescent (champagne, crémant…)', 'vin', 12, 11, 12.5, 'P-71', 12),
  ('vin-doux', 'Vin doux ou porto', 'aperitif', 19, 15, 22, 'P-72', 13),
  ('vermouth', 'Apéritif ou vermouth', 'aperitif', 16, 14, 18, 'P-73', 14),
  ('bitter-leger', 'Bitter apéritif léger', 'aperitif', 11, 8, 15, 'P-79', 15),
  ('pastis', 'Pastis ou anisé', 'aperitif', 45, 40, 45, 'P-75', 16),
  ('spiritueux', 'Spiritueux (vodka, gin, rhum, whisky…)', 'spiritueux', 40, 37.5, 50, 'P-74', 17),
  ('liqueur', 'Liqueur', 'liqueur', 25, 15, 35, 'P-76', 18),
  ('soft', 'Soft', 'sans_alcool', 0, 0, 0, 'P-78', 19),
  ('eau', 'Eau', 'sans_alcool', 0, 0, 0, 'P-78', 20)
on conflict (slug) do update set label = excluded.label, family = excluded.family, abv_default = excluded.abv_default,
  abv_min = excluded.abv_min, abv_max = excluded.abv_max, param_ref = excluded.param_ref, sort = excluded.sort;

insert into public.drink_type_glasses (drink_type, glass_size, is_default) values
  ('biere-blonde', 'demi', true),
  ('biere-blonde', '33cl', false),
  ('biere-blonde', 'pinte', false),
  ('biere-blanche', 'demi', true),
  ('biere-blanche', '33cl', false),
  ('biere-blanche', 'pinte', false),
  ('biere-ipa', '33cl', true),
  ('biere-ipa', 'demi', false),
  ('biere-ipa', 'pinte', false),
  ('biere-ambree', '33cl', true),
  ('biere-ambree', 'demi', false),
  ('biere-ambree', 'pinte', false),
  ('biere-forte', '33cl', true),
  ('biere-forte', 'demi', false),
  ('biere-sans-alcool', '33cl', true),
  ('biere-sans-alcool', 'demi', false),
  ('biere-sans-alcool', 'pinte', false),
  ('cidre', 'demi', true),
  ('cidre', '33cl', false),
  ('hard-seltzer', '33cl', true),
  ('vin-rouge', 'vin', true),
  ('vin-rouge', 'grand-vin', false),
  ('vin-blanc', 'vin', true),
  ('vin-blanc', 'grand-vin', false),
  ('vin-rose', 'vin', true),
  ('vin-rose', 'grand-vin', false),
  ('effervescent', 'flute', true),
  ('vin-doux', 'aperitif', true),
  ('vermouth', 'aperitif', true),
  ('vermouth', 'grand-aperitif', false),
  ('pastis', 'dose-pastis', true),
  ('spiritueux', 'dose', true),
  ('spiritueux', 'shot', false),
  ('spiritueux', 'double', false),
  ('liqueur', 'shot', true),
  ('soft', 'verre', true),
  ('eau', 'verre', true)
on conflict (drink_type, glass_size) do update set is_default = excluded.is_default;
-- END GENERATED BANK

-- ---------------------------------------------------------------------------
-- Parties and participants
-- ---------------------------------------------------------------------------
create type public.party_status as enum ('planned', 'live', 'ended');
create type public.participant_role as enum ('host', 'guest');
create type public.invite_status as enum ('invited', 'accepted', 'declined');
create type public.party_objective as enum ('desinhibe', 'zero_gdb', 'festive');
create type public.meal_kind as enum ('aucun', 'collation', 'repas');
create type public.pour_kind as enum ('dose', 'oeil');

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  starts_at timestamptz not null,
  location text check (location is null or char_length(location) <= 80),
  status public.party_status not null default 'planned',
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'ended') = (ended_at is not null))
);

create index parties_host_id_idx on public.parties (host_id);

create table public.party_participants (
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.participant_role not null default 'guest',
  invite_status public.invite_status not null default 'invited',
  objective public.party_objective,
  meal_kind public.meal_kind,
  meal_at timestamptz,
  -- Consent to show one's gauge level to the group (lot 8); off by default.
  share_gauge boolean not null default false,
  -- « Stop pour ce soir » is permanent for the party (docs/parametres-scientifiques.md#P-54).
  stop_locked_at timestamptz,
  joined_at timestamptz,
  primary key (party_id, user_id),
  check ((meal_kind is null or meal_kind = 'aucun') = (meal_at is null))
);

create index party_participants_user_id_idx on public.party_participants (user_id);

alter table public.consents
  add constraint consents_party_id_fkey foreign key (party_id) references public.parties (id) on delete cascade;
create index consents_party_id_idx on public.consents (party_id);

-- Membership helpers. security definer so policies on party_participants can use them without recursion.
create function public.is_party_member(p_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.party_participants
    where party_id = p_party_id and user_id = (select auth.uid()) and invite_status <> 'declined'
  );
$$;

create function public.is_party_host(p_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.parties where id = p_party_id and host_id = (select auth.uid()));
$$;

revoke execute on function public.is_party_member(uuid), public.is_party_host(uuid) from public, anon;
grant execute on function public.is_party_member(uuid), public.is_party_host(uuid) to authenticated;

-- The host becomes the first participant automatically.
create function public.add_host_participant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.party_participants (party_id, user_id, role, invite_status, joined_at)
  values (new.id, new.host_id, 'host', 'accepted', now());
  return new;
end;
$$;

create trigger parties_add_host
  after insert on public.parties
  for each row execute function public.add_host_participant();

-- ---------------------------------------------------------------------------
-- Planned drinks and cocktails
-- ---------------------------------------------------------------------------
create type public.planned_drink_kind as enum ('boisson', 'cocktail');

create table public.party_drinks (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties (id) on delete cascade,
  kind public.planned_drink_kind not null,
  -- Single drink: a type of the bank, its ABV (within the type's range) and its default glass.
  drink_type text references public.drink_types (slug),
  abv numeric(4, 1),
  default_glass text references public.glass_sizes (slug),
  -- Cocktail: a generic name and its ingredients; ethanol per glass is kept up to date by trigger (P-03).
  name text check (name is null or char_length(btrim(name)) between 1 and 30),
  ethanol_g numeric(5, 1) not null default 0,
  pour public.pour_kind not null default 'dose',
  created_at timestamptz not null default now(),
  check (
    (kind = 'boisson' and drink_type is not null and abv is not null and default_glass is not null and name is null)
    or (kind = 'cocktail' and drink_type is null and abv is null and default_glass is null and name is not null)
  )
);

create index party_drinks_party_id_idx on public.party_drinks (party_id);

create table public.cocktail_ingredients (
  id uuid primary key default gen_random_uuid(),
  party_drink_id uuid not null references public.party_drinks (id) on delete cascade,
  drink_type text not null references public.drink_types (slug),
  volume_ml numeric(5, 1) not null check (volume_ml > 0 and volume_ml <= 500),
  abv numeric(4, 1) not null,
  -- docs/parametres-scientifiques.md#P-01 — volume × ABV / 100 × 0.789
  ethanol_g numeric(5, 1) generated always as (round(volume_ml * abv / 100 * 0.789, 1)) stored
);

create index cocktail_ingredients_party_drink_id_idx on public.cocktail_ingredients (party_drink_id);

-- ABV must stay within the range of its bank type (docs/parametres-scientifiques.md §1.1),
-- and a single drink's default glass must be one offered for its type.
create function public.check_drink_bank()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  bounds record;
begin
  if new.drink_type is null then
    return new;
  end if;
  select abv_min, abv_max into bounds from public.drink_types where slug = new.drink_type;
  if new.abv < bounds.abv_min or new.abv > bounds.abv_max then
    raise exception 'ABV % is outside the range of %', new.abv, new.drink_type using errcode = 'check_violation';
  end if;
  if tg_table_name = 'party_drinks' then
    if not exists (
      select 1 from public.drink_type_glasses where drink_type = new.drink_type and glass_size = new.default_glass
    ) then
      raise exception 'glass % is not offered for %', new.default_glass, new.drink_type using errcode = 'check_violation';
    end if;
    -- docs/parametres-scientifiques.md#P-01 — ethanol of one default glass.
    new.ethanol_g := round(
      (select volume_ml from public.glass_sizes where slug = new.default_glass) * new.abv / 100 * 0.789, 1
    );
  end if;
  return new;
end;
$$;

create trigger party_drinks_check_bank
  before insert or update on public.party_drinks
  for each row execute function public.check_drink_bank();

create trigger cocktail_ingredients_check_bank
  before insert or update on public.cocktail_ingredients
  for each row execute function public.check_drink_bank();

-- docs/parametres-scientifiques.md#P-03 — a cocktail's ethanol is the sum of its ingredients.
-- security definer: users cannot write ethanol_g themselves; this only recomputes it from the ingredients.
create function public.refresh_cocktail_ethanol()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  drink_id uuid := coalesce(new.party_drink_id, old.party_drink_id);
begin
  update public.party_drinks
  set ethanol_g = coalesce((select sum(ethanol_g) from public.cocktail_ingredients where party_drink_id = drink_id), 0)
  where id = drink_id;
  return null;
end;
$$;

revoke execute on function public.refresh_cocktail_ethanol() from public, anon, authenticated;

create trigger cocktail_ingredients_refresh_ethanol
  after insert or update or delete on public.cocktail_ingredients
  for each row execute function public.refresh_cocktail_ethanol();

-- ---------------------------------------------------------------------------
-- Privileges and Row Level Security
-- ---------------------------------------------------------------------------
revoke all on public.glass_sizes, public.drink_types, public.drink_type_glasses from anon, authenticated;
grant select on public.glass_sizes, public.drink_types, public.drink_type_glasses to authenticated;

revoke all on public.parties, public.party_participants, public.party_drinks, public.cocktail_ingredients
  from anon, authenticated;
grant select, insert (id, title, starts_at, location), update (title, starts_at, location, status, ended_at), delete
  on public.parties to authenticated;
grant select, update (objective, meal_kind, meal_at, joined_at) on public.party_participants to authenticated;
grant select, insert (id, party_id, kind, drink_type, abv, default_glass, name, pour),
  update (abv, default_glass, name, pour), delete on public.party_drinks to authenticated;
grant select, insert (party_drink_id, drink_type, volume_ml, abv), update (volume_ml, abv), delete
  on public.cocktail_ingredients to authenticated;

alter table public.glass_sizes enable row level security;
alter table public.drink_types enable row level security;
alter table public.drink_type_glasses enable row level security;
alter table public.parties enable row level security;
alter table public.parties force row level security;
alter table public.party_participants enable row level security;
alter table public.party_participants force row level security;
alter table public.party_drinks enable row level security;
alter table public.party_drinks force row level security;
alter table public.cocktail_ingredients enable row level security;
alter table public.cocktail_ingredients force row level security;

create policy "bank: signed-in users read" on public.glass_sizes for select to authenticated using (true);
create policy "bank: signed-in users read" on public.drink_types for select to authenticated using (true);
create policy "bank: signed-in users read" on public.drink_type_glasses for select to authenticated using (true);

-- parties: members read; a user with a profile creates; the host edits and deletes.
create policy "parties: members read" on public.parties
  for select to authenticated using (public.is_party_member(id));
create policy "parties: users with a character create" on public.parties
  for insert to authenticated
  with check (host_id = (select auth.uid()) and exists (select 1 from public.profile_health where user_id = (select auth.uid())));
create policy "parties: host updates" on public.parties
  for update to authenticated using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
create policy "parties: host deletes" on public.parties
  for delete to authenticated using (host_id = (select auth.uid()));

-- party_participants: members see each other's participation; everyone edits only their own row
-- (objective, meal). Rows are created by the host trigger now, by invitations in lot 7.
create policy "party_participants: members read" on public.party_participants
  for select to authenticated using (public.is_party_member(party_id));
create policy "party_participants: participant updates own row" on public.party_participants
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- planned drinks and ingredients: members read; the host manages them (PLAN Q-12).
create policy "party_drinks: members read" on public.party_drinks
  for select to authenticated using (public.is_party_member(party_id));
create policy "party_drinks: host inserts" on public.party_drinks
  for insert to authenticated with check (public.is_party_host(party_id));
create policy "party_drinks: host updates" on public.party_drinks
  for update to authenticated using (public.is_party_host(party_id)) with check (public.is_party_host(party_id));
create policy "party_drinks: host deletes" on public.party_drinks
  for delete to authenticated using (public.is_party_host(party_id));

create policy "cocktail_ingredients: members read" on public.cocktail_ingredients
  for select to authenticated
  using (exists (select 1 from public.party_drinks d where d.id = party_drink_id and public.is_party_member(d.party_id)));
create policy "cocktail_ingredients: host manages" on public.cocktail_ingredients
  for all to authenticated
  using (exists (select 1 from public.party_drinks d where d.id = party_drink_id and public.is_party_host(d.party_id)))
  with check (exists (select 1 from public.party_drinks d where d.id = party_drink_id and public.is_party_host(d.party_id)));
