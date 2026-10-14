-- Live gauge on every device: a drink entered (or removed) on one phone updates the gauge open on another.
-- RLS applies to Realtime: each user only ever receives their own consumptions. Deletions carry the
-- primary key only, a random id generated on the device, which reveals nothing about who drank what.
alter publication supabase_realtime add table public.consumptions;
