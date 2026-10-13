-- Lot 8: per-party consent to share one's gauge level, what the group sees, and immediate revocation.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

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
insert into public.parties (id, host_id, title, starts_at)
values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'Raclette', now());
-- B accepted, D still invited, C not invited.
insert into public.party_participants (party_id, user_id, role, invite_status, joined_at) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000b', 'guest', 'accepted', now()),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000d', 'guest', 'invited', null);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

-- ---------------------------------------------------------------- no consent, no sharing
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select hasnt_column('public', 'gauge_shares', 'bac', 'no value in g/L is ever shared');
select throws_ok(
  $$ insert into public.gauge_shares (party_id, level) values ('00000000-0000-0000-0000-0000000000f1', 2) $$,
  '42501', null, 'A cannot publish a level without consenting'
);
select throws_ok(
  $$ update public.party_participants set share_gauge = true where user_id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'the sharing flag cannot be set directly, only through the consent'
);

-- ---------------------------------------------------------------- consent, then publish
select lives_ok(
  $$ insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f1', '2026-10-13') $$,
  'A consents to share with this party'
);
select is(
  (select share_gauge from public.party_participants where user_id = '00000000-0000-0000-0000-00000000000a'), true,
  'the consent turns the sharing flag on'
);
select lives_ok(
  $$ insert into public.gauge_shares (party_id, level, schedule)
     values ('00000000-0000-0000-0000-0000000000f1', 3, '[{"at": "2026-10-13T23:00:00Z", "level": 2}]') $$,
  'A publishes a level and its schedule'
);
select throws_ok(
  $$ update public.gauge_shares set schedule = '[{"at": "2026-10-13T23:00:00Z", "level": 2, "bac": 0.6}]' $$,
  '23514', 'invalid schedule entry', 'the schedule cannot carry anything but a time and a level'
);
select throws_ok(
  $$ update public.gauge_shares set level = 5 $$,
  '23514', null, 'a level is 1 to 4'
);
select throws_ok(
  $$ insert into public.gauge_shares (party_id, user_id, level)
     values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000b', 1) $$,
  '42501', null, 'A cannot publish for B'
);
update public.gauge_shares set stopped = true;
update public.gauge_shares set stopped = false, level = 1;
select is((select stopped from public.gauge_shares), true, 'a shared Stop stays for the party');

-- ---------------------------------------------------------------- who sees it
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is((select level from public.gauge_shares)::int, 1, 'B, an accepted member, sees A''s level');
select is((select count(*) from public.party_participants where share_gauge)::int, 1, 'B sees that A shares');
update public.gauge_shares set level = 4;
select is((select level from public.gauge_shares)::int, 1, 'B cannot change A''s level (RLS)');
delete from public.gauge_shares;
select is((select count(*) from public.gauge_shares)::int, 1, 'B cannot erase A''s level (RLS)');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select is((select count(*) from public.gauge_shares)::int, 0, 'D, not yet accepted, does not see it');
select throws_ok(
  $$ insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f1', '2026-10-13') $$,
  '23514', 'only a participant can share their gauge with this party', 'D cannot share before accepting'
);

select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select is((select count(*) from public.gauge_shares)::int, 0, 'C, outside the party, sees nothing');
select throws_ok(
  $$ insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f1', '2026-10-13') $$,
  '23514', 'only a participant can share their gauge with this party', 'C cannot share with a party they are not in'
);

-- ---------------------------------------------------------------- B shares too, then leaves
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f1', '2026-10-13');
insert into public.gauge_shares (party_id, level) values ('00000000-0000-0000-0000-0000000000f1', 2);
delete from public.party_participants where user_id = '00000000-0000-0000-0000-00000000000b';
select is((select count(*) from public.gauge_shares where user_id = '00000000-0000-0000-0000-00000000000b')::int, 0, 'leaving the party erases B''s shared level');
select isnt(
  (select revoked_at from public.consents where kind = 'gauge_sharing' and user_id = '00000000-0000-0000-0000-00000000000b'), null,
  'leaving the party ends B''s sharing consent'
);

-- ---------------------------------------------------------------- revocation is immediate
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
update public.consents set revoked_at = now() where kind = 'gauge_sharing' and revoked_at is null;
select is((select count(*) from public.gauge_shares)::int, 0, 'revoking erases A''s shared level at once');
select is(
  (select share_gauge from public.party_participants where user_id = '00000000-0000-0000-0000-00000000000a'), false,
  'revoking turns the sharing flag off'
);
select throws_ok(
  $$ insert into public.gauge_shares (party_id, level) values ('00000000-0000-0000-0000-0000000000f1', 2) $$,
  '42501', null, 'after revoking, A can no longer publish'
);
select lives_ok(
  $$ insert into public.consents (kind, party_id, version) values ('gauge_sharing', '00000000-0000-0000-0000-0000000000f1', '2026-10-13') $$,
  'A may consent again later (a new line in the journal)'
);

select * from finish();
rollback;
