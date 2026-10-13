import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { Loading, PageShell, buttonClass } from "@/components/ui";
import type { AvatarId } from "@/lib/account/avatars";
import { enforceOnboarding } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Accueil" };

// E5 — home. Parties arrive in lot 4.
export default function Home() {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </PageShell>
  );
}

async function Content() {
  await enforceOnboarding("termine");
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("pseudo, avatar").single();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Avatar id={profile?.avatar as AvatarId} size={72} />
        <h1 className="font-display text-3xl font-extrabold">Salut {profile?.pseudo}</h1>
      </div>
      <div className="rounded-carte bg-white/5 p-6">
        <p className="font-display text-xl font-bold">Tes soirées arrivent bientôt</p>
        <p className="mt-2 text-on-surface-muted">Créer une soirée, inviter tes amis et suivre ta jauge : c&apos;est la prochaine étape.</p>
      </div>
      <Link href="/reglages" className={buttonClass("secondary")}>
        Réglages et données
      </Link>
    </div>
  );
}
