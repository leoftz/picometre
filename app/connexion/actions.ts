"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { emailSchema } from "@/lib/account/schemas";
import { magicLinkEnabled } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type MagicLinkState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

/** Base URL of the current deployment, for auth redirects (allow-listed in Supabase URL configuration). */
async function origin(): Promise<string> {
  const h = await headers();
  const fromRequest = h.get("origin") ?? (h.get("host") ? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}` : null);
  return fromRequest ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function sendMagicLink(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  if (!magicLinkEnabled) return { status: "error", message: "Connecte-toi avec Google." };
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${await origin()}/auth/callback` },
  });
  if (error) {
    return {
      status: "error",
      message: error.status === 429 ? "Trop de demandes. Réessaie dans quelques minutes." : "L'envoi a échoué. Réessaie.",
    };
  }
  return { status: "sent", email: parsed.data.email };
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback` },
  });
  if (error || !data.url) redirect("/auth/erreur");
  redirect(data.url);
}
