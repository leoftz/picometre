-- Lot 6: the Stop is permanent, and objective/meal/Stop are private (participant_private).
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local', 'authenticated', 'authenticated');
insert into public.profiles (id, pseudo, avatar, birth_year) values
  ('00000000-0000-0000-0000-00000000000a', 'hote', 'citron', 1990),
  ('00000000-0000-0000-0000-00000000000b', 'invite', 'menthe', 1991);
insert into public.parties (id, host_id, title, starts_at)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000a', 'Soirée', now());
insert into public.party_participants (party_id, user_id, role, invite_status, joined_at)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b', 'guest', 'accepted', now());

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');

select throws_ok(
  $$ update public.participant_private set stop_locked_at = now() + interval '1 hour' where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  '23514', null, 'a Stop cannot be dated in the future'
);
select lives_ok(
  $$ update public.participant_private set stop_locked_at = now() where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  'the guest''s device records their Stop'
);
select throws_ok(
  $$ update public.participant_private set stop_locked_at = null where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  '23514', 'the Stop of this party is permanent', 'the Stop cannot be cleared'
);
select throws_ok(
  $$ update public.participant_private set stop_locked_at = now() - interval '1 hour' where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  '23514', 'the Stop of this party is permanent', 'nor moved'
);

update public.participant_private set stop_locked_at = now() where user_id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select is(
  (select stop_locked_at from public.participant_private where user_id = '00000000-0000-0000-0000-00000000000a'), null,
  'nobody can set a Stop for someone else'
);
select is(
  (select count(*) from public.participant_private where user_id = '00000000-0000-0000-0000-00000000000b')::int, 0,
  'the host does not see the guest''s objective, meal or Stop'
);
select is((select count(*) from public.party_participants)::int, 2, 'but still sees who takes part');
select hasnt_column('public', 'party_participants', 'objective', 'objectives are no longer in the group-readable table');
select hasnt_column('public', 'party_participants', 'stop_locked_at', 'nor the Stop');

select * from finish();
rollback;
