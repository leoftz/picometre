import Link from "next/link";
import { PageShell, buttonClass } from "@/components/ui";

// Also shown for a party the user is not part of: RLS makes it indistinguishable from a missing one.
export default function NotFound() {
  return (
    <PageShell title="Page introuvable">
      <p>Cette page n&apos;existe pas, ou tu n&apos;y as pas accès.</p>
      <Link href="/accueil" className={buttonClass("primary")}>
        Retour à l&apos;accueil
      </Link>
    </PageShell>
  );
}
