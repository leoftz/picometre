import type { Metadata } from "next";
import { Controller } from "@/components/legal";
import { PageShell } from "@/components/ui";
import { HOST, LEGAL } from "@/config/legal";

export const metadata: Metadata = { title: "Mentions légales" };

// LCEN art. 6 III: publisher, publication director and host.
export default function LegalNotice() {
  return (
    <PageShell title="Mentions légales">
      <div className="flex flex-col gap-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold">
        <section>
          <h2>Éditeur et directeur de la publication</h2>
          <Controller />
        </section>
        <section>
          <h2>Hébergeur</h2>
          <p>
            {HOST.name}, {HOST.address} ({HOST.website}). Les serveurs utilisés sont à Dublin (Union européenne).
          </p>
        </section>
        <section>
          <h2>Base de données</h2>
          <p>Supabase, projet hébergé en Irlande (Union européenne).</p>
        </section>
        <section>
          <h2>Marques</h2>
          <p>Picomètre ne fait la promotion d&apos;aucune marque d&apos;alcool. Les boissons sont décrites de façon générique.</p>
        </section>
        <p className="text-sm text-on-surface-muted">Version du {LEGAL.version}.</p>
      </div>
    </PageShell>
  );
}
