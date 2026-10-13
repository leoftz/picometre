import type { Metadata } from "next";
import { PageShell } from "@/components/ui";
import { magicLinkEnabled } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

// E2 — sign-in. No password: Google, and the magic link once a dedicated SMTP exists (PLAN Q-9).
export default function Login() {
  return (
    <PageShell title="Connexion">
      <p className="text-on-surface-muted">
        {magicLinkEnabled
          ? "Pas de mot de passe à retenir : on t'envoie un lien, ou tu passes par Google."
          : "Pas de mot de passe à retenir : tu te connectes avec ton compte Google."}
      </p>
      <LoginForm magicLink={magicLinkEnabled} />
    </PageShell>
  );
}
