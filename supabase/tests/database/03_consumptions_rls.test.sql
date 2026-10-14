-- Lot 5: consumptions are frozen at entry and strictly private, even inside a party.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.local', 'authenticated', 'authenticated');
insert into public.profiles (id, pseudo, avatar, birth_year) values
  ('00000000-0000-0000-0000-00000000000a', 'hote', 'citron', 1990),
  ('00000000-0000-0000-0000-00000000000b', 'invite', 'menthe', 1991),
  ('00000000-0000-0000-0000-00000000000c', 'inconnu', 'lune', 1992);
insert into public.profile_health (user_id, sex, height_cm, weight_kg, habit) values
  ('00000000-0000-0000-0000-00000000000a', 'm', 180, 80, 'regulier'),
  ('00000000-0000-0000-0000-00000000000b', 'f', 165, 55, 'occasionnel'),
  ('00000000-0000-0000-0000-00000000000c', 'f', 170, 60, 'occasionnel');
insert into public.parties (id, host_id, title, starts_at) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a', 'Soirée', now()),
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-00000000000c', 'Autre soirée', now());
insert into public.party_participants (party_id, user_id, role, invite_status, joined_at)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b', 'guest', 'accepted', now());
insert into public.party_drinks (id, party_id, kind, drink_type, abv, default_glass, added_by) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'boisson', 'biere-ipa', 6.5, '33cl', '00000000-0000-0000-0000-00000000000a'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'boisson', 'eau', 0, 'verre', '00000000-0000-0000-0000-00000000000a'),
  ('66666666-6666-6666-6666-666666666666', '99999999-9999-9999-9999-999999999999', 'boisson', 'vin-rouge', 13, 'vin', '00000000-0000-0000-0000-00000000000c');
insert into public.party_drinks (id, party_id, kind, name, added_by)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'cocktail', 'Margarita', '00000000-0000-0000-0000-00000000000a');
insert into public.cocktail_ingredients (party_drink_id, drink_type, volume_ml, abv) values
  ('33333333-3333-3333-3333-333333333333', 'spiritueux', 50, 40),
  ('33333333-3333-3333-3333-333333333333', 'liqueur', 20, 30);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

-- ---------------------------------------------------------------- B records drinks
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select lives_ok(
  $$ insert into public.consumptions (id, party_id, party_drink_id, glass_size)
     values ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'pinte') $$,
  'a guest records a pint of the planned IPA'
);
select results_eq(
  $$ select label, volume_ml, abv, ethanol_g, is_water from public.consumptions where id = 'a0000000-0000-0000-0000-000000000001' $$,
  $$ values ('Bière IPA'::text, 500.0::numeric, 6.5::numeric, 25.6::numeric, false) $$,
  'label, volume, ABV and grams are frozen from the bank (P-01)'
);
select lives_ok(
  $$ insert into public.consumptions (id, party_id, party_drink_id, portion)
     values ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 0.5) $$,
  'half a cocktail'
);
select is((select ethanol_g from public.consumptions where id = 'a0000000-0000-0000-0000-000000000002'), 10.3, 'half of the 20.5 g recipe (P-03)');
select lives_ok(
  $$ insert into public.consumptions (id, party_id, party_drink_id)
     values ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555') $$,
  'a glass of water'
);
select is((select is_water from public.consumptions where id = 'a0000000-0000-0000-0000-000000000003'), true, 'water is flagged (joker eau)');

select throws_ok(
  $$ insert into public.consumptions (id, party_id, party_drink_id, glass_size)
     values (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'flute') $$,
  '23514', null, 'a glass not offered for the drink is refused'
);
select throws_ok(
  $$ insert into public.consumptions (id, party_id, party_drink_id, consumed_at)
     values (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', now() + interval '1 hour') $$,
  '23514', null, 'a drink cannot be recorded in the future'
);
select throws_ok(
  $$ insert into public.consumptions (id, party_id, party_drink_id, ethanol_g, label, volume_ml, pour, is_water)
     values (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 0, 'x', 0, 'dose', true) $$,
  '42501', null, 'grams cannot be supplied by the client'
);
select throws_ok(
  $$ insert into public.consumptions (id, party_id, party_drink_id)
     values (gen_random_uuid(), '99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666') $$,
  null, null, 'no drink in a party one is not part of'
);
select throws_ok(
  $$ insert into public.consumptions (id, party_id, party_drink_id)
     values ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  '23505', null, 'replaying an offline entry with the same id does not duplicate it'
);

-- ---------------------------------------------------------------- strictly private, even for the host
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*) from public.consumptions)::int, 0, 'the host does not see the guest''s drinks');
delete from public.consumptions;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select is((select count(*) from public.consumptions)::int, 0, 'a stranger does not see them either');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*) from public.consumptions)::int, 3, 'the host''s delete did not touch the guest''s drinks');

-- ---------------------------------------------------------------- history survives plan changes
reset role;
delete from public.party_drinks where id = '22222222-2222-2222-2222-222222222222';
select is(
  (select ethanol_g from public.consumptions where id = 'a0000000-0000-0000-0000-000000000001'), 25.6,
  'removing the planned drink keeps the recorded pint'
);
delete from auth.users where id = '00000000-0000-0000-0000-00000000000b';
select is((select count(*) from public.consumptions where user_id = '00000000-0000-0000-0000-00000000000b')::int, 0, 'account deletion erases consumptions');

-- Live gauge on every device (RLS still decides who receives what).
reset role;
select ok(
  exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'consumptions'),
  'consumptions are published to Realtime'
);

select * from finish();
rollback;
