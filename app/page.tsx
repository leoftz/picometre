import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui";

// E1 — age gate, shown before anything else (charte §9.6). The binding check (full birth date)
// happens when the character is created; this screen keeps minors out of the app's content.
export default function AgeGate({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-10 px-6 py-12 text-center">
      <Suspense>
        <DeletedNotice searchParams={searchParams} />
      </Suspense>
      <Image src="/icon.svg" alt="" width={112} height={112} priority unoptimized />
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-extrabold">
          <span className="text-corail">pico</span>mètre
        </h1>
        <p className="text-lg font-semibold text-citron">On s&apos;amuse, la jauge veille.</p>
      </div>

      <div className="w-full space-y-4">
        <p className="font-display text-2xl font-bold">Tu as 18 ans ou plus ?</p>
        <Link href="/connexion" className={buttonClass("primary")}>
          Oui, j&apos;ai 18 ans ou plus
        </Link>
        <Link href="/mineur" className={buttonClass("secondary")}>
          Non, pas encore
        </Link>
      </div>

      <p className="text-sm text-on-surface-muted">
        La jauge estime, l&apos;éthylotest décide. Si tu as bu, tu ne conduis pas.
      </p>
    </main>
  );
}

async function DeletedNotice({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { compte } = await searchParams;
  if (compte !== "supprime") return null;
  return (
    <p role="status" className="w-full rounded-carte bg-menthe p-4 font-semibold text-nuit">
      Ton compte et toutes tes données sont supprimés.
    </p>
  );
}
