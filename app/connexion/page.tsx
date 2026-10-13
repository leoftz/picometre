import type { Metadata } from "next";
import { PageShell } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

// E2 — sign-in. Pas de mot de passe : lien magique ou Google.
export default function Login() {
  return (
    <PageShell title="Connexion">
      <p className="text-on-surface-muted">Pas de mot de passe à retenir : on t&apos;envoie un lien, ou tu passes par Google.</p>
      <LoginForm />
    </PageShell>
  );
}
