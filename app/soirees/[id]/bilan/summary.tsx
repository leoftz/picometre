"use client";

import { useMemo, useState } from "react";
import { OBJECTIVES } from "@/config/objectifs";
import { objectiveKept } from "@/lib/party/alerts";
import { type ParticipantData, toSimulationInput } from "@/lib/party/estimate";
import { formatStandardDrinks, formatTime } from "@/lib/party/format";
import { useEstimate } from "@/lib/party/use-estimate";

const g = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// E12 — individual summary, computed on the device like the gauge (health data never leaves it).
export function Summary({ participant, waterCount }: { participant: ParticipantData; waterCount: number }) {
  const [now] = useState(() => Date.now());
  const input = useMemo(() => toSimulationInput(participant, now), [participant, now]);
  const result = useEstimate(input);
  if (!result) return <p role="status" className="text-on-surface-muted">Calcul de ton bilan…</p>;

  const kept = objectiveKept(result, participant.objective);
  const alcoholic = participant.consumptions.filter((c) => Number(c.ethanol_g) > 0).length;
  const zero = result.backToZero;

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid gap-4">
        <div className="rounded-carte bg-white/5 p-4">
          <dt className="text-sm text-on-surface-muted">Pic estimé</dt>
          <dd className="font-display text-2xl font-bold">
            {result.peak.p50 > 0.005 ? `${g(result.peak.p50)} g/L vers ${formatTime(result.peak.at)}` : "Aucun"}
          </dd>
          {result.peak.p50 > 0.005 ? (
            <dd className="text-sm text-on-surface-muted">Estimation · entre {g(result.peak.p5)} et {g(result.peak.p95)} g/L</dd>
          ) : null}
        </div>
        <div className="rounded-carte bg-white/5 p-4">
          <dt className="text-sm text-on-surface-muted">Retour estimé à 0 g/L</dt>
          <dd className="font-display text-2xl font-bold">{zero ? `vers ${formatTime(zero.p50)}` : "Déjà à 0"}</dd>
          {zero ? (
            <dd className="text-sm text-on-surface-muted">Estimation · entre {formatTime(zero.p5)} et {formatTime(zero.p95)}</dd>
          ) : null}
        </div>
        <div className="rounded-carte bg-white/5 p-4">
          <dt className="text-sm text-on-surface-muted">Ta soirée</dt>
          <dd>
            {alcoholic} verre{alcoholic > 1 ? "s" : ""} d&apos;alcool noté{alcoholic > 1 ? "s" : ""}
            {result.totalGrams > 0 ? ` (${formatStandardDrinks(result.totalGrams)})` : ""}, {waterCount} joker{waterCount > 1 ? "s" : ""} eau.
          </dd>
        </div>
        <div className="rounded-carte bg-white/5 p-4">
          <dt className="text-sm text-on-surface-muted">Objectif « {OBJECTIVES[participant.objective].label} »</dt>
          <dd className="font-display text-xl font-bold">{kept ? "Atterrissage parfait" : "Objectif dépassé ce soir"}</dd>
          <dd className="text-sm text-on-surface-muted">
            {kept ? "Ta jauge est restée dans ton objectif du début à la fin." : "Ça arrive. Eau, repos, et on recale la jauge la prochaine fois."}
          </dd>
        </div>
      </dl>

      <p className="rounded-carte bg-creme p-5 font-display text-xl font-bold text-nuit">
        La jauge estime, l&apos;éthylotest décide. Si tu as bu, tu ne conduis pas.
      </p>
      <p className="text-sm text-on-surface-muted">
        Demain matin, même à 0 g/L, tes réflexes peuvent rester un peu ralentis.
      </p>
    </div>
  );
}
