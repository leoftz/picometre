import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { Loading, PageShell } from "@/components/ui";
import type { AvatarId } from "@/lib/account/avatars";
import { enforceOnboarding } from "@/lib/auth/dal";
import { TROPHY_COPY, TROPHY_ORDER, type TrophyKind } from "@/lib/party/trophies";
import { createClient } from "@/lib/supabase/server";
import { Summary } from "./summary";

export const metadata: Metadata = { title: "Mon bilan" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SummaryPage({ params }: PageProps<"/soirees/[id]/bilan">) {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Content params={params} />
      </Suspense>
    </PageShell>
  );
}

async function Content({ params }: Pick<PageProps<"/soirees/[id]/bilan">, "params">) {
  const user = await enforceOnboarding("termine");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: party }, { data: me }, { data: health }, { data: profile }, { data: consumptions }, { data: trophies }, { data: cards }] = await Promise.all([
    supabase.from("parties").select("id, title, status").eq("id", id).maybeSingle(),
    supabase.from("participant_private").select("objective, meal_kind, meal_at, stop_locked_at").eq("party_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_health").select("sex, height_cm, weight_kg, habit").maybeSingle(),
    supabase.from("profiles").select("birth_year").maybeSingle(),
    supabase.from("consumptions").select("consumed_at, ethanol_g, pour, is_water").eq("party_id", id).order("consumed_at"),
    // RLS: one's own trophies, and those of participants who share their gauge with this party.
    supabase.from("trophies").select("user_id, kind").eq("party_id", id),
    supabase.from("profile_cards").select("id, pseudo, avatar"),
  ]);
  if (!party || !me || !health || !profile) notFound();
  const byOrder = (a: { kind: TrophyKind }, b: { kind: TrophyKind }) => TROPHY_ORDER.indexOf(a.kind) - TROPHY_ORDER.indexOf(b.kind);
  const mine = (trophies ?? []).filter((t) => t.user_id === user.id).sort(byOrder);
  const others = (cards ?? [])
    .filter((c) => c.id !== user.id)
    .map((c) => ({ card: c, kinds: (trophies ?? []).filter((t) => t.user_id === c.id).sort(byOrder) }))
    .filter((o) => o.kinds.length > 0)
    .sort((a, b) => a.card.pseudo.localeCompare(b.card.pseudo, "fr"));
  const ended = party.status === "ended";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link href={`/soirees/${party.id}`} className="text-sm underline">← {party.title}</Link>
        <h1 className="font-display text-3xl font-extrabold">Mon bilan</h1>
      </header>
      {me.objective ? (
        <Summary
          participant={{
            partyId: party.id,
            userId: user.id,
            health: { ...health, weight_kg: Number(health.weight_kg) },
            birthYear: profile.birth_year,
            objective: me.objective,
            meal: { kind: me.meal_kind, at: me.meal_at },
            stopLockedAt: me.stop_locked_at,
            consumptions: (consumptions ?? []).map((c) => ({ consumed_at: c.consumed_at, ethanol_g: Number(c.ethanol_g), pour: c.pour })),
          }}
          waterCount={(consumptions ?? []).filter((c) => c.is_water).length}
          canClaimLanding={ended && !mine.some((t) => t.kind === "atterrissage")}
        />
      ) : (
        <p className="text-on-surface-muted">Tu n&apos;avais pas choisi d&apos;objectif pour cette soirée : pas de bilan.</p>
      )}

      <section aria-labelledby="trophees" className="flex flex-col gap-4">
        <h2 id="trophees" className="font-display text-2xl font-bold">Trophées</h2>
        {!ended ? (
          <p className="text-on-surface-muted">Les trophées arrivent quand l&apos;hôte termine la soirée.</p>
        ) : mine.length === 0 ? (
          <p className="text-on-surface-muted">Pas de trophée ce soir. Le joker eau, c&apos;est quand tu veux.</p>
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Mes trophées">
            {mine.map((t) => (
              <li key={t.kind} className="rounded-carte border-2 border-citron p-4">
                <p className="font-display text-xl font-bold">{TROPHY_COPY[t.kind].title}</p>
                <p className="text-sm text-on-surface-muted">{TROPHY_COPY[t.kind].body}</p>
              </li>
            ))}
          </ul>
        )}
        {others.length > 0 ? (
          <>
            <h3 className="font-semibold">Dans le groupe</h3>
            <ul className="flex flex-col gap-2" aria-label="Trophées du groupe">
              {others.map(({ card, kinds }) => (
                <li key={card.id} className="flex items-center gap-3 rounded-bouton bg-white/5 px-4 py-3">
                  <span className="shrink-0"><Avatar id={card.avatar as AvatarId} size={36} /></span>
                  <span>
                    <span className="font-semibold">{card.pseudo}</span>
                    <span className="block text-sm text-on-surface-muted">{kinds.map((t) => TROPHY_COPY[t.kind].title).join(" · ")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="text-sm text-on-surface-muted">
          Tes trophées restent privés, sauf si tu partages ta jauge avec le groupe pour cette soirée.
        </p>
      </section>
    </div>
  );
}
