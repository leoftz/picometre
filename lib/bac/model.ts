// One Monte Carlo draw = one plausible person × one plausible set of drinks.
// The trajectory is a Widmark model with Watson's volume of distribution, first-order absorption per
// food state and saturable elimination, integrated on a 5-minute grid (docs/parametres-scientifiques.md §2–§5).

import {
  ABSORPTION_KA_CV,
  ABSORPTION_KA_PER_H,
  BETA_BOUNDS,
  BETA_CV,
  BIOAVAILABILITY,
  DRINK_ABV_CV,
  DRINK_VOLUME_CV,
  R_BETA_CORRELATION,
  R_CV,
  STEP_MIN,
  WEIGHT_CV,
} from "./parameters";
import { eliminationAt } from "./physiology";
import { standardNormal, streamFor } from "./random";
import type { FoodState, Pour } from "./types";

export const STEP_MS = STEP_MIN * 60_000;
const STEP_H = STEP_MIN / 60;
const FOOD_STATES: readonly FoodState[] = ["jeun", "collation", "repas"];

/** A drink as seen by the model: when, how much, how precisely poured, and in which food state. */
export interface ModelIntake {
  at: number;
  grams: number;
  pour: Pour;
  food: FoodState;
}

/** Person-level parameters of one draw. Drink-level factors are drawn per drink (see `drinkFactor`). */
export interface Draw {
  index: number;
  /** Volume of distribution r × weight (L). */
  volumeL: number;
  /** Elimination rate (g/L/h). */
  beta: number;
  /** Bioavailability per food state. */
  bioavailability: Record<FoodState, number>;
  /** Absorption rate per food state (h⁻¹). */
  ka: Record<FoodState, number>;
}

export interface Nominal {
  r: number;
  beta: number;
  weightKg: number;
}

const truncate = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const KA_SIGMA = Math.sqrt(Math.log(1 + ABSORPTION_KA_CV ** 2));

/** Central (non-random) draw: every parameter at its nominal value. */
export function nominalDraw({ r, beta, weightKg }: Nominal): Draw {
  return {
    index: -1,
    volumeL: r * weightKg,
    beta,
    bioavailability: { jeun: BIOAVAILABILITY.jeun.nominal, collation: BIOAVAILABILITY.collation.nominal, repas: BIOAVAILABILITY.repas.nominal },
    ka: { ...ABSORPTION_KA_PER_H },
  };
}

/** Draw `index` of the Monte Carlo sample for this seed (docs/parametres-scientifiques.md#P-31 to #P-34, #P-12, #P-13, #P-19, #P-25). */
export function randomDraw({ r, beta, weightKg }: Nominal, seed: number, index: number): Draw {
  const random = streamFor(seed, index);
  // Correlated r and β (P-31, P-25, P-32).
  const zR = standardNormal(random);
  const zBeta = R_BETA_CORRELATION * zR + Math.sqrt(1 - R_BETA_CORRELATION ** 2) * standardNormal(random);
  const drawnR = r * Math.max(0.5, 1 + R_CV * zR);
  const drawnBeta = truncate(beta * (1 + BETA_CV * zBeta), BETA_BOUNDS.min, BETA_BOUNDS.max);
  // Declared weight (P-34): scales the volume of distribution.
  const weightFactor = Math.max(0.5, 1 + WEIGHT_CV * standardNormal(random));
  // One position in each food state's F range, shared by all drinks of the draw (P-12, P-13).
  const fPosition = random();
  // One log-normal factor on ka, shared by all food states (P-19).
  const kaFactor = Math.exp(KA_SIGMA * standardNormal(random) - KA_SIGMA ** 2 / 2);

  const bioavailability = {} as Record<FoodState, number>;
  const ka = {} as Record<FoodState, number>;
  for (const state of FOOD_STATES) {
    const { min, max } = BIOAVAILABILITY[state];
    bioavailability[state] = Math.min(1, min + fPosition * (max - min));
    ka[state] = ABSORPTION_KA_PER_H[state] * kaFactor;
  }

  return { index, volumeL: drawnR * weightKg * weightFactor, beta: drawnBeta, bioavailability, ka };
}

