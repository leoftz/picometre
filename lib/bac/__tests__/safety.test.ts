// Safety rules: charte §9 and the common ceiling of the cahier des charges (docs/parametres-scientifiques.md §6).
import { describe, expect, it } from "vitest";
import { LEVEL_FLOORS_G_PER_L, OBJECTIVES, STOP_G_PER_L } from "@/config/objectifs";
import { STEP_MS } from "../model";
import { levelOf, simulate } from "../simulate";
import { HOUR, MIN, T0, input, man80, standardDrinks, woman55 } from "./fixtures";

describe("configuration", () => {
  it("never lets an objective reach the Stop ceiling, even at the high end of the range", () => {
    for (const objective of Object.values(OBJECTIVES)) expect(objective.peakP95Max).toBeLessThanOrEqual(STOP_G_PER_L);
  });

  it("puts the Stop ceiling at the start of gauge level 4 (charte §5)", () => {
    expect(STOP_G_PER_L).toBe(LEVEL_FLOORS_G_PER_L[4]);
  });
});

describe("levelOf — charte §5", () => {
  it.each([
    [0, 1],
    [0.19, 1],
    [0.2, 2],
    [0.49, 2],
    [0.5, 3],
    [0.79, 3],
    [0.8, 4],
    [2, 4],
  ])("%f g/L → level %i", (c, level) => {
    expect(levelOf(c)).toBe(level);
  });
});

describe("determinism — P-36", () => {
  const scenario = input({ profile: woman55, intakes: standardDrinks(2, 30), now: T0 + 45 * MIN });

  it("gives the same result for the same seed", () => {
    expect(simulate(scenario)).toEqual(simulate(scenario));
  });

  it("depends on the seed only within the uncertainty", () => {
    const a = simulate(scenario).peak.p50;
    const b = simulate({ ...scenario, seed: "another" }).peak.p50;
    expect(Math.abs(a - b) / a).toBeLessThan(0.05);
  });
});

describe("before the first drink", () => {
  it.each(Object.keys(OBJECTIVES) as (keyof typeof OBJECTIVES)[])("« %s »: a first drink is possible now, gauge at level 1", (objective) => {
    const result = simulate(input({ profile: woman55, objective, now: T0 }));
    expect(result.nextDrinkAt).toBe(T0);
    expect(result.level).toBe(1);
    expect(result.alerts).toEqual(["next"]);
  });
});

describe("« Prochain verre possible » — P-56", () => {
  const scenario = input({ profile: man80, intakes: standardDrinks(5, 25), now: T0 + 100 * MIN, objective: "festive" });
  const result = simulate(scenario);

  it("is in the future after five quick drinks, with a « Pause fraîcheur »", () => {
    expect(result.nextDrinkAt).toBeGreaterThan(scenario.now);
    expect(result.alerts).toEqual(["pause", "next"]);
  });

  it("is the first slot where the drink fits: at that time it fits at once, 5 min before it does not", () => {
    const next = result.nextDrinkAt!;
    expect(simulate({ ...scenario, now: next }).nextDrinkAt).toBe(next);
    expect(simulate({ ...scenario, now: next - STEP_MS }).nextDrinkAt).toBeGreaterThan(next - STEP_MS);
  });

  it("comes later for a stricter objective", () => {
    const strict = simulate({ ...scenario, objective: "desinhibe" }).nextDrinkAt;
    expect(strict === null || strict > result.nextDrinkAt!).toBe(true);
  });

  it("stays within the next 12 hours or is not shown", () => {
    expect(result.nextDrinkAt! - scenario.now).toBeLessThanOrEqual(12 * HOUR);
  });
});

describe("« Zéro gueule de bois » cap — P-51, P-57", () => {
  it("offers no drink once two standard drinks are reached", () => {
    const result = simulate(input({ profile: man80, objective: "zero_gdb", intakes: standardDrinks(2, 60), now: T0 + 3 * HOUR }));
    expect(result.nextDrinkAt).toBeNull();
    expect(result.alerts).toEqual(["cap", "pause"]);
  });

  it("counts grams, not glasses: one pint (19.7 g) already fills the cap", () => {
    const pint = [{ at: T0, grams: 19.7, pour: "dose" as const }];
    const result = simulate(input({ profile: man80, objective: "zero_gdb", intakes: pint, now: T0 + 4 * HOUR }));
    expect(result.nextDrinkAt).toBeNull();
  });
});

describe("« Stop pour ce soir » — P-54", () => {
  const heavy = input({ profile: woman55, intakes: standardDrinks(6, 10), now: T0 + 2 * HOUR });

  it("triggers when the median reaches 0.8 g/L, with no drink offered", () => {
    const result = simulate(heavy);
    expect(result.stopLocked).toBe(true);
    expect(result.nextDrinkAt).toBeNull();
    expect(result.alerts).toEqual(["stop"]);
  });

  it("stays for the rest of the party, even once the gauge is back down", () => {
    const later = simulate({ ...heavy, now: T0 + 10 * HOUR });
    expect(later.level).toBe(1);
    expect(later.stopLocked).toBe(true);
    expect(later.nextDrinkAt).toBeNull();
  });

  it("is kept when the app passes a stored lock, whatever the current estimate", () => {
    const result = simulate(input({ profile: man80, stopLockedAt: T0, now: T0 + HOUR }));
    expect(result.alerts).toEqual(["stop"]);
  });
});

describe("outputs — P-37", () => {
  const result = simulate(input({ profile: man80, intakes: standardDrinks(5, 25), now: T0 + 100 * MIN }));

  it("orders every range p5 ≤ p50 ≤ p95", () => {
    for (const range of [result.current, result.peak, result.below05!, result.below02!, result.backToZero!]) {
      expect(range.p5).toBeLessThanOrEqual(range.p50);
      expect(range.p50).toBeLessThanOrEqual(range.p95);
    }
  });

  it("goes below 0.5, then 0.2, then back to zero", () => {
    expect(result.below05!.p50).toBeLessThan(result.below02!.p50);
    expect(result.below02!.p50).toBeLessThan(result.backToZero!.p50);
  });

  it("samples the curve every 5 minutes (P-30)", () => {
    expect(result.curve[1]!.t - result.curve[0]!.t).toBe(5 * MIN);
  });

  it("returns no landmark the median never reached", () => {
    const light = simulate(input({ profile: man80, intakes: standardDrinks(1, 0), now: T0 + HOUR }));
    expect(light.below05).toBeNull();
  });

  it("estimates « à l'œil » drinks with a wider range than measured ones", () => {
    const poured = standardDrinks(3, 20).map((i) => ({ ...i, pour: "oeil" as const }));
    const measured = simulate(input({ profile: man80, intakes: standardDrinks(3, 20), now: T0 + HOUR })).peak;
    const byEye = simulate(input({ profile: man80, intakes: poured, now: T0 + HOUR })).peak;
    expect(byEye.p95 - byEye.p5).toBeGreaterThan(measured.p95 - measured.p5);
  });
});

describe("performance", () => {
  it("runs a full estimation (1 000 draws + next drink search) fast enough for a phone", () => {
    const started = performance.now();
    simulate(input({ profile: man80, intakes: standardDrinks(8, 30), now: T0 + 4 * HOUR }));
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
