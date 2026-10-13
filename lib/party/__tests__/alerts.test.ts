import { describe, expect, it } from "vitest";
import { simulate } from "@/lib/bac";
import type { Objective } from "@/lib/bac/types";
import { alertsFor, objectiveKept } from "../alerts";

const T0 = Date.UTC(2026, 9, 17, 18, 0);
const MIN = 60_000;
const HOUR = 60 * MIN;
const man = { sex: "m" as const, ageYears: 40, heightCm: 180, weightKg: 80, habit: "occasionnel" as const };
const run = (drinks: number, everyMin: number, now: number, objective: Objective = "festive") =>
  simulate({
    profile: man,
    intakes: Array.from({ length: drinks }, (_, i) => ({ at: T0 + i * everyMin * MIN, grams: 10, pour: "dose" as const })),
    meals: [],
    objective,
    now,
    seed: "alerts",
  });

describe("alertsFor", () => {
  it("says nothing when a drink would fit now: never « tu peux boire »", () => {
    expect(alertsFor(run(0, 0, T0), T0)).toEqual([]);
  });

  it("advises a pause with the time of the next possible drink", () => {
    const now = T0 + 100 * MIN;
    const result = run(5, 25, now);
    const [alert] = alertsFor(result, now);
    expect(alert).toMatchObject({ kind: "pause", title: "Pause fraîcheur conseillée" });
    expect(alert!.body).toMatch(/^Prochain verre possible à partir de \d{2}:\d{2}\. D'ici là, joker eau\.$/);
  });

  it("shows « Stop pour ce soir » alone once the ceiling is reached (P-54)", () => {
    const now = T0 + 2 * HOUR;
    expect(alertsFor(run(9, 10, now), now)).toEqual([expect.objectContaining({ kind: "stop", title: "Stop pour ce soir" })]);
  });

  it("announces the Stop as soon as the drinks already taken will reach the ceiling", () => {
    const now = T0 + 12 * MIN;
    const result = run(7, 2, now);
    expect(result.stopLocked).toBe(false);
    expect(alertsFor(result, now)[0]).toMatchObject({ kind: "stop", title: "Stop pour ce soir" });
  });

  it("closes the « Zéro gueule de bois » party after two standard drinks (P-57)", () => {
    const now = T0 + 3 * HOUR;
    expect(alertsFor(run(2, 60, now, "zero_gdb"), now)[0]).toMatchObject({ kind: "cap", title: "Objectif atteint" });
  });

  it("never uses incitement or driving vocabulary (charte §9)", () => {
    const scenarios = [run(0, 0, T0), run(5, 25, T0 + 100 * MIN), run(9, 10, T0 + 2 * HOUR), run(2, 60, T0 + 3 * HOUR, "zero_gdb")];
    const text = scenarios.flatMap((r, i) => alertsFor(r, [T0, T0 + 100 * MIN, T0 + 2 * HOUR, T0 + 3 * HOUR][i]!)).map((a) => `${a.title} ${a.body}`).join(" ");
    for (const forbidden of [/cul sec/i, /finis/i, /tu peux boire/i, /bois (un|encore)/i, /condui/i, /taux/i, /!.*!/]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it("keeps sentences short (charte §4: 20 words maximum)", () => {
    const now = T0 + 100 * MIN;
    for (const alert of alertsFor(run(5, 25, now), now)) {
      for (const sentence of alert.body.split(/(?<=[.:])\s/)) expect(sentence.split(/\s+/).length).toBeLessThanOrEqual(20);
    }
  });
});

describe("objectiveKept", () => {
  it("is kept with a light evening", () => {
    expect(objectiveKept(run(2, 90, T0 + 8 * HOUR, "desinhibe"), "desinhibe")).toBe(true);
  });

  it("is not kept after a Stop", () => {
    expect(objectiveKept(run(9, 10, T0 + 8 * HOUR), "festive")).toBe(false);
  });

  it("is not kept when the high end of the peak went over the objective", () => {
    expect(objectiveKept(run(5, 25, T0 + 8 * HOUR, "desinhibe"), "desinhibe")).toBe(false);
  });
});