/** Multiplicative error on the ethanol mass of drink `drinkIndex` in draw `draw` (P-33 and « à l'œil »). */
export function drinkFactor(seed: number, draw: Draw, drinkIndex: number, pour: Pour): number {
  if (draw.index < 0) return 1;
  const random = streamFor(seed, draw.index, drinkIndex + 1);
  const volume = 1 + DRINK_VOLUME_CV[pour] * standardNormal(random);
  const abv = 1 + DRINK_ABV_CV * standardNormal(random);
  return Math.max(0.1, volume) * Math.max(0.1, abv);
}

/** State of one draw at a grid time: blood concentration, ethanol still in the gut, next drink to ingest. */
export interface DrawState {
  c: number;
  gut: Record<FoodState, number>;
  next: number;
}

function absorbedFractions(draw: Draw): Record<FoodState, number> {
  const fractions = {} as Record<FoodState, number>;
  for (const state of FOOD_STATES) fractions[state] = 1 - Math.exp(-draw.ka[state] * STEP_H);
  return fractions;
}

/**
 * Advances `state` by one 5-minute step ending at `stepEnd`: drinks taken before `stepEnd` enter the gut,
 * a first-order fraction is absorbed, then elimination is applied (P-26 to P-28, P-30).
 */
function advance(
  draw: Draw,
  state: DrawState,
  fractions: Record<FoodState, number>,
  intakes: readonly ModelIntake[],
  stepEnd: number,
  seed: number,
): void {
  while (state.next < intakes.length && intakes[state.next]!.at < stepEnd) {
    const intake = intakes[state.next]!;
    state.gut[intake.food] +=
      intake.grams * draw.bioavailability[intake.food] * drinkFactor(seed, draw, state.next, intake.pour);
    state.next++;
  }
  for (const food of FOOD_STATES) {
    const absorbed = state.gut[food] * fractions[food];
    state.gut[food] -= absorbed;
    state.c += absorbed / draw.volumeL;
  }
  state.c = Math.max(0, state.c - eliminationAt(state.c, draw.beta) * STEP_H);
}

/**
 * Concentration (g/L) at each grid time t0 + k × 5 min, k = 0..steps. `intakes` must be sorted by time.
 * If `snapshotAt` is given, also returns a copy of the state right after step `snapshotAt`.
 */
export function trajectory(
  draw: Draw,
  intakes: readonly ModelIntake[],
  t0: number,
  steps: number,
  seed: number,
  snapshotAt = -1,
): { concentrations: Float64Array; snapshot: DrawState | null } {
  const concentrations = new Float64Array(steps + 1);
  const fractions = absorbedFractions(draw);
  const state: DrawState = { c: 0, gut: { jeun: 0, collation: 0, repas: 0 }, next: 0 };
  let snapshot: DrawState | null = snapshotAt === 0 ? { ...state, gut: { ...state.gut } } : null;

  for (let k = 1; k <= steps; k++) {
    advance(draw, state, fractions, intakes, t0 + k * STEP_MS, seed);
    concentrations[k] = state.c;
    if (k === snapshotAt) snapshot = { ...state, gut: { ...state.gut } };
  }
  return { concentrations, snapshot };
}

/**
 * Highest concentration reached from grid step `fromStep` onwards, continuing from `snapshot` (taken at
 * step `snapshotStep`). Stops as soon as every drink is absorbed and the concentration is falling.
 */
export function futurePeak(
  draw: Draw,
  snapshot: DrawState,
  snapshotStep: number,
  intakes: readonly ModelIntake[],
  t0: number,
  fromStep: number,
  seed: number,
): number {
  const fractions = absorbedFractions(draw);
  const state: DrawState = { ...snapshot, gut: { ...snapshot.gut } };
  let peak = snapshotStep >= fromStep ? state.c : 0;
  // Safety bound (48 h of steps) in case the stop condition is never met.
  for (let k = snapshotStep + 1; k <= snapshotStep + (48 * 60) / STEP_MIN; k++) {
    const previous = state.c;
    advance(draw, state, fractions, intakes, t0 + k * STEP_MS, seed);
    if (k >= fromStep && state.c > peak) peak = state.c;
    const gutLeft = state.gut.jeun + state.gut.collation + state.gut.repas;
    if (k >= fromStep && state.next >= intakes.length && gutLeft < 1e-3 && state.c <= previous) return peak;
  }
  return peak;
}
