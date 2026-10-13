-- RLS and integrity of lot 4: drink bank, parties, participants, planned drinks and cocktails.
begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

-- A hosts, B is a guest (added directly, invitations come in lot 7), C is a stranger. D has no character yet.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000d', 'd@test.local', 'authenticated', 'authenticated');
insert into public.profiles (id, pseudo, avatar, birth_year) values
  ('00000000-0000-0000-0000-00000000000a', 'hote', 'citron', 1990),
  ('00000000-0000-0000-0000-00000000000b', 'invite', 'menthe', 1991),
  ('00000000-0000-0000-0000-00000000000c', 'inconnu', 'lune', 1992),
  ('00000000-0000-0000-0000-00000000000d', 'novice', 'nuit', 1993);
insert into public.profile_health (user_id, sex, height_cm, weight_kg, habit) values
  ('00000000-0000-0000-0000-00000000000a', 'm', 180, 80, 'regulier'),
  ('00000000-0000-0000-0000-00000000000b', 'f', 165, 55, 'occasionnel'),
  ('00000000-0000-0000-0000-00000000000c', 'f', 170, 60, 'occasionnel');

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- ---------------------------------------------------------------- bank
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*) from public.drink_types)::int, 20, 'the bank lists 20 drink types (P-60 to P-79)');
select is((select count(*) from public.glass_sizes)::int, 13, 'the bank lists 13 glasses (P-80 to P-93)');
select is((select count(*) from public.drink_type_glasses where is_default)::int, 19, 'each served type has exactly one default glass');
select throws_ok($$ update public.drink_types set abv_default = 1 $$, '42501', null, 'users cannot edit the bank');

-- ---------------------------------------------------------------- party creation
select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select throws_ok(
  $$ insert into public.parties (title, starts_at) values ('Trop tôt', now()) $$,
  '42501', null, 'no party before the character (health data) exists'
);

select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.parties (id, title, starts_at) values ('11111111-1111-1111-1111-111111111111', 'Crémaillère', now());
select results_eq(
  $$ select role::text, invite_status::text from public.party_participants $$,
  $$ values ('host', 'accepted') $$,
  'the host is added as the first participant'
);

-- ---------------------------------------------------------------- planned drinks
insert into public.party_drinks (id, party_id, kind, drink_type, abv, default_glass)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'boisson', 'biere-ipa', 6.5, '33cl');
select is(
  (select ethanol_g from public.party_drinks where id = '22222222-2222-2222-2222-222222222222'), 16.9,
  'ethanol of a 33 cl IPA at 6.5 % is computed (P-01): 16.9 g'
);
select throws_ok(
  $$ insert into public.party_drinks (party_id, kind, drink_type, abv, default_glass)
     values ('11111111-1111-1111-1111-111111111111', 'boisson', 'biere-ipa', 12, '33cl') $$,
  '23514', null, 'an ABV outside the type''s range is refused'
);
select throws_ok(
  $$ insert into public.party_drinks (party_id, kind, drink_type, abv, default_glass)
     values ('11111111-1111-1111-1111-111111111111', 'boisson', 'biere-ipa', 6.5, 'flute') $$,
  '23514', null, 'a glass not offered for the type is refused'
);

insert into public.party_drinks (id, party_id, kind, name)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'cocktail', 'Margarita maison');
insert into public.cocktail_ingredients (party_drink_id, drink_type, volume_ml, abv) values
  ('33333333-3333-3333-3333-333333333333', 'spiritueux', 50, 40),
  ('33333333-3333-3333-3333-333333333333', 'liqueur', 20, 30);
select is(
  (select ethanol_g from public.party_drinks where id = '33333333-3333-3333-3333-333333333333'), 20.5,
  'a cocktail sums its ingredients (P-03, R-05 Margarita: 20.5 g)'
);
delete from public.cocktail_ingredients where drink_type = 'liqueur';
select is(
  (select ethanol_g from public.party_drinks where id = '33333333-3333-3333-3333-333333333333'), 15.8,
  'removing an ingredient updates the cocktail'
);
select throws_ok(
  $$ insert into public.cocktail_ingredients (party_drink_id, drink_type, volume_ml, abv)
     values ('33333333-3333-3333-3333-333333333333', 'spiritueux', 50, 80) $$,
  '23514', null, 'ingredient ABV must stay within its type''s range'
);

