import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Lien expiré" };

export default function AuthError() {
  return (
    <PageShell title="Ce lien ne marche plus">
      <p>Il a peut-être expiré, ou il a déjà servi. Demande un nouveau lien, ça prend dix secondes.</p>
      <Link href="/connexion" className={buttonClass("primary")}>
        Recevoir un nouveau lien
      </Link>
    </PageShell>
  );
}
