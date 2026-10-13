-- Lot 7: friends, invitation links, party invitations, and what others may see of a profile.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

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

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

-- ---------------------------------------------------------------- cards: pseudo and avatar only
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*) from public.profile_cards)::int, 1, 'before any link, A only sees their own card');
select hasnt_column('public', 'profile_cards', 'birth_year', 'cards never carry the birth year');

-- ---------------------------------------------------------------- request by pseudo, with acceptance
select is(public.send_friend_request('personne'), 'introuvable', 'unknown pseudo');
select is(public.send_friend_request('alix'), 'soi-meme', 'cannot befriend oneself (pseudo is case-insensitive)');
select is(public.send_friend_request('BAO'), 'envoye', 'A asks B by pseudo');
select is(public.send_friend_request('Bao'), 'deja-demande', 'no duplicate request');
select is((select status::text from public.friendships), 'pending', 'the request waits for B');
select is(
  (select count(*) from public.profile_cards where pseudo = 'Bao')::int, 1,
  'A sees the card of the person they asked'
);
update public.friendships set status = 'accepted';
select is((select status::text from public.friendships), 'pending', 'the requester''s accept is silently ignored (RLS)');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select lives_ok($$ update public.friendships set status = 'accepted' $$, 'B accepts');
select isnt((select responded_at from public.friendships), null, 'the answer is timestamped');
select throws_ok(
  $$ update public.friendships set status = 'declined' $$,
  '23514', 'only a pending request can be answered', 'an answer is final'
);

-- ---------------------------------------------------------------- strangers and direct inserts
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select is((select count(*) from public.friendships)::int, 0, 'C does not see A and B''s friendship');
select is((select count(*) from public.profile_cards)::int, 1, 'C only sees their own card');
select throws_ok(
  $$ insert into public.friendships (requester_id, addressee_id, status)
     values ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000a', 'accepted') $$,
  '42501', null, 'nobody can write a friendship directly'
);

-- ---------------------------------------------------------------- invitation link
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.friend_invites default values;
select is((select count(*) from public.friend_invites)::int, 1, 'A creates a link');
select is(length((select token from public.friend_invites)), 36, 'with a long random token');
select throws_ok(
  $$ insert into public.friend_invites (token, inviter_id) values ('choisi', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null, 'the token cannot be chosen'
);

reset role;
create temp table link as select token from public.friend_invites;
grant select on link to authenticated;
set local role authenticated;

select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select is((select count(*) from public.friend_invites)::int, 0, 'C cannot read A''s links');
select is(public.accept_friend_invite((select token from link)), 'Alix', 'C opens the link: friends with A');
select is((select status::text from public.friendships), 'accepted', 'immediately accepted');
select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select is(public.accept_friend_invite((select token from link)), null, 'a link works only once');
select is(public.accept_friend_invite('faux'), null, 'an unknown link does nothing');

-- ---------------------------------------------------------------- party invitations
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.parties (id, title, starts_at) values ('11111111-1111-1111-1111-111111111111', 'Apéro', now());
select lives_ok(
  $$ insert into public.party_participants (party_id, user_id) values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000b') $$,
  'the host invites a friend'
);
select throws_ok(
  $$ insert into public.party_participants (party_id, user_id) values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-00000000000d') $$,
  '42501', null, 'but not someone who is not a friend'
);

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*) from public.parties)::int, 1, 'the invited friend sees the party');
select lives_ok(
  $$ update public.party_participants set invite_status = 'accepted' where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  'and accepts'
);
select isnt(
  (select joined_at from public.party_participants where user_id = '00000000-0000-0000-0000-00000000000b'), null,
  'joining is timestamped'
);
select throws_ok(
  $$ update public.party_participants set role = 'host' where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  '42501', null, 'a guest cannot become host'
);
select is((select count(*) from public.participant_private where user_id = '00000000-0000-0000-0000-00000000000b')::int, 1, 'the guest gets a private participation row');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000d');
select is((select count(*) from public.profile_cards)::int, 1, 'D, outside the party and not a friend, sees no other card');

select * from finish();
rollback;
