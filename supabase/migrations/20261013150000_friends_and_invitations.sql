-- Lot 7 — friends (by pseudo with acceptance, or by single-use link) and party invitations (PLAN §2).
-- Only pseudo and avatar are ever shown to others: they live in profile_cards, kept in sync from
-- profiles (which stays owner-only, with the birth year).

-- ---------------------------------------------------------------------------
-- Public cards: what friends and party co-members may see
-- ---------------------------------------------------------------------------
create table public.profile_cards (
  id uuid primary key references public.profiles (id) on delete cascade,
  pseudo extensions.citext not null unique,
  avatar text not null
);

insert into public.profile_cards (id, pseudo, avatar) select id, pseudo, avatar from public.profiles;

create function public.sync_profile_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile_cards (id, pseudo, avatar) values (new.id, new.pseudo, new.avatar)
  on conflict (id) do update set pseudo = excluded.pseudo, avatar = excluded.avatar;
  return new;
end;
$$;

revoke execute on function public.sync_profile_card() from public, anon, authenticated;

create trigger profiles_sync_card
  after insert or update of pseudo, avatar on public.profiles
  for each row execute function public.sync_profile_card();

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------
create type public.friendship_status as enum ('pending', 'accepted', 'declined');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

-- One relationship per pair, whatever the direction.
create unique index friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id);

create function private.are_friends(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and least(requester_id, addressee_id) = least(p_a, p_b)
      and greatest(requester_id, addressee_id) = greatest(p_a, p_b)
  );
$$;

