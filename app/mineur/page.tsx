import type { Metadata } from "next";
import { PageShell } from "@/components/ui";

export const metadata: Metadata = { title: "Réservé aux adultes" };

export default function Minor() {
  return (
    <PageShell title="Rendez-vous à tes 18 ans">
      <p>Picomètre est réservé aux personnes majeures.</p>
      <p className="text-on-surface-muted">
        Si tu as une question sur l&apos;alcool, Alcool Info Service répond gratuitement et anonymement au 0 980 980 930,
        tous les jours de 8 h à 2 h.
      </p>
    </PageShell>
  );
}
