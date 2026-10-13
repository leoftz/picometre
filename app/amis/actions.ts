"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { pseudoSchema } from "@/lib/account/schemas";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type RequestState = { message?: string; ok?: boolean };

const REQUEST_MESSAGES: Record<string, RequestState> = {
  envoye: { ok: true, message: "Demande envoyée. Elle attend sa réponse." },
  accepte: { ok: true, message: "Vous êtes amis : cette personne t'avait déjà demandé." },
  "deja-amis": { message: "Vous êtes déjà amis." },
  "deja-demande": { message: "Ta demande attend déjà sa réponse." },
  "soi-meme": { message: "C'est ton propre pseudo." },
  introuvable: { message: "Aucun personnage avec ce pseudo. Vérifie l'orthographe." },
};

export async function sendFriendRequest(_previous: RequestState, formData: FormData): Promise<RequestState> {
  await requireUser();
  const parsed = pseudoSchema.safeParse(formData.get("pseudo"));
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_friend_request", { p_pseudo: parsed.data });
  if (error) return { message: "L'envoi a échoué. Réessaie." };
  revalidatePath("/amis");
  return REQUEST_MESSAGES[data] ?? { message: "L'envoi a échoué. Réessaie." };
}

export async function answerFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("friendships").update({ status: accept ? "accepted" : "declined" }).eq("id", friendshipId);
  revalidatePath("/amis");
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("friendships").delete().eq("id", friendshipId);
  revalidatePath("/amis");
}

export type LinkState = { url?: string; error?: string };

/** Creates a single-use link, valid 7 days (defaults in the database). */
export async function createInviteLink(): Promise<LinkState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("friend_invites").insert({ inviter_id: user.id }).select("token").single();
  if (error || !data) return { error: "Le lien n'a pas pu être créé. Réessaie." };
  const h = await headers();
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  revalidatePath("/amis");
  return { url: `${origin}/amis/lien/${data.token}` };
}

export async function revokeInviteLink(token: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("friend_invites").delete().eq("token", token);
  revalidatePath("/amis");
}
