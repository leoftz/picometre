"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CONSENT_VERSIONS } from "@/lib/account/consents";
import { characterSchema, fieldErrors } from "@/lib/account/schemas";
import { requireUser } from "@/lib/auth/dal";
import { consumeInvite } from "@/lib/friends/consume-invite";
import { INVITE_COOKIE, isInviteToken } from "@/lib/friends/invite-cookie";
import { createClient } from "@/lib/supabase/server";

export type FormState = { errors: Record<string, string>; values?: Record<string, string> };

export async function acceptConsents(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const errors: Record<string, string> = {};
  if (formData.get("cgu") !== "on") errors.cgu = "Coche cette case pour continuer.";
  if (formData.get("health_data") !== "on")
    errors.health_data = "Sans ces données, la jauge ne peut pas être estimée. Coche la case pour continuer.";
  if (Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data: active } = await supabase.from("consents").select("kind").is("revoked_at", null).is("party_id", null);
  const already = new Set(active?.map((c) => c.kind));
  const toGrant = (["cgu", "health_data"] as const)
    .filter((kind) => !already.has(kind))
    .map((kind) => ({ kind, version: CONSENT_VERSIONS[kind] }));
  if (toGrant.length > 0) {
    const { error } = await supabase.from("consents").insert(toGrant);
    if (error) return { errors: { form: "L'enregistrement a échoué. Réessaie." } };
  }
  redirect("/bienvenue/personnage");
}

export async function createCharacter(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const raw = Object.fromEntries(
    ["pseudo", "avatar", "birthDate", "sex", "heightCm", "weightKg", "habit"].map((key) => [key, String(formData.get(key) ?? "")]),
  );
  const parsed = characterSchema(new Date()).safeParse(raw);
  // The birth date is never sent back nor stored: only its year is kept.
  const values = { ...raw, birthDate: "" };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { pseudo, avatar, birthDate, sex, heightCm, weightKg, habit } = parsed.data;
  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ pseudo, avatar, birth_year: Number(birthDate.slice(0, 4)) });
  if (profileError) {
    const taken = profileError.code === "23505";
    return { errors: taken ? { pseudo: "Ce pseudo est déjà pris. Essaie une variante." } : { form: "L'enregistrement a échoué. Réessaie." }, values };
  }

  const { error: healthError } = await supabase
    .from("profile_health")
    .upsert({ sex, height_cm: heightCm, weight_kg: weightKg, habit });
  if (healthError) return { errors: { form: "L'enregistrement a échoué. Réessaie." }, values };

  // A friend link opened before signing up is accepted now that the character exists.
  const cookieStore = await cookies();
  const invite = cookieStore.get(INVITE_COOKIE)?.value;
  if (isInviteToken(invite)) {
    cookieStore.delete(INVITE_COOKIE);
    redirect(await consumeInvite(invite));
  }
  redirect("/accueil");
}
