// Public types of the BAC engine. Pure data: no UI, no database.
// Times are epoch milliseconds; concentrations are g/L; masses are grams.

export type Sex = "f" | "m" | "autre";
export type Habit = "occasionnel" | "regulier" | "frequent";
export type FoodState = "jeun" | "collation" | "repas";
export type MealKind = "collation" | "repas";
export type Pour = "dose" | "oeil";
export type Objective = "desinhibe" | "zero_gdb" | "festive";
export type GaugeLevel = 1 | 2 | 3 | 4;

export interface Profile {
  sex: Sex;
  /** Age in years (derived from the birth year, docs/parametres-scientifiques.md#P-09). */
  ageYears: number;
  heightCm: number;
  weightKg: number;
  habit: Habit;
}

export interface Intake {
  at: number;
  /** Pure ethanol mass of the drink, from volume × ABV (lib/bac/dose.ts). */
  grams: number;
  /** « dose » (bar measure) or « oeil » (poured by eye): drives the volume uncertainty. */
  pour: Pour;
}

export interface Meal {
  at: number;
  kind: MealKind;
}

/** A value with its 90 % range (percentiles 5, 50, 95 — docs/parametres-scientifiques.md#P-35). */
export interface Range {
  p5: number;
  p50: number;
  p95: number;
}

export interface CurvePoint extends Range {
  t: number;
}

export type Alert = "stop" | "pause" | "next" | "cap";

export interface SimulationInput {
  profile: Profile;
  intakes: readonly Intake[];
  meals: readonly Meal[];
  objective: Objective;
  now: number;
  /** Seed for the Monte Carlo draws: keep it stable for a participant and a party (P-36). */
  seed: string;
  /** Set once « Stop pour ce soir » has been reached: it stays for the rest of the party (P-54). */
  stopLockedAt?: number | null;
  /** Number of Monte Carlo draws (default P-36). */
  draws?: number;
  /** Test hook: force β and/or r instead of deriving them from the profile (PDF case hypotheses). */
  overrides?: { beta?: number; r?: number };
}

export interface SimulationResult {
  curve: CurvePoint[];
  /** Estimate at `now`. */
  current: Range;
  /** Gauge level of the median estimate at `now` (charte §5). */
  level: GaugeLevel;
  peak: Range & { at: number };
  /** Times at which each percentile curve drops below the landmark after the peak; null if never above it. */
  below05: Range | null;
  below02: Range | null;
  backToZero: Range | null;
  totalGrams: number;
  stopLocked: boolean;
  nextDrinkAt: number | null;
  alerts: Alert[];
}
