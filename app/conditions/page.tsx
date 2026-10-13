import type { Metadata } from "next";
import { PageShell } from "@/components/ui";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

// Draft to be validated before public launch.
export default function Terms() {
  return (
    <PageShell title="Conditions d'utilisation">
      <p className="rounded-carte bg-citron p-4 font-semibold text-nuit">
        Version de travail du 13 octobre 2026, à faire valider avant l&apos;ouverture au public.
      </p>
      <div className="flex flex-col gap-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold">
        <section>
          <h2>18 ans et plus</h2>
          <p>Picomètre est réservé aux personnes majeures.</p>
        </section>
        <section>
          <h2>Une estimation, pas une mesure</h2>
          <p>
            La jauge est une estimation, avec une marge d&apos;erreur de 20 à 40 %. Elle ne remplace ni un éthylotest, ni un
            avis médical. Elle ne dit jamais si tu peux conduire.
          </p>
          <p className="mt-2 font-semibold">La jauge estime, l&apos;éthylotest décide. Si tu as bu, tu ne conduis pas.</p>
        </section>
        <section>
          <h2>Pas pour tout le monde</h2>
          <p>
            Ne t&apos;y fie pas si tu es enceinte, si tu prends un traitement ou si tu as une maladie du foie : demande conseil
            à un médecin ou à un pharmacien.
          </p>
        </section>
        <section>
          <h2>Picomètre ne pousse jamais à boire</h2>
          <p>Pas de défi de quantité, pas de classement de consommation. Le but, c&apos;est de bien finir la soirée.</p>
        </section>
      </div>
    </PageShell>
  );
}