-- ---------------------------------------------------------------- a stranger sees nothing
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select is((select count(*) from public.parties)::int, 0, 'a stranger does not see the party');
select is((select count(*) from public.party_participants)::int, 0, 'a stranger does not see the participants');
select is((select count(*) from public.party_drinks)::int, 0, 'a stranger does not see the planned drinks');
select is((select count(*) from public.cocktail_ingredients)::int, 0, 'a stranger does not see cocktail recipes');
select throws_ok(
  $$ insert into public.party_drinks (party_id, kind, drink_type, abv, default_glass)
     values ('11111111-1111-1111-1111-111111111111', 'boisson', 'vin-rouge', 13, 'vin') $$,
  '42501', null, 'a stranger cannot add drinks to the party'
);

-- ---------------------------------------------------------------- a guest reads, edits only their own participation
reset role;
insert into public.party_participants (party_id, user_id, role, invite_status, joined_at)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b', 'guest', 'accepted', now());
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');

select is((select count(*) from public.parties)::int, 1, 'a guest sees the party');
select is((select count(*) from public.party_participants)::int, 2, 'a guest sees who takes part');
select is((select count(*) from public.party_drinks)::int, 2, 'a guest sees the planned drinks');
select lives_ok(
  $$ insert into public.party_drinks (id, party_id, kind, drink_type, abv, default_glass)
     values ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'boisson', 'vin-rouge', 13, 'vin') $$,
  'a guest adds their own drink (PLAN Q-12)'
);
select is(
  (select added_by from public.party_drinks where id = '44444444-4444-4444-4444-444444444444'),
  '00000000-0000-0000-0000-00000000000b'::uuid, 'the drink is recorded as added by the guest'
);
select throws_ok(
  $$ insert into public.party_drinks (party_id, kind, drink_type, abv, default_glass, added_by)
     values ('11111111-1111-1111-1111-111111111111', 'boisson', 'vin-rouge', 13, 'vin', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null, 'nobody can add a drink in someone else''s name'
);
select lives_ok(
  $$ update public.party_drinks set abv = 13.5 where id = '44444444-4444-4444-4444-444444444444' $$,
  'a guest edits their own drink'
);
select is((select abv from public.party_drinks where id = '44444444-4444-4444-4444-444444444444'), 13.5, 'and the edit is saved');
update public.party_drinks set abv = 5.5 where kind = 'boisson' and drink_type = 'biere-ipa';
delete from public.party_drinks where id <> '44444444-4444-4444-4444-444444444444';
delete from public.cocktail_ingredients;
update public.parties set title = 'Piraté';

select lives_ok(
  $$ update public.participant_private set objective = 'zero_gdb', meal_kind = 'repas', meal_at = now()
     where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  'a guest sets their own objective and meal'
);
update public.participant_private set objective = 'festive' where user_id = '00000000-0000-0000-0000-00000000000a';
select throws_ok(
  $$ update public.party_participants set share_gauge = true where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  '42501', null, 'gauge sharing cannot be switched on by a plain update (consent flow, lot 8)'
);
select throws_ok(
  $$ update public.participant_private set meal_kind = 'repas', meal_at = null where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  '23514', null, 'a meal needs a time'
);

select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select is((select abv from public.party_drinks where drink_type = 'biere-ipa'), 6.5, 'the guest could not edit the host''s drinks');
select is((select count(*) from public.party_drinks)::int, 3, 'the guest could not delete the host''s drinks');
select is((select count(*) from public.cocktail_ingredients)::int, 1, 'nor the host''s cocktail recipe');
select lives_ok(
  $$ delete from public.party_drinks where id = '44444444-4444-4444-4444-444444444444' $$,
  'the host can remove a guest''s drink'
);
select is((select count(*) from public.party_drinks)::int, 2, 'and it is gone');
select is((select title from public.parties), 'Crémaillère', 'the guest could not rename the party');
select is(
  (select objective::text from public.participant_private where user_id = '00000000-0000-0000-0000-00000000000a'), null,
  'the guest could not change the host''s objective'
);

-- ---------------------------------------------------------------- deletion
delete from public.parties where id = '11111111-1111-1111-1111-111111111111';
reset role;
select is(
  (select count(*) from public.party_drinks where party_id = '11111111-1111-1111-1111-111111111111')::int, 0,
  'deleting the party deletes its drinks'
);
select is(
  (select count(*) from public.cocktail_ingredients where party_drink_id = '33333333-3333-3333-3333-333333333333')::int, 0,
  'and its cocktail recipes'
);

select * from finish();
rollback;
