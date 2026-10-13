import {
  LEVEL_FLOORS_G_PER_L,
  NEXT_DRINK_GRAMS,
  NEXT_DRINK_SEARCH_H,
  OBJECTIVES,
  PAUSE_FROM_LEVEL,
  STOP_G_PER_L,
} from "@/config/objectifs";
import {
  type Draw,
  type DrawState,
  type ModelIntake,
  STEP_MS,
  futurePeak,
  nominalDraw,
  randomDraw,
  trajectory,
} from "./model";
import {
  GAUGE_PERCENTILE,
  HORIZON_AFTER_LAST_DRINK_H,
  LANDMARKS_G_PER_L,
  MONTE_CARLO_DRAWS,
  PERCENTILES,
  ZERO_G_PER_L,
} from "./parameters";
import { eliminationRate, foodStateAt, widmarkR } from "./physiology";
import { hashSeed } from "./random";
import type { Alert, CurvePoint, GaugeLevel, Range, SimulationInput, SimulationResult } from "./types";

const HOUR_MS = 3_600_000;

/** Percentile (linear interpolation) of a sorted array. */
function percentileOfSorted(sorted: Float64Array, q: number): number {
  const position = q * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower);
}

function rangeOf(values: Float64Array): Range & { gauge: number } {
  const sorted = Float64Array.from(values).sort();
  return {
    p5: percentileOfSorted(sorted, PERCENTILES.low),
    p50: percentileOfSorted(sorted, PERCENTILES.median),
    p95: percentileOfSorted(sorted, PERCENTILES.high),
    gauge: percentileOfSorted(sorted, GAUGE_PERCENTILE),
  };
}

const pick = ({ p5, p50, p95 }: Range): Range => ({ p5, p50, p95 });

/** Gauge level of a concentration (charte §5, docs/parametres-scientifiques.md#P-40 to #P-43). */
export function levelOf(gramsPerLiter: number): GaugeLevel {
  if (gramsPerLiter >= LEVEL_FLOORS_G_PER_L[4]) return 4;
  if (gramsPerLiter >= LEVEL_FLOORS_G_PER_L[3]) return 3;
  if (gramsPerLiter >= LEVEL_FLOORS_G_PER_L[2]) return 2;
  return 1;
}

interface Prepared {
  draws: Draw[];
  seed: number;
  /** Sorted by time. */
  intakes: ModelIntake[];
  t0: number;
  steps: number;
  /** Grid step containing `now`. */
  nowStep: number;
}

function prepare(input: SimulationInput): Prepared {
  const { profile, meals, now, overrides } = input;
  const nominal = {
    r: overrides?.r ?? widmarkR(profile),
    beta: overrides?.beta ?? eliminationRate(profile),
    weightKg: profile.weightKg,
  };
  const seed = hashSeed(input.seed);
  const count = input.draws ?? MONTE_CARLO_DRAWS;
  const draws = count === 0 ? [nominalDraw(nominal)] : Array.from({ length: count }, (_, i) => randomDraw(nominal, seed, i));

  const intakes: ModelIntake[] = input.intakes
    .map((intake) => ({ ...intake, food: foodStateAt(intake.at, meals) }))
    .sort((a, b) => a.at - b.at);

  const first = Math.min(now, intakes[0]?.at ?? now);
  const last = Math.max(now, intakes.at(-1)?.at ?? now);
  const t0 = Math.floor(first / STEP_MS) * STEP_MS;
  const steps = Math.ceil((last + HORIZON_AFTER_LAST_DRINK_H * HOUR_MS - t0) / STEP_MS);
  const nowStep = Math.min(steps, Math.max(0, Math.floor((now - t0) / STEP_MS)));
  return { draws, seed, intakes, t0, steps, nowStep };
}

/** First time the curve drops below `threshold` after its maximum, or null if it never reaches it. */
function crossingDown(times: number[], values: number[], threshold: number): number | null {
  let peakIndex = 0;
  values.forEach((v, k) => {
    if (v > values[peakIndex]!) peakIndex = k;
  });
  if (values[peakIndex]! < threshold) return null;
  for (let k = peakIndex; k < values.length; k++) if (values[k]! < threshold) return times[k]!;
  return null;
}

function crossingRange(curve: CurvePoint[], threshold: number): Range | null {
  const times = curve.map((p) => p.t);
  const p50 = crossingDown(times, curve.map((p) => p.p50), threshold);
  if (p50 === null) return null;
  // Lower curve crosses earlier, upper curve later: that ordering is the 90 % range of the time.
  return {
    p5: crossingDown(times, curve.map((p) => p.p5), threshold) ?? curve[0]!.t,
    p50,
    p95: crossingDown(times, curve.map((p) => p.p95), threshold) ?? times.at(-1)!,
  };
}

