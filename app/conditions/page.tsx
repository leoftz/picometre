import type { Metadata } from "next";
import { Controller } from "@/components/legal";
import { PageShell } from "@/components/ui";
import { LEGAL } from "@/config/legal";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function Terms() {
  return (
    <PageShell title="Conditions d'utilisation">
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
        <section>
          <h2>Entre amis</h2>
          <p>
            Choisis un pseudo qui ne vise personne. Ne partage pas le lien d&apos;invitation d&apos;un ami sans son accord. Ce
            que les autres partagent avec toi reste entre vous.
          </p>
        </section>
        <section>
          <h2>Ton compte</h2>
          <p>Tu peux exporter tes données ou supprimer ton compte à tout moment, depuis les réglages.</p>
        </section>
        <section>
          <h2>Éditeur</h2>
          <Controller />
        </section>
        <p className="text-sm text-on-surface-muted">Version du {LEGAL.version}.</p>
      </div>
    </PageShell>
  );
}
