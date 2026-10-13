import Link from "next/link";
import { LEGAL } from "@/config/legal";

/** The data controller and publisher, or a visible placeholder until PLAN Q-11 is answered. */
export function Controller() {
  const c = LEGAL.controller;
  if (!c) return <p className="font-semibold text-citron">[Identité, adresse et contact du responsable — à compléter (PLAN Q-11).]</p>;
  return (
    <p>
      {c.name}, {c.address}. Contact pour tes données :{" "}
      <a href={`mailto:${c.email}`} className="underline">{c.email}</a>.
    </p>
  );
}

export function LegalLinks() {
  return (
    <nav aria-label="Informations légales" className="text-sm text-on-surface-muted">
      <Link href="/mentions-legales" className="underline">Mentions légales</Link> ·{" "}
      <Link href="/confidentialite" className="underline">Confidentialité</Link> ·{" "}
      <Link href="/conditions" className="underline">Conditions d&apos;utilisation</Link>
    </nav>
  );
}
