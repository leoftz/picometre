import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string | null;
}

/**
 * Data Access Layer: the signed-in user, verified from the session JWT (getClaims validates the signature).
 * Reads cookies: call it inside a <Suspense> boundary (Cache Components).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  return user;
}

export type OnboardingStep = "consentements" | "personnage" | "termine";

/** Where the signed-in user stands in the sign-up flow (E3 consents → E4 character → E5 home). */
export async function getOnboardingStep(): Promise<OnboardingStep> {
  const supabase = await createClient();
  const [{ data: consents }, { data: profile }, { data: health }] = await Promise.all([
    supabase.from("consents").select("kind").is("revoked_at", null).is("party_id", null),
    supabase.from("profiles").select("id").maybeSingle(),
    supabase.from("profile_health").select("user_id").maybeSingle(),
  ]);
  const active = new Set(consents?.map((c) => c.kind));
  if (!active.has("cgu") || !active.has("health_data")) return "consentements";
  if (!profile || !health) return "personnage";
  return "termine";
}

const STEP_PATHS: Record<OnboardingStep, string> = {
  consentements: "/bienvenue/consentements",
  personnage: "/bienvenue/personnage",
  termine: "/accueil",
};

/** Sends the user to the step they must complete, unless they are already on it. */
export async function enforceOnboarding(current: OnboardingStep): Promise<SessionUser> {
  const user = await requireUser();
  const step = await getOnboardingStep();
  if (step !== current) redirect(STEP_PATHS[step]);
  return user;
}

export function onboardingPath(step: OnboardingStep): string {
  return STEP_PATHS[step];
}
