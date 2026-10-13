import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth/dal";

/**
 * Personal data export (GDPR art. 15 and 20): everything stored about the signed-in user, read through
 * their own session, so RLS guarantees nothing else can leak in. Other people's data (their pseudo, their
 * drinks, their levels) is never part of it, only links to them by id.
 */
export async function buildExport(user: SessionUser) {
  const supabase = await createClient();
  const [profile, health, consents, participations, privateParts, consumptions, friendships, invites, shares] = await Promise.all([
    supabase.from("profiles").select("pseudo, avatar, birth_year, adult_confirmed_at, created_at, updated_at").maybeSingle(),
    supabase.from("profile_health").select("sex, height_cm, weight_kg, habit, updated_at").maybeSingle(),
    supabase.from("consents").select("kind, version, party_id, granted_at, revoked_at").order("granted_at"),
    supabase.from("party_participants").select("party_id, role, invite_status, share_gauge, joined_at, parties(title, starts_at, location, status, ended_at)").eq("user_id", user.id),
    supabase.from("participant_private").select("party_id, objective, meal_kind, meal_at, stop_locked_at").eq("user_id", user.id),
    supabase.from("consumptions").select("party_id, label, glass_size, portion, volume_ml, abv, ethanol_g, pour, consumed_at, created_at").order("consumed_at"),
    supabase.from("friendships").select("requester_id, addressee_id, status, created_at, responded_at"),
    supabase.from("friend_invites").select("created_at, expires_at, used_at"),
    supabase.from("gauge_shares").select("party_id, level, schedule, stopped, computed_at").eq("user_id", user.id),
  ]);
  const failed = [profile, health, consents, participations, privateParts, consumptions, friendships, invites, shares].find((result) => result.error);
  if (failed?.error) throw new Error(`Export failed: ${failed.error.message}`);

  return {
    format: "picometre-export",
    version: 2,
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile.data,
    health_data: health.data,
    consents: consents.data,
    parties: participations.data,
    party_private_data: privateParts.data,
    consumptions: consumptions.data,
    friendships: friendships.data,
    friend_invites: invites.data,
    gauge_shares: shares.data,
  };
}
