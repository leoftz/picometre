-- RLS of lot 3 (PLAN §2): a user only ever reads and writes their own account data.
-- Run with `supabase test db` on the local stack (never against production).
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Three fictitious users: A, B and C.
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.local', 'authenticated', 'authenticated');

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

-- ---------------------------------------------------------------- A signs up
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');

select throws_ok(
  $$ insert into public.profiles (pseudo, avatar, birth_year) values ('leo', 'citron', 1995) $$,
  '42501', null, 'no profile before the terms are accepted'
);

select lives_ok($$ insert into public.consents (kind, version) values ('cgu', '2026-10-13') $$, 'A accepts the terms');
select lives_ok(
  $$ insert into public.profiles (pseudo, avatar, birth_year) values ('leo', 'citron', 1995) $$,
  'A creates a profile once the terms are accepted'
);

select throws_ok(
  $$ insert into public.profile_health (sex, height_cm, weight_kg, habit) values ('m', 180, 80, 'regulier') $$,
  '42501', null, 'no health data without the explicit health-data consent'
);

select lives_ok($$ insert into public.consents (kind, version) values ('health_data', '2026-10-13') $$, 'A consents to health data');
select lives_ok(
  $$ insert into public.profile_health (sex, height_cm, weight_kg, habit) values ('m', 180, 80, 'regulier') $$,
  'A stores health data with consent'
);

select throws_ok(
  $$ insert into public.consents (kind, version) values ('cgu', 'v2') $$,
  '23505', null, 'one active consent of a kind at a time'
);

-- ---------------------------------------------------------------- guards
select throws_ok(
  format($$ update public.profiles set birth_year = %s $$, extract(year from now())::int - 10),
  '23514', 'Picomètre is for adults only', 'the database refuses a minor birth year'
);
select throws_ok(
  $$ update public.profiles set pseudo = 'a b' $$,
  '23514', null, 'pseudo: letters, digits, dot, dash, underscore only'
);

-- ---------------------------------------------------------------- B is isolated from A
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
insert into public.consents (kind, version) values ('cgu', '2026-10-13');

select is((select count(*) from public.profiles)::int, 0, 'B does not see A''s profile');
select is((select count(*) from public.profile_health)::int, 0, 'B never sees A''s health data');
select is((select count(*) from public.consents)::int, 1, 'B only sees their own consents');

select throws_ok(
  $$ insert into public.profiles (pseudo, avatar, birth_year) values ('LEO', 'menthe', 1990) $$,
  '23505', null, 'pseudos are unique regardless of case'
);
select throws_ok(
  $$ insert into public.profiles (id, pseudo, avatar, birth_year) values ('00000000-0000-0000-0000-00000000000a', 'intrus', 'menthe', 1990) $$,
  '42501', null, 'B cannot create a profile for A'
);

update public.profiles set pseudo = 'pirate' where id = '00000000-0000-0000-0000-00000000000a';
update public.profile_health set weight_kg = 40 where user_id = '00000000-0000-0000-0000-00000000000a';
update public.consents set revoked_at = now() where user_id = '00000000-0000-0000-0000-00000000000a';
delete from public.profile_health where user_id = '00000000-0000-0000-0000-00000000000a';

select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select is((select pseudo::text from public.profiles), 'leo', 'B''s update did not touch A''s profile');
select is((select weight_kg from public.profile_health), 80.0, 'B''s update and delete did not touch A''s health data');
select is((select count(*) from public.consents where revoked_at is null)::int, 2, 'B could not revoke A''s consents');

-- ---------------------------------------------------------------- anonymous visitors
reset role;
set local role anon;
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anon cannot read profiles');
select throws_ok($$ select * from public.profile_health $$, '42501', null, 'anon cannot read health data');
select throws_ok($$ select * from public.consents $$, '42501', null, 'anon cannot read consents');

-- ---------------------------------------------------------------- consent withdrawal
reset role;
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');

update public.consents set revoked_at = now() where kind = 'health_data';
select is((select count(*) from public.profile_health)::int, 0, 'withdrawing the health consent erases the health data');
select throws_ok(
  $$ update public.consents set revoked_at = null where kind = 'health_data' $$,
  '23514', null, 'a revoked consent cannot be re-activated'
);

-- ---------------------------------------------------------------- account deletion
reset role;
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
select is((select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000a')::int, 0, 'deleting the account deletes the profile');
select is((select count(*) from public.consents where user_id = '00000000-0000-0000-0000-00000000000a')::int, 0, 'deleting the account deletes the consents');

select * from finish();
rollback;
