"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string };

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Withdraws the health-data consent; the database then erases the health data (trigger). */
export async function revokeHealthConsent(): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("kind", "health_data")
    .is("party_id", null)
    .is("revoked_at", null);
  redirect(error ? "/reglages?consentement=erreur" : "/reglages?consentement=retire");
}

/**
 * Deletes the account in one click (GDPR art. 17): removing the auth user cascades to every table.
 * The admin client only ever acts on the id of the user whose session was just verified.
 */
export async function deleteAccount(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (formData.get("confirm") !== "on") return { error: "Coche la case pour confirmer la suppression." };

  const admin = createAdminClient();
  if (!admin) return { error: "La suppression n'est pas disponible sur cette version de test." };

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "La suppression a échoué. Réessaie ou écris-nous." };

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?compte=supprime");
}