/**
 * « Prochain verre possible » — docs/parametres-scientifiques.md#P-56 and #P-51 to #P-53:
 * first 5-minute slot from `now` where one more standard drink keeps the p95 of the future peak
 * strictly below the objective's threshold. Binary search over the slots of the next 12 h: it assumes
 * that once the condition holds it keeps holding later (without new drinks, BAC only goes down).
 */
function findNextDrink(input: SimulationInput, base: Prepared, snapshots: DrawState[]): number | null {
  const { peakP95Max } = OBJECTIVES[input.objective];
  const lastIntake = base.intakes.at(-1)?.at ?? input.now;
  const peaks = new Float64Array(base.draws.length);
  const fits = (at: number) => {
    // The hypothetical drink goes last, so the drinks already taken keep their Monte Carlo factors.
    const when = Math.max(at, lastIntake);
    const extra: ModelIntake = { at: when, grams: NEXT_DRINK_GRAMS, pour: "dose", food: foodStateAt(when, input.meals) };
    const intakes = [...base.intakes, extra];
    const fromStep = Math.floor((when - base.t0) / STEP_MS);
    base.draws.forEach((draw, i) => {
      peaks[i] = futurePeak(draw, snapshots[i]!, base.nowStep, intakes, base.t0, fromStep, base.seed);
    });
    return rangeOf(peaks).p95 < peakP95Max;
  };

  if (fits(input.now)) return input.now;

  const slot0 = Math.ceil(input.now / STEP_MS) * STEP_MS;
  const slotTime = (slot: number) => slot0 + slot * STEP_MS;
  let low = 0; // a slot known not to fit
  let high = (NEXT_DRINK_SEARCH_H * HOUR_MS) / STEP_MS;
  if (!fits(slotTime(high))) return null;
  if (fits(slotTime(0))) return slotTime(0);
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (fits(slotTime(middle))) high = middle;
    else low = middle;
  }
  return slotTime(high);
}

/** Runs the whole estimation for one participant at time `now`. Pure and deterministic for a given seed. */
export function simulate(input: SimulationInput): SimulationResult {
  const prepared = prepare(input);
  const { draws, seed, intakes, t0, steps, nowStep } = prepared;
  const runs = draws.map((draw) => trajectory(draw, intakes, t0, steps, seed, nowStep));
  const trajectories = runs.map((r) => r.concentrations);
  const snapshots = runs.map((r) => r.snapshot!);

  const curve: CurvePoint[] = [];
  const column = new Float64Array(trajectories.length);
  for (let k = 0; k <= steps; k++) {
    trajectories.forEach((curveOfDraw, i) => (column[i] = curveOfDraw[k]!));
    curve.push({ t: t0 + k * STEP_MS, ...rangeOf(column) });
  }

  const current = curve[nowStep]!;

  const peaks = new Float64Array(trajectories.length);
  trajectories.forEach((c, i) => (peaks[i] = c.reduce((max, v) => Math.max(max, v), 0)));
  const peakPoint = curve.reduce((best, p) => (p.p50 > best.p50 ? p : best), curve[0]!);

  // P-54, P-39: Stop once the gauge estimate has reached the ceiling at any time up to now, for the rest of the party.
  const reachedStop = curve.slice(0, nowStep + 1).some((p) => p.gauge >= STOP_G_PER_L);
  const stopLocked = Boolean(input.stopLockedAt) || reachedStop;

  const totalGrams = input.intakes.reduce((sum, i) => sum + i.grams, 0);
  const { capGrams } = OBJECTIVES[input.objective];
  const capReached = capGrams !== null && totalGrams + NEXT_DRINK_GRAMS > capGrams;

  const nextDrinkAt = stopLocked || capReached ? null : findNextDrink(input, prepared, snapshots);
  const level = levelOf(current.gauge);

  const alerts: Alert[] = [];
  if (stopLocked) alerts.push("stop");
  else {
    if (capReached) alerts.push("cap");
    if (level >= PAUSE_FROM_LEVEL || (nextDrinkAt !== null && nextDrinkAt > input.now) || capReached) alerts.push("pause");
    if (nextDrinkAt !== null) alerts.push("next");
  }

  return {
    curve,
    current: { p5: current.p5, p50: current.p50, p95: current.p95, gauge: current.gauge },
    level,
    peak: { ...pick(rangeOf(peaks)), at: peakPoint.t },
    below05: crossingRange(curve, LANDMARKS_G_PER_L.haut),
    below02: crossingRange(curve, LANDMARKS_G_PER_L.bas),
    backToZero: crossingRange(curve, ZERO_G_PER_L),
    totalGrams,
    stopLocked,
    nextDrinkAt,
    alerts,
  };
}
