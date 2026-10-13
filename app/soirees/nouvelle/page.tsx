import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loading, PageShell } from "@/components/ui";
import { enforceOnboarding } from "@/lib/auth/dal";
import { defaultPartyStart } from "@/lib/party/time";
import { PartyForm } from "./party-form";

export const metadata: Metadata = { title: "Nouvelle soirée" };

// E6 — create a party.
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
  await enforceOnboarding("termine");
  await connection();
  return <PartyForm defaultStart={defaultPartyStart(new Date()).toISOString()} />;
}
