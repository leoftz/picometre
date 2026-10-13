import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth/dal";

/**
 * Personal data export (GDPR art. 15 and 20): everything stored about the signed-in user, read through
 * their own session, so RLS guarantees nothing else can leak in. Later lots add parties and drinks here.
 */
export async function buildExport(user: SessionUser) {
  const supabase = await createClient();
  const [profile, health, consents] = await Promise.all([
    supabase.from("profiles").select("pseudo, avatar, birth_year, adult_confirmed_at, created_at, updated_at").maybeSingle(),
    supabase.from("profile_health").select("sex, height_cm, weight_kg, habit, updated_at").maybeSingle(),
    supabase.from("consents").select("kind, version, party_id, granted_at, revoked_at").order("granted_at"),
  ]);
  const failed = [profile, health, consents].find((result) => result.error);
  if (failed?.error) throw new Error(`Export failed: ${failed.error.message}`);

  return {
    format: "picometre-export",
    version: 1,
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile.data,
    health_data: health.data,
    consents: consents.data,
  };
}
