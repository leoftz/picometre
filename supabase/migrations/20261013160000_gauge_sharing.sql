-- Lot 8 — real-time group view (PLAN §2, E11).
-- Sharing one's gauge with a party is an explicit, per-party consent (consents.kind = 'gauge_sharing'):
-- the consent journal is the source of truth, party_participants.share_gauge mirrors it for the group,
-- and gauge_shares holds the only thing the group ever sees: a level (1 to 4), the schedule of its next
-- changes, and whether « Stop pour ce soir » was reached. Never a value in g/L, never a drink.
-- Revoking the consent erases the shared row at once.

-- ---------------------------------------------------------------------------
-- Performance advisor follow-ups (lot 7)
-- ---------------------------------------------------------------------------
create index friendships_requester_idx on public.friendships (requester_id);
create index friend_invites_used_by_idx on public.friend_invites (used_by);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function private.is_accepted_member(p_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.party_participants
    where party_id = p_party_id and user_id = (select auth.uid()) and invite_status = 'accepted'
  );
$$;

create function private.shares_gauge(p_party_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.party_participants
    where party_id = p_party_id and user_id = p_user_id and invite_status = 'accepted' and share_gauge
  );
$$;

revoke execute on function private.is_accepted_member(uuid), private.shares_gauge(uuid, uuid) from public, anon;
grant execute on function private.is_accepted_member(uuid), private.shares_gauge(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Shared levels
-- ---------------------------------------------------------------------------
create table public.gauge_shares (
  -- Random id: Realtime sends deletions to every subscriber without RLS, carrying the primary key only,
  -- so the key must not reveal who stopped sharing in which party.
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null,
  user_id uuid not null default auth.uid(),
  level smallint not null check (level between 1 and 4),
  -- Next level changes if nothing else is drunk: [{"at": "<iso>", "level": 1..4}], at most 48 entries.
  schedule jsonb not null default '[]'::jsonb,
  stopped boolean not null default false,
  computed_at timestamptz not null default now(),
  unique (party_id, user_id),
  foreign key (party_id, user_id) references public.party_participants (party_id, user_id) on delete cascade
);

create index gauge_shares_user_id_idx on public.gauge_shares (user_id);

-- Validates the schedule and stamps the computation time (the client cannot backdate it).
create function public.guard_gauge_share()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  entry jsonb;
begin
  if jsonb_typeof(new.schedule) <> 'array' or jsonb_array_length(new.schedule) > 48 then
    raise exception 'invalid schedule' using errcode = 'check_violation';
  end if;
  for entry in select * from jsonb_array_elements(new.schedule) loop
    if jsonb_typeof(entry) <> 'object'
       or (select count(*) from jsonb_object_keys(entry)) <> 2
       or jsonb_typeof(entry -> 'at') <> 'string'
       or jsonb_typeof(entry -> 'level') <> 'number'
       or (entry ->> 'level') not in ('1', '2', '3', '4') then
      raise exception 'invalid schedule entry' using errcode = 'check_violation';
    end if;
    perform (entry ->> 'at')::timestamptz;
  end loop;
  -- A Stop stays for the rest of the party (docs/parametres-scientifiques.md#P-54).
  if tg_op = 'UPDATE' and old.stopped and not new.stopped then
    new.stopped := true;
  end if;
  new.computed_at := now();
  return new;
end;
$$;

revoke execute on function public.guard_gauge_share() from public, anon, authenticated;

create trigger gauge_shares_guard
  before insert or update on public.gauge_shares
  for each row execute function public.guard_gauge_share();

-- ---------------------------------------------------------------------------
-- The consent drives the sharing flag and erases the shared row on revocation
-- ---------------------------------------------------------------------------
create function public.apply_gauge_sharing_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.party_participants
      where party_id = new.party_id and user_id = new.user_id and invite_status = 'accepted'
    ) then
      raise exception 'only a participant can share their gauge with this party' using errcode = 'check_violation';
    end if;
    update public.party_participants set share_gauge = true where party_id = new.party_id and user_id = new.user_id;
  elsif new.revoked_at is not null and old.revoked_at is null then
    update public.party_participants set share_gauge = false where party_id = new.party_id and user_id = new.user_id;
    delete from public.gauge_shares where party_id = new.party_id and user_id = new.user_id;
  end if;
  return new;
end;
$$;

revoke execute on function public.apply_gauge_sharing_consent() from public, anon, authenticated;

create trigger consents_apply_gauge_sharing
  after insert or update of revoked_at on public.consents
  for each row
  when (new.kind = 'gauge_sharing')
  execute function public.apply_gauge_sharing_consent();

-- Leaving a party (or being removed) ends the sharing consent for it.
create function public.revoke_gauge_sharing_on_leave()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.consents set revoked_at = now()
  where user_id = old.user_id and party_id = old.party_id and kind = 'gauge_sharing' and revoked_at is null;
  return old;
end;
$$;

revoke execute on function public.revoke_gauge_sharing_on_leave() from public, anon, authenticated;

create trigger party_participants_revoke_gauge_sharing
  after delete on public.party_participants
  for each row execute function public.revoke_gauge_sharing_on_leave();

-- ---------------------------------------------------------------------------
-- Privileges, Row Level Security and Realtime
-- ---------------------------------------------------------------------------
revoke all on public.gauge_shares from anon, authenticated;
grant select, insert (party_id, user_id, level, schedule, stopped), update (level, schedule, stopped), delete
  on public.gauge_shares to authenticated;

alter table public.gauge_shares enable row level security;
alter table public.gauge_shares force row level security;

create policy "gauge_shares: owner, or accepted members while shared" on public.gauge_shares
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (private.is_accepted_member(party_id) and private.shares_gauge(party_id, user_id))
  );
create policy "gauge_shares: owner publishes while sharing" on public.gauge_shares
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.shares_gauge(party_id, user_id));
create policy "gauge_shares: owner updates while sharing" on public.gauge_shares
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.shares_gauge(party_id, user_id));
create policy "gauge_shares: owner deletes" on public.gauge_shares
  for delete to authenticated using (user_id = (select auth.uid()));

alter publication supabase_realtime add table public.gauge_shares;
