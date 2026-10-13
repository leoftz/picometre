import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, PageShell } from "@/components/ui";
import { enforceOnboarding } from "@/lib/auth/dal";
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
  const [{ data: party }, { data: me }, { data: health }, { data: profile }, { data: consumptions }] = await Promise.all([
    supabase.from("parties").select("id, title").eq("id", id).maybeSingle(),
    supabase.from("participant_private").select("objective, meal_kind, meal_at, stop_locked_at").eq("party_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_health").select("sex, height_cm, weight_kg, habit").maybeSingle(),
    supabase.from("profiles").select("birth_year").maybeSingle(),
    supabase.from("consumptions").select("consumed_at, ethanol_g, pour, is_water").eq("party_id", id).order("consumed_at"),
  ]);
  if (!party || !me || !health || !profile) notFound();

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
        />
      ) : (
        <p className="text-on-surface-muted">Tu n&apos;avais pas choisi d&apos;objectif pour cette soirée : pas de bilan.</p>
      )}
    </div>
  );
}
