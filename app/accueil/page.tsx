import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { Loading, PageShell, buttonClass } from "@/components/ui";
import type { AvatarId } from "@/lib/account/avatars";
import { enforceOnboarding } from "@/lib/auth/dal";
import { formatPartyDate } from "@/lib/party/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Accueil" };

// E5 — home: my parties.
export default function Home() {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </PageShell>
  );
}

async function Content() {
  await enforceOnboarding("termine");
  const supabase = await createClient();
  const [{ data: profile }, { data: parties }] = await Promise.all([
    supabase.from("profiles").select("pseudo, avatar").single(),
    supabase.from("parties").select("id, title, starts_at, location, status").order("starts_at", { ascending: false }).limit(30),
  ]);
  const ongoing = parties?.filter((p) => p.status !== "ended") ?? [];
  const past = parties?.filter((p) => p.status === "ended") ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar id={profile?.avatar as AvatarId} size={72} />
        <h1 className="font-display text-3xl font-extrabold">Salut {profile?.pseudo}</h1>
      </div>

      <Link href="/soirees/nouvelle" className={buttonClass("primary")}>
        Créer une soirée
      </Link>

      <section aria-labelledby="mes-soirees" className="flex flex-col gap-3">
        <h2 id="mes-soirees" className="font-display text-2xl font-bold">Mes soirées</h2>
        {ongoing.length === 0 ? <p className="text-on-surface-muted">Aucune soirée prévue.</p> : <PartyList parties={ongoing} />}
      </section>

      {past.length > 0 ? (
        <section aria-labelledby="passees" className="flex flex-col gap-3">
          <h2 id="passees" className="font-display text-xl font-bold">Soirées passées</h2>
          <PartyList parties={past} />
        </section>
      ) : null}

      <Link href="/reglages" className={buttonClass("secondary")}>
        Réglages et données
      </Link>
    </div>
  );
}

function PartyList({ parties }: { parties: { id: string; title: string; starts_at: string; location: string | null }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {parties.map((party) => (
        <li key={party.id}>
          <Link href={`/soirees/${party.id}`} className="block rounded-carte bg-white/5 p-4 hover:bg-white/10">
            <span className="font-display text-lg font-bold">{party.title}</span>
            <span className="block text-sm text-on-surface-muted first-letter:uppercase">
              {formatPartyDate(party.starts_at)}
              {party.location ? ` · ${party.location}` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
