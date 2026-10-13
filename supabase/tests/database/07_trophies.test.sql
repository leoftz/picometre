-- Lot 9: trophies are awarded by the database at the end of a party, never written directly, and seen by
-- the group only while their owner shares their gauge.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000d', 'd@test.local', 'authenticated', 'authenticated');
insert into public.profiles (id, pseudo, avatar, birth_year) values
  ('00000000-0000-0000-0000-00000000000a', 'Alix', 'citron', 1990),
  ('00000000-0000-0000-0000-00000000000b', 'Bao', 'menthe', 1991),
  ('00000000-0000-0000-0000-00000000000c', 'Cam', 'lune', 1992),
  ('00000000-0000-0000-0000-00000000000d', 'Dom', 'nuit', 1993);
insert into public.profile_health (user_id, sex, height_cm, weight_kg, habit)
values ('00000000-0000-0000-0000-00000000000a', 'f', 168, 60, 'occasionnel');
insert into public.parties (id, host_id, title, starts_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'Raclette', now()),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-00000000000a', 'Solo', now());
insert into public.party_participants (party_id, user_id, role, invite_status, joined_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000b', 'guest', 'accepted', now()),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000c', 'guest', 'accepted', now()),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000d', 'guest', 'accepted', now());
update public.participant_private set objective = 'zero_gdb', meal_kind = 'aucun'
where user_id = '00000000-0000-0000-0000-00000000000a';
update public.participant_private set objective = 'festive', meal_kind = 'aucun', stop_locked_at = now()
where user_id = '00000000-0000-0000-0000-00000000000b' and party_id = '00000000-0000-0000-0000-0000000000f1';

insert into public.party_drinks (id, party_id, kind, drink_type, abv, default_glass, added_by) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1', 'boisson', 'biere-ipa', 6.5, '33cl', '00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f1', 'boisson', 'eau', 0, 'verre', '00000000-0000-0000-0000-00000000000a');
-- A: 1 IPA, 2 waters · B: 3 IPA, 1 water · C: 2 waters · D: 4 IPA, 2 waters.
insert into public.consumptions (id, party_id, user_id, party_drink_id)
select gen_random_uuid(), '00000000-0000-0000-0000-0000000000f1', u::uuid, d::uuid
from (values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-00000000000d', '00000000-0000-0000-0000-0000000000e2')
) as v(u, d);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

-- ---------------------------------------------------------------- A, B and C share; D keeps their gauge private
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f1', 'v');
insert into public.gauge_shares (party_id, level) values ('00000000-0000-0000-0000-0000000000f1', 2);
select is((select peak_level from public.gauge_shares)::int, 2, 'the peak follows the level');
update public.gauge_shares set level = 1, peak_level = 1;
select is((select peak_level from public.gauge_shares)::int, 2, 'a peak never goes down');
select throws_ok(
  $$ insert into public.trophies (party_id, user_id, kind)
     values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'capitaine') $$,
  '42501', null, 'nobody writes a trophy directly'
);
select is(public.claim_landing_trophy('00000000-0000-0000-0000-0000000000f1'), false, 'no landing trophy before the end');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f1', 'v');
insert into public.gauge_shares (party_id, level, stopped) values ('00000000-0000-0000-0000-0000000000f1', 3, true);
select is((select peak_level from public.gauge_shares where user_id = '00000000-0000-0000-0000-00000000000b')::int, 4, 'a Stop is a level-4 peak');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f1', 'v');
insert into public.gauge_shares (party_id, level) values ('00000000-0000-0000-0000-0000000000f1', 1);

-- ---------------------------------------------------------------- the host ends the party
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
update public.parties set status = 'ended', ended_at = now() where id = '00000000-0000-0000-0000-0000000000f1';
reset role;
select set_eq(
  $$ select user_id::text || ':' || kind::text from public.trophies where party_id = '00000000-0000-0000-0000-0000000000f1' $$,
  array[
    '00000000-0000-0000-0000-00000000000a:joker_eau',
    '00000000-0000-0000-0000-00000000000c:joker_eau',
    '00000000-0000-0000-0000-00000000000d:joker_eau',
    '00000000-0000-0000-0000-00000000000c:capitaine'
  ],
  'joker eau: 1 water per 2 alcoholic drinks and at least 2; capitaine: lowest peak among those who share'
);
set local role authenticated;

-- ---------------------------------------------------------------- landing: claimed by the device, checked by the database
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select is(public.claim_landing_trophy('00000000-0000-0000-0000-0000000000f1'), true, 'A kept their objective within its cap');
select is(public.claim_landing_trophy('00000000-0000-0000-0000-0000000000f1'), true, 'claiming twice is harmless');
select is(
  (select count(*) from public.trophies where kind = 'atterrissage')::int, 1, 'one landing trophy only'
);
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is(public.claim_landing_trophy('00000000-0000-0000-0000-0000000000f1'), false, 'no landing trophy after a Stop');
select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select is(public.claim_landing_trophy('00000000-0000-0000-0000-0000000000f1'), false, 'no landing trophy without an objective');

-- ---------------------------------------------------------------- who sees what
select is(
  (select count(*) from public.trophies where user_id = '00000000-0000-0000-0000-00000000000d')::int, 1, 'D sees their own trophy'
);
select is(
  (select count(*) from public.trophies where user_id <> '00000000-0000-0000-0000-00000000000d')::int, 4,
  'D sees the trophies of those who share (A: 2, C: 2)'
);
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is(
  (select count(*) from public.trophies where user_id = '00000000-0000-0000-0000-00000000000d')::int, 0,
  'B does not see the trophy of D, who keeps their gauge private'
);
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
update public.consents set revoked_at = now() where kind = 'gauge_sharing' and revoked_at is null;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is(
  (select count(*) from public.trophies where user_id = '00000000-0000-0000-0000-00000000000c')::int, 0,
  'once C stops sharing, their trophies are private again'
);
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select is(
  (select count(*) from public.trophies where user_id = '00000000-0000-0000-0000-00000000000c')::int, 2, 'C still sees their own trophies'
);

-- ---------------------------------------------------------------- capitaine needs at least two people sharing
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f2', 'v');
insert into public.gauge_shares (party_id, level) values ('00000000-0000-0000-0000-0000000000f2', 1);
update public.parties set status = 'ended', ended_at = now() where id = '00000000-0000-0000-0000-0000000000f2';
select is(
  (select count(*) from public.trophies where party_id = '00000000-0000-0000-0000-0000000000f2')::int, 0,
  'alone, nobody is capitaine'
);

-- ---------------------------------------------------------------- strangers
reset role;
insert into auth.users (id, email, aud, role) values ('00000000-0000-0000-0000-0000000000e0', 'e@test.local', 'authenticated', 'authenticated');
insert into public.profiles (id, pseudo, avatar, birth_year) values ('00000000-0000-0000-0000-0000000000e0', 'Eli', 'bulle', 1990);
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e0');
select is((select count(*) from public.trophies)::int, 0, 'outside the party, nothing is visible');
select is(public.claim_landing_trophy('00000000-0000-0000-0000-0000000000f1'), false, 'outside the party, nothing can be claimed');
select is(
  (select count(*) from information_schema.role_table_grants where table_name = 'trophies' and grantee = 'authenticated' and privilege_type <> 'SELECT')::int,
  0, 'signed-in users can only read trophies'
);

select * from finish();
rollback;
