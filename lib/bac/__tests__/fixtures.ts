import type { Intake, Profile, SimulationInput } from "../types";

export const T0 = Date.UTC(2026, 9, 17, 18, 0); // a Saturday evening, 20:00 in Paris
export const MIN = 60_000;
export const HOUR = 60 * MIN;

/** Hypotheses of the PDF's worked cases (docs/parametres-scientifiques.md#C-1 to #C-3, p. 6). */
export const woman55: Profile = { sex: "f", ageYears: 30, heightCm: 165, weightKg: 55, habit: "occasionnel" };
export const man80: Profile = { sex: "m", ageYears: 40, heightCm: 180, weightKg: 80, habit: "occasionnel" };

/** `count` standard drinks (10 g), one every `everyMin` minutes from T0. */
export function standardDrinks(count: number, everyMin: number, from = T0): Intake[] {
  return Array.from({ length: count }, (_, i) => ({ at: from + i * everyMin * MIN, grams: 10, pour: "dose" as const }));
}

export function input(overrides: Partial<SimulationInput> & Pick<SimulationInput, "profile">): SimulationInput {
  return { intakes: [], meals: [], objective: "festive", now: T0, seed: "test", ...overrides };
}

/** Hours since T0. */
export const hours = (t: number) => (t - T0) / HOUR;
