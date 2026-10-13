import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { Loading, PageShell, buttonClass } from "@/components/ui";
import type { AvatarId } from "@/lib/account/avatars";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { revokeHealthConsent, signOut } from "./actions";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = { title: "Réglages" };

const HABIT_LABELS = { occasionnel: "Occasionnel", regulier: "Régulier", frequent: "Fréquent" } as const;
const SEX_LABELS = { f: "Femme", m: "Homme", autre: "Autre ou non précisé" } as const;

// E15 — settings: always reachable once signed in, even mid sign-up, so data can always be exported or erased.
export default function Settings({ searchParams }: PageProps<"/reglages">) {
  return (
    <PageShell title="Réglages">
      <Suspense fallback={<Loading />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/reglages">, "searchParams">) {
  const user = await requireUser();
  const { consentement } = await searchParams;
  const supabase = await createClient();
  const [{ data: profile }, { data: health }, { data: consents }] = await Promise.all([
    supabase.from("profiles").select("pseudo, avatar, birth_year").maybeSingle(),
    supabase.from("profile_health").select("sex, height_cm, weight_kg, habit").maybeSingle(),
    supabase.from("consents").select("kind").is("revoked_at", null).is("party_id", null),
  ]);
  const healthConsent = consents?.some((c) => c.kind === "health_data") ?? false;

  return (
    <div className="flex flex-col gap-10">
      {consentement === "retire" ? (
        <p role="status" className="rounded-carte bg-menthe p-4 font-semibold text-nuit">
          C&apos;est fait : tes données de santé sont effacées.
        </p>
      ) : null}
      {consentement === "erreur" ? (
        <p role="alert" className="font-semibold text-corail">Le retrait a échoué. Réessaie.</p>
      ) : null}

      <section aria-labelledby="profil" className="flex flex-col gap-4">
        <h2 id="profil" className="font-display text-2xl font-bold">Ton personnage</h2>
        {profile ? (
          <div className="flex items-center gap-4">
            <Avatar id={profile.avatar as AvatarId} size={64} />
            <div>
              <p className="text-lg font-semibold">{profile.pseudo}</p>
              <p className="text-sm text-on-surface-muted">{user.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-on-surface-muted">Pas encore de personnage.</p>
        )}
        {health ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-on-surface-muted">Sexe</dt><dd>{SEX_LABELS[health.sex]}</dd>
            <dt className="text-on-surface-muted">Taille</dt><dd>{health.height_cm} cm</dd>
            <dt className="text-on-surface-muted">Poids</dt><dd>{health.weight_kg} kg</dd>
            <dt className="text-on-surface-muted">Habitudes</dt><dd>{HABIT_LABELS[health.habit]}</dd>
          </dl>
        ) : null}
      </section>

      <section aria-labelledby="donnees" className="flex flex-col gap-4">
        <h2 id="donnees" className="font-display text-2xl font-bold">Tes données</h2>
        <a href="/compte/export" download className={buttonClass("secondary")}>
          Exporter mes données
        </a>
        {healthConsent ? (
          <form action={revokeHealthConsent} className="flex flex-col gap-2">
            <p className="text-sm text-on-surface-muted">
              Retirer ton accord efface tout de suite ton sexe, ta taille et ton poids. Sans eux, la jauge ne peut plus
              être estimée.
            </p>
            <button type="submit" className={buttonClass("secondary")}>
              Retirer mon accord pour les données de santé
            </button>
          </form>
        ) : (
          <Link href="/bienvenue/consentements" className={buttonClass("secondary")}>
            Redonner mon accord pour les données de santé
          </Link>
        )}
      </section>

      <section aria-labelledby="supprimer" className="flex flex-col gap-4">
        <h2 id="supprimer" className="font-display text-2xl font-bold">Supprimer ton compte</h2>
        <DeleteAccountForm />
      </section>

      <form action={signOut}>
        <button type="submit" className={buttonClass("secondary")}>Me déconnecter</button>
      </form>

      <p className="text-sm text-on-surface-muted">
        <Link href="/confidentialite" className="underline">Politique de confidentialité</Link> ·{" "}
        <Link href="/conditions" className="underline">Conditions d&apos;utilisation</Link>
      </p>
    </div>
  );
}
