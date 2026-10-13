import { describe, expect, it } from "vitest";
import { simulate } from "@/lib/bac";
import { type ParticipantData, toSimulationInput } from "../estimate";

const now = Date.parse("2026-10-17T21:00:00Z");
const data: ParticipantData = {
  partyId: "p1",
  userId: "u1",
  health: { sex: "f", height_cm: 165, weight_kg: 55, habit: "occasionnel" },
  birthYear: 1996,
  objective: "zero_gdb",
  meal: { kind: "repas", at: "2026-10-17T18:30:00Z" },
  stopLockedAt: null,
  consumptions: [
    { consumed_at: "2026-10-17T19:00:00Z", ethanol_g: 9.9, pour: "dose" },
    { consumed_at: "2026-10-17T19:30:00Z", ethanol_g: 0, pour: "dose" },
    { consumed_at: "2026-10-17T20:00:00Z", ethanol_g: 12.3, pour: "oeil" },
  ],
};

describe("toSimulationInput", () => {
  const input = toSimulationInput(data, now);

  it("derives the age from the birth year (P-09)", () => {
    expect(input.profile.ageYears).toBe(30);
  });

  it("keeps alcoholic drinks only, with their grams and pour", () => {
    expect(input.intakes).toEqual([
      { at: Date.parse("2026-10-17T19:00:00Z"), grams: 9.9, pour: "dose" },
      { at: Date.parse("2026-10-17T20:00:00Z"), grams: 12.3, pour: "oeil" },
    ]);
  });

  it("passes the declared meal, and none when nothing was eaten", () => {
    expect(input.meals).toEqual([{ at: Date.parse("2026-10-17T18:30:00Z"), kind: "repas" }]);
    expect(toSimulationInput({ ...data, meal: { kind: "aucun", at: null } }, now).meals).toEqual([]);
  });

  it("uses a stable seed per participant and party (P-36)", () => {
    expect(input.seed).toBe("p1:u1");
  });

  it("feeds the engine end to end", () => {
    const result = simulate(input);
    expect(result.totalGrams).toBeCloseTo(22.2, 1);
    expect(result.current.p50).toBeGreaterThan(0);
    expect(result.alerts).toContain("cap"); // zero_gdb: 2 standard drinks reached (P-51)
  });
});
