import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading, PageShell } from "@/components/ui";
import { enforceOnboarding } from "@/lib/auth/dal";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "Tes données" };

// E3 — explicit, separate consents (terms; health data under GDPR art. 9(2)(a)).
export default function Consents() {
  return (
    <PageShell title="Avant de commencer">
      <div className="space-y-3">
        <p>Pour estimer ta jauge, Picomètre a besoin de ton sexe, ta taille, ton poids et de ce que tu bois.</p>
        <p className="text-on-surface-muted">
          Ce sont des données sensibles. Elles ne sont jamais vendues ni partagées. Tu peux les exporter ou tout supprimer
          en un clic, depuis les réglages.
        </p>
      </div>
      <Suspense fallback={<Loading />}>
        <Gate />
      </Suspense>
    </PageShell>
  );
}

async function Gate() {
  await enforceOnboarding("consentements");
  return <ConsentForm />;
}
