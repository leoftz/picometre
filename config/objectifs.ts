// Single configuration file for the gauge levels and the per-objective thresholds.
// Every value points to docs/parametres-scientifiques.md. Safety rule (charte §9, cahier des charges):
// no objective may allow a p95 peak at or above the common Stop ceiling.

import type { GaugeLevel, Objective } from "@/lib/bac/types";

/**
 * Lower bound (g/L, on the p75 estimate — #P-39) of each gauge level — charte §5.
 * docs/parametres-scientifiques.md#P-40 (1: < 0.2), #P-41 (2: 0.2–0.5), #P-42 (3: 0.5–0.8), #P-43 (4: ≥ 0.8).
 */
export const LEVEL_FLOORS_G_PER_L: Record<GaugeLevel, number> = { 1: 0, 2: 0.2, 3: 0.5, 4: 0.8 };

/** docs/parametres-scientifiques.md#P-54 — common ceiling: p75 estimate (#P-39) ≥ 0.8 g/L → « Stop pour ce soir », for the rest of the party. */
export const STOP_G_PER_L = 0.8;

/** docs/parametres-scientifiques.md#P-55 — gauge level from which a « Pause fraîcheur » is advised (charte §7). */
export const PAUSE_FROM_LEVEL: GaugeLevel = 3;

/** docs/parametres-scientifiques.md#P-56 — the hypothetical drink tested for « Prochain verre possible » (= P-02). */
export const NEXT_DRINK_GRAMS = 10;

/** How far ahead « Prochain verre possible » is searched (h). Beyond that, no time is shown. */
export const NEXT_DRINK_SEARCH_H = 12;

export interface ObjectiveConfig {
  label: string;
  /** The p95 of the future peak, with one more standard drink, must stay strictly below this (g/L). */
  peakP95Max: number;
  /** Total ethanol for the party (g); null = no cap. */
  capGrams: number | null;
  ref: string;
}

export const OBJECTIVES: Record<Objective, ObjectiveConfig> = {
  /**
   * docs/parametres-scientifiques.md#P-51 — 0.5 g/L = operational hangover landmark (#P-45, avis d'expert,
   * preuve faible) applied to the p95; cap of 2 standard drinks from the SPF daily landmark (#P-47).
   */
  zero_gdb: { label: "Zéro gueule de bois", peakP95Max: 0.5, capGrams: 20, ref: "P-51" },
  /** docs/parametres-scientifiques.md#P-52 — keep even the high end of the range in level 2 « Ça pétille » (#P-41). */
  desinhibe: { label: "Juste désinhibé", peakP95Max: 0.5, capGrams: null, ref: "P-52" },
  /** docs/parametres-scientifiques.md#P-53 — never reach level 4, even at the high end of the range (#P-43). */
  festive: { label: "Soirée festive", peakP95Max: 0.8, capGrams: null, ref: "P-53" },
};
