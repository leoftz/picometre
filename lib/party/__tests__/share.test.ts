import { describe, expect, it } from "vitest";
import { simulate } from "@/lib/bac";
import { levelOf } from "@/lib/bac/simulate";
import { levelAt, sameShare, shareFrom } from "../share";

const T0 = Date.UTC(2026, 9, 17, 18, 0);
const MIN = 60_000;
const HOUR = 60 * MIN;
const man = { sex: "m" as const, ageYears: 40, heightCm: 180, weightKg: 80, habit: "occasionnel" as const };
const run = (drinks: number, now: number) =>
  simulate({
    profile: man,
    intakes: Array.from({ length: drinks }, (_, i) => ({ at: T0 + i * 20 * MIN, grams: 10, pour: "dose" as const })),
    meals: [],
    objective: "festive",
    now,
    seed: "share",
  });

describe("shareFrom", () => {
  it("carries only a level, its schedule and the Stop — never a value in g/L", () => {
    const share = shareFrom(run(5, T0 + 2 * HOUR), T0 + 2 * HOUR);
    expect(Object.keys(share).sort()).toEqual(["level", "schedule", "stopped"]);
    for (const entry of share.schedule) expect(Object.keys(entry).sort()).toEqual(["at", "level"]);
  });

  it("starts from the displayed level and comes back down to level 1", () => {
    const now = T0 + 2 * HOUR;
    const result = run(5, now);
    const share = shareFrom(result, now);
    expect(share.level).toBe(result.level);
    expect(share.level).toBeGreaterThan(1);
    expect(share.schedule.at(-1)!.level).toBe(1);
    expect(share.schedule.every((e) => Date.parse(e.at) > now)).toBe(true);
  });

  it("follows the gauge estimate (p75) at every time", () => {
    const now = T0 + 90 * MIN;
    const result = run(4, now);
    const share = shareFrom(result, now);
    for (const point of result.curve.filter((p) => p.t >= now)) expect(levelAt(share, point.t)).toBe(levelOf(point.gauge));
  });

  it("shares the permanent Stop", () => {
    const now = T0 + 4 * HOUR;
    expect(shareFrom(run(10, now), now).stopped).toBe(true);
    expect(shareFrom(run(2, now), now).stopped).toBe(false);
  });

  it("has nothing to schedule without a drink", () => {
    expect(shareFrom(run(0, T0), T0)).toEqual({ level: 1, schedule: [], stopped: false });
  });
});

describe("levelAt", () => {
  const share = {
    level: 3 as const,
    schedule: [
      { at: new Date(T0 + HOUR).toISOString(), level: 2 as const },
      { at: new Date(T0 + 2 * HOUR).toISOString(), level: 1 as const },
    ],
  };
  it.each([
    [T0, 3],
    [T0 + HOUR, 2],
    [T0 + 90 * MIN, 2],
    [T0 + 3 * HOUR, 1],
  ])("at %i shows level %i", (now, level) => expect(levelAt(share, now)).toBe(level));
});

describe("sameShare", () => {
  it("only differs when something visible changes", () => {
    const a = { level: 2 as const, schedule: [], stopped: false };
    expect(sameShare(a, { ...a })).toBe(true);
    expect(sameShare(a, { ...a, level: 3 })).toBe(false);
  });
});
