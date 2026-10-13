import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Accepts a friend link for the signed-in user (who must have a character); returns where to go next. */
export async function consumeInvite(token: string): Promise<string> {
  const supabase = await createClient();
  const { data: inviter } = await supabase.rpc("accept_friend_invite", { p_token: token });
  return inviter ? `/amis?ajout=${encodeURIComponent(inviter)}` : "/amis?lien=invalide";
}
