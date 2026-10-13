// Turns what the database knows about one participant into the BAC engine's input.
// Pure: runs in the browser and in the Web Worker, never on the server (health data stays on the device).
import type { Habit, Meal, Objective, Pour, Sex, SimulationInput } from "@/lib/bac/types";

export interface ParticipantData {
  partyId: string;
  userId: string;
  health: { sex: Sex; height_cm: number; weight_kg: number; habit: Habit };
  birthYear: number;
  objective: Objective;
  meal: { kind: "aucun" | "collation" | "repas" | null; at: string | null };
  stopLockedAt: string | null;
  consumptions: { consumed_at: string; ethanol_g: number; pour: Pour }[];
}

export function toSimulationInput(data: ParticipantData, now: number): SimulationInput {
  const meals: Meal[] =
    data.meal.kind && data.meal.kind !== "aucun" && data.meal.at ? [{ at: Date.parse(data.meal.at), kind: data.meal.kind }] : [];
  return {
    profile: {
      sex: data.health.sex,
      // docs/parametres-scientifiques.md#P-09 — age from the birth year only.
      ageYears: new Date(now).getFullYear() - data.birthYear,
      heightCm: data.health.height_cm,
      weightKg: Number(data.health.weight_kg),
      habit: data.health.habit,
    },
    intakes: data.consumptions
      .filter((c) => Number(c.ethanol_g) > 0)
      .map((c) => ({ at: Date.parse(c.consumed_at), grams: Number(c.ethanol_g), pour: c.pour })),
    meals,
    objective: data.objective,
    now,
    // docs/parametres-scientifiques.md#P-36 — one stable seed per participant and party.
    seed: `${data.partyId}:${data.userId}`,
    stopLockedAt: data.stopLockedAt ? Date.parse(data.stopLockedAt) : null,
  };
}
