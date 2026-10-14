import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loading, PageShell } from "@/components/ui";
import { enforceOnboarding } from "@/lib/auth/dal";
import { defaultPartyStart } from "@/lib/party/time";
import { createClient } from "@/lib/supabase/server";
import { PartyForm } from "./party-form";

export const metadata: Metadata = { title: "Nouvelle soirée" };

// E6 — create a party, invite friends and choose to share one's gauge with them at once.
export default function NewParty() {
  return (
    <PageShell title="Nouvelle soirée">
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </PageShell>
  );
}

async function Content() {
  const user = await enforceOnboarding("termine");
  await connection();
  const supabase = await createClient();
  const [{ data: friendships }, { data: cards }] = await Promise.all([
    supabase.from("friendships").select("requester_id, addressee_id").eq("status", "accepted"),
    supabase.from("profile_cards").select("id, pseudo, avatar"),
  ]);
  const friends = (friendships ?? [])
    .map((f) => cards?.find((c) => c.id === (f.requester_id === user.id ? f.addressee_id : f.requester_id)))
    .filter((c) => c !== undefined)
    .sort((a, b) => a.pseudo.localeCompare(b.pseudo, "fr"));
  return <PartyForm defaultStart={defaultPartyStart(new Date()).toISOString()} friends={friends} />;
}
