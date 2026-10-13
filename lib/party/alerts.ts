// Alert wording (charte §4 and §9): tutoiement, short sentences, no incitement. The app never says
// « tu peux boire » — when a drink would fit now, it simply says nothing.
import { OBJECTIVES, STOP_G_PER_L } from "@/config/objectifs";
import type { Objective, SimulationResult } from "@/lib/bac/types";
import { formatTime } from "./format";

export type AlertTone = "stop" | "eau";

export interface AlertMessage {
  kind: "stop" | "cap" | "pause" | "no-more";
  title: string;
  body: string;
  tone: AlertTone;
}

/** docs/parametres-scientifiques.md#P-54 to #P-57. Most important first; at most two messages. */
export function alertsFor(result: SimulationResult, now: number): AlertMessage[] {
  if (result.stopLocked) {
    return [
      {
        kind: "stop",
        title: "Stop pour ce soir",
        body: "Ta jauge a touché le plafond. Pour la suite : eau, softs et retour en douceur.",
        tone: "stop",
      },
    ];
  }
  // Prudence: the drinks already taken will push the gauge to the ceiling once absorbed.
  if (result.curve.some((p) => p.t > now && p.gauge >= STOP_G_PER_L)) {
    return [
      {
        kind: "stop",
        title: "Stop pour ce soir",
        body: "Avec ce qui est déjà bu, ta jauge va toucher le plafond. Place à l'eau et aux softs.",
        tone: "stop",
      },
    ];
  }
  if (result.alerts.includes("cap")) {
    return [
      {
        kind: "cap",
        title: "Objectif atteint",
        body: "Tes deux verres de la soirée sont passés. Place au joker eau.",
        tone: "eau",
      },
    ];
  }
  if (result.nextDrinkAt === null) {
    return [
      {
        kind: "no-more",
        title: "Plus de verre conseillé ce soir",
        body: "Même plus tard, un verre de plus sortirait de ton objectif. Eau et softs à volonté.",
        tone: "eau",
      },
    ];
  }
  if (result.alerts.includes("pause")) {
    return [
      {
        kind: "pause",
        title: "Pause fraîcheur conseillée",
        body:
          result.nextDrinkAt > now
            ? `Prochain verre possible à partir de ${formatTime(result.nextDrinkAt)}. D'ici là, joker eau.`
            : "La jauge chauffe : un verre d'eau, ça fait du bien.",
        tone: "eau",
      },
    ];
  }
  return [];
}

/**
 * « Atterrissage parfait »: no Stop, the high end of the estimated peak stayed under the objective's
 * threshold, and the objective's cap was respected (P-51 to P-54).
 */
export function objectiveKept(result: SimulationResult, objective: Objective): boolean {
  const { peakP95Max, capGrams } = OBJECTIVES[objective];
  return !result.stopLocked && result.peak.p95 < peakP95Max && (capGrams === null || result.totalGrams <= capGrams);
}
