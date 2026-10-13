import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SharingControl } from "@/components/sharing-control";
import { Loading, PageShell, buttonClass } from "@/components/ui";
import { enforceOnboarding } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { GroupView, type Share } from "./group-view";
import { type Consumption, LiveParty, type PlannedDrink } from "./live-party";

export const metadata: Metadata = { title: "Ma jauge" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// E10 — during the party: gauge, curve and 2-tap drink entry. The estimate runs on the device only.
export default function Live({ params }: PageProps<"/soirees/[id]/jauge">) {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Content params={params} />
      </Suspense>
    </PageShell>
  );
}

async function Content({ params }: Pick<PageProps<"/soirees/[id]/jauge">, "params">) {
  const user = await enforceOnboarding("termine");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [
    { data: party },
    { data: me },
    { data: health },
    { data: profile },
    { data: drinks },
    { data: consumptions },
    { data: participants },
    { data: cards },
    { data: shares },
  ] = await Promise.all([
    supabase.from("parties").select("id, title").eq("id", id).maybeSingle(),
    supabase.from("participant_private").select("objective, meal_kind, meal_at, stop_locked_at").eq("party_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_health").select("sex, height_cm, weight_kg, habit").maybeSingle(),
    supabase.from("profiles").select("birth_year").maybeSingle(),
    supabase.from("party_drinks").select("id, kind, drink_type, name, abv, default_glass, ethanol_g, pour").eq("party_id", id).order("created_at"),
    supabase
      .from("consumptions")
      .select("id, party_drink_id, label, glass_size, portion, consumed_at, ethanol_g, pour")
      .eq("party_id", id)
      .order("consumed_at"),
    supabase.from("party_participants").select("user_id, share_gauge").eq("party_id", id).eq("invite_status", "accepted"),
    supabase.from("profile_cards").select("id, pseudo, avatar"),
    supabase.from("gauge_shares").select("id, user_id, level, schedule, stopped, computed_at").eq("party_id", id),
  ]);
  if (!party || !me || !health || !profile) notFound();
  const sharing = participants?.find((p) => p.user_id === user.id)?.share_gauge ?? false;
  const members = (participants ?? []).flatMap((p) => {
    const card = cards?.find((c) => c.id === p.user_id);
    return card ? [{ userId: p.user_id, pseudo: card.pseudo, avatar: card.avatar }] : [];
  });

  const header = (
    <header className="flex flex-col gap-1">
      <Link href={`/soirees/${party.id}`} className="text-sm underline">← {party.title}</Link>
      <h1 className="font-display text-3xl font-extrabold">Ma jauge</h1>
    </header>
  );

  if (!me.objective || !me.meal_kind) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p>Avant de commencer, choisis ton objectif et dis-nous si tu as mangé.</p>
        <Link href={`/soirees/${party.id}`} className={buttonClass("primary")}>Choisir mon objectif</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}
      <LiveParty
        participant={{
          partyId: party.id,
          userId: user.id,
          health: { ...health, weight_kg: Number(health.weight_kg) },
          birthYear: profile.birth_year,
          objective: me.objective,
          meal: { kind: me.meal_kind, at: me.meal_at },
          stopLockedAt: me.stop_locked_at,
        }}
        sharing={sharing}
        plannedDrinks={(drinks ?? []).map((d) => ({ ...d, abv: d.abv === null ? null : Number(d.abv), ethanol_g: Number(d.ethanol_g) })) as PlannedDrink[]}
        initialConsumptions={(consumptions ?? []).map((c) => ({ ...c, ethanol_g: Number(c.ethanol_g), portion: Number(c.portion) })) as Consumption[]}
      />
      {participants ? (
        <section aria-labelledby="groupe" className="flex flex-col gap-4">
          <h2 id="groupe" className="font-display text-2xl font-bold">Le groupe</h2>
          <GroupView partyId={party.id} myId={user.id} members={members} initialShares={(shares ?? []) as unknown as Share[]} />
          <SharingControl partyId={party.id} sharing={sharing} />
        </section>
      ) : null}
      <p className="text-sm text-on-surface-muted">
        La jauge estime, l&apos;éthylotest décide. Si tu as bu, tu ne conduis pas.
      </p>
    </div>
  );
}
