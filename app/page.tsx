import Image from "next/image";
import { gaugeLevels } from "@/lib/brand/tokens";

// Temporary home page for the L1 foundation: shows the brand and the gauge palette.
// Replaced by the age gate and onboarding in L3.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-10 px-6 py-12 text-center">
      <Image src="/icon.svg" alt="" width={120} height={120} priority unoptimized />

      <div className="space-y-3">
        <h1 className="font-display text-4xl font-extrabold">
          <span className="text-corail">pico</span>mètre
        </h1>
        <p className="text-lg font-semibold text-citron">On s&apos;amuse, la jauge veille.</p>
      </div>

      <ul className="w-full space-y-2" aria-label="Les niveaux de la jauge">
        {Object.entries(gaugeLevels).map(([level, { label, color }]) => (
          <li key={level} className="flex items-center gap-3 rounded-bouton bg-white/5 px-4 py-3 text-left">
            <span aria-hidden className="size-4 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-semibold">
              Niveau {level} : {label}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-sm text-on-surface-muted">
        Réservé aux 18 ans et plus. La jauge estime, l&apos;éthylotest décide.
        <br />
        Si tu as bu, tu ne conduis pas.
      </p>
    </main>
  );
}