-- Who may see someone's card: themselves, anyone in a friendship or pending request with them,
-- and the members of a party they take part in.
create function private.can_see_profile(p_target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_target = (select auth.uid())
    or exists (
      select 1 from public.friendships
      where status <> 'declined'
        and ((requester_id = p_target and addressee_id = (select auth.uid()))
          or (addressee_id = p_target and requester_id = (select auth.uid())))
    )
    or exists (
      select 1
      from public.party_participants mine
      join public.party_participants theirs on theirs.party_id = mine.party_id
      where mine.user_id = (select auth.uid()) and mine.invite_status <> 'declined'
        and theirs.user_id = p_target and theirs.invite_status <> 'declined'
    );
$$;

revoke execute on function private.are_friends(uuid, uuid), private.can_see_profile(uuid) from public, anon;
grant execute on function private.are_friends(uuid, uuid), private.can_see_profile(uuid) to authenticated;

-- Only the addressee answers a pending request, once.
create function public.guard_friendship_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'pending' or new.status = 'pending'
     or (new.requester_id, new.addressee_id, new.created_at) is distinct from (old.requester_id, old.addressee_id, old.created_at) then
    raise exception 'only a pending request can be answered' using errcode = 'check_violation';
  end if;
  new.responded_at := now();
  return new;
end;
$$;

revoke execute on function public.guard_friendship_update() from public, anon, authenticated;

create trigger friendships_guard_update
  before update on public.friendships
  for each row execute function public.guard_friendship_update();

-- ---------------------------------------------------------------------------
-- Single-use invitation links (7 days)
-- ---------------------------------------------------------------------------
create table public.friend_invites (
  token text primary key default encode(extensions.gen_random_bytes(18), 'hex'),
  inviter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz
);

create index friend_invites_inviter_idx on public.friend_invites (inviter_id);

-- ---------------------------------------------------------------------------
-- RPCs: the two actions that must reach another user's row. Intentionally callable by signed-in users.
-- ---------------------------------------------------------------------------

-- Request by exact pseudo (no search, no listing). If they already asked me, this accepts.
create function public.send_friend_request(p_pseudo text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target uuid;
  existing public.friendships;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select id into target from public.profiles where lower(pseudo::text) = lower(btrim(p_pseudo));
  if target is null then
    return 'introuvable';
  end if;
  if target = me then
    return 'soi-meme';
  end if;
  select * into existing from public.friendships
  where least(requester_id, addressee_id) = least(me, target) and greatest(requester_id, addressee_id) = greatest(me, target);
  if found then
    if existing.status = 'accepted' then
      return 'deja-amis';
    elsif existing.status = 'pending' and existing.addressee_id = me then
      update public.friendships set status = 'accepted' where id = existing.id;
      return 'accepte';
    elsif existing.status = 'pending' then
      return 'deja-demande';
    else
      -- A declined request may be sent again later.
      delete from public.friendships where id = existing.id;
    end if;
  end if;
  insert into public.friendships (requester_id, addressee_id) values (me, target);
  return 'envoye';
end;
$$;

-- Opening a friend's link is an acceptance on both sides: the inviter chose to share it.
create function public.accept_friend_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  invite public.friend_invites;
  inviter_pseudo text;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select * into invite from public.friend_invites where token = p_token for update;
  if not found or invite.used_at is not null or invite.expires_at < now() then
    return null;
  end if;
  if invite.inviter_id = me then
    return null;
  end if;
  select pseudo::text into inviter_pseudo from public.profiles where id = invite.inviter_id;
  delete from public.friendships
  where least(requester_id, addressee_id) = least(me, invite.inviter_id)
    and greatest(requester_id, addressee_id) = greatest(me, invite.inviter_id)
    and status <> 'accepted';
  insert into public.friendships (requester_id, addressee_id, status, responded_at)
  values (invite.inviter_id, me, 'accepted', now())
  on conflict do nothing;
  update public.friend_invites set used_by = me, used_at = now() where token = p_token;
  return inviter_pseudo;
end;
$$;

revoke execute on function public.send_friend_request(text), public.accept_friend_invite(text) from public, anon;
grant execute on function public.send_friend_request(text), public.accept_friend_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Party invitations: the host invites accepted friends; each guest accepts or declines.
-- ---------------------------------------------------------------------------
grant insert (party_id, user_id), delete on public.party_participants to authenticated;
grant update (invite_status) on public.party_participants to authenticated;

create function public.guard_participant_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'the role of a participant cannot change' using errcode = 'check_violation';
  end if;
  if new.invite_status is distinct from old.invite_status then
    if old.role = 'host' or old.invite_status <> 'invited' then
      raise exception 'only a pending invitation can be answered' using errcode = 'check_violation';
    end if;
    if new.invite_status = 'accepted' then
      new.joined_at := now();
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_participant_update() from public, anon, authenticated;

create trigger party_participants_guard_update
  before update on public.party_participants
  for each row execute function public.guard_participant_update();

create policy "party_participants: host invites friends" on public.party_participants
  for insert to authenticated
  with check (
    private.is_party_host(party_id)
    and role = 'guest'
    and invite_status = 'invited'
    and private.are_friends((select auth.uid()), user_id)
  );
create policy "party_participants: host removes a guest, a guest leaves" on public.party_participants
  for delete to authenticated
  using (role = 'guest' and (private.is_party_host(party_id) or user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Privileges and Row Level Security
-- ---------------------------------------------------------------------------
revoke all on public.profile_cards, public.friendships, public.friend_invites from anon, authenticated;
grant select on public.profile_cards to authenticated;
grant select, update (status), delete on public.friendships to authenticated;
-- The token, expiry and use are set by defaults and by accept_friend_invite only.
grant select, insert (inviter_id), delete on public.friend_invites to authenticated;

alter table public.profile_cards enable row level security;
alter table public.profile_cards force row level security;
alter table public.friendships enable row level security;
alter table public.friendships force row level security;
alter table public.friend_invites enable row level security;
alter table public.friend_invites force row level security;

create policy "profile_cards: visible to self, friends, requests and party co-members" on public.profile_cards
  for select to authenticated using (private.can_see_profile(id));

create policy "friendships: both sides read" on public.friendships
  for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));
create policy "friendships: addressee answers" on public.friendships
  for update to authenticated
  using (addressee_id = (select auth.uid())) with check (addressee_id = (select auth.uid()));
create policy "friendships: either side removes" on public.friendships
  for delete to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy "friend_invites: inviter reads" on public.friend_invites
  for select to authenticated using (inviter_id = (select auth.uid()));
create policy "friend_invites: inviter creates" on public.friend_invites
  for insert to authenticated with check (inviter_id = (select auth.uid()));
create policy "friend_invites: inviter revokes" on public.friend_invites
  for delete to authenticated using (inviter_id = (select auth.uid()));
