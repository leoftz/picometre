import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading, PageShell } from "@/components/ui";
import { enforceOnboarding } from "@/lib/auth/dal";
import { CharacterForm } from "./character-form";

export const metadata: Metadata = { title: "Ton personnage" };

// E4 — character creation. The birth date only proves 18+; only the year is stored.
export default function Character() {
  return (
    <PageShell title="Crée ton personnage">
      <Suspense fallback={<Loading />}>
        <Gate />
      </Suspense>
    </PageShell>
  );
}

async function Gate() {
  await enforceOnboarding("personnage");
  return <CharacterForm />;
}
