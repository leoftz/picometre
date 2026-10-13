-- Lot 5 — drinks actually consumed during a party (PLAN §2). Owner only: never visible to the group.
-- Each row freezes what was drunk (label, volume, ABV, grams) so editing or removing a planned drink
-- never rewrites history. The id is generated on the device so an offline entry can be replayed safely.

create table public.consumptions (
  id uuid primary key,
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  party_drink_id uuid references public.party_drinks (id) on delete set null,
  glass_size text references public.glass_sizes (slug),
  -- Share of the glass actually drunk: ½, 1 or 2 glasses.
  portion numeric(2, 1) not null default 1 check (portion in (0.5, 1, 2)),
  consumed_at timestamptz not null default now(),
  -- Frozen at entry time by trigger (docs/parametres-scientifiques.md#P-01, #P-03); the defaults are
  -- placeholders the trigger always overwrites (and clients cannot write these columns).
  label text not null default '',
  volume_ml numeric(6, 1) not null default 0,
  abv numeric(4, 1),
  ethanol_g numeric(5, 1) not null default 0,
  pour public.pour_kind not null default 'dose',
  is_water boolean not null default false,
  created_at timestamptz not null default now(),
  check (consumed_at <= created_at + interval '5 minutes')
);

create index consumptions_party_user_idx on public.consumptions (party_id, user_id, consumed_at);
create index consumptions_user_id_idx on public.consumptions (user_id);
create index consumptions_party_drink_id_idx on public.consumptions (party_drink_id);

create function public.freeze_consumption()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  drink record;
  glass_ml numeric;
begin
  select d.kind, d.party_id, d.drink_type, d.abv, d.default_glass, d.name, d.ethanol_g, d.pour, t.label as type_label
  into drink
  from public.party_drinks d
  left join public.drink_types t on t.slug = d.drink_type
  where d.id = new.party_drink_id;

  if not found or drink.party_id <> new.party_id then
    raise exception 'this drink is not planned for this party' using errcode = 'check_violation';
  end if;

  new.pour := drink.pour;
  if drink.kind = 'cocktail' then
    new.glass_size := null;
    new.label := drink.name;
    new.abv := null;
    new.volume_ml := 0;
    new.ethanol_g := round(drink.ethanol_g * new.portion, 1);
    new.is_water := false;
  else
    new.glass_size := coalesce(new.glass_size, drink.default_glass);
    if not exists (
      select 1 from public.drink_type_glasses where drink_type = drink.drink_type and glass_size = new.glass_size
    ) then
      raise exception 'glass % is not offered for %', new.glass_size, drink.drink_type using errcode = 'check_violation';
    end if;
    select volume_ml into glass_ml from public.glass_sizes where slug = new.glass_size;
    new.label := drink.type_label;
    new.abv := drink.abv;
    new.volume_ml := glass_ml * new.portion;
    new.ethanol_g := round(new.volume_ml * drink.abv / 100 * 0.789, 1);
    new.is_water := drink.drink_type = 'eau';
  end if;
  return new;
end;
$$;

revoke execute on function public.freeze_consumption() from public, anon, authenticated;

create trigger consumptions_freeze
  before insert on public.consumptions
  for each row execute function public.freeze_consumption();

revoke all on public.consumptions from anon, authenticated;
grant select, insert (id, party_id, party_drink_id, glass_size, portion, consumed_at), delete
  on public.consumptions to authenticated;

alter table public.consumptions enable row level security;
alter table public.consumptions force row level security;

create policy "consumptions: owner reads" on public.consumptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "consumptions: member records own drink" on public.consumptions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_party_member(party_id));
create policy "consumptions: owner deletes" on public.consumptions
  for delete to authenticated using (user_id = (select auth.uid()));
