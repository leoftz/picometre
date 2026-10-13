import { describe, expect, it } from "vitest";
import { eliminationAt, eliminationRate, foodStateAt, totalBodyWater, widmarkR } from "../physiology";
import { HOUR, MIN, T0, man80, woman55 } from "./fixtures";

describe("Watson — P-05 to P-08", () => {
  it("reproduces r of the PDF's cases (p. 6)", () => {
    expect(widmarkR(woman55)).toBeCloseTo(0.66, 2);
    expect(widmarkR(man80)).toBeCloseTo(0.7, 2);
  });

  it("uses age for men only", () => {
    expect(totalBodyWater({ ...man80, ageYears: 60 })).toBeLessThan(totalBodyWater(man80));
    expect(totalBodyWater({ ...woman55, ageYears: 60 })).toBe(totalBodyWater(woman55));
  });

  it("treats sex « autre » with the female formula: the more cautious (higher) estimate", () => {
    const asMan = widmarkR({ ...man80, sex: "m" });
    const asOther = widmarkR({ ...man80, sex: "autre" });
    expect(asOther).toBe(widmarkR({ ...man80, sex: "f" }));
    expect(asOther).toBeLessThan(asMan);
  });
});

describe("β — P-21 to P-24", () => {
  it("uses the centre of the PDF range for each habit", () => {
    expect(eliminationRate({ ...man80, habit: "occasionnel" })).toBeCloseTo(0.135);
    expect(eliminationRate({ ...man80, habit: "regulier" })).toBeCloseTo(0.165);
  });

  it("never applies the faster « chronique » rate to « fréquent » (P-23, charte §9)", () => {
    expect(eliminationRate({ ...man80, habit: "frequent" })).toBe(eliminationRate({ ...man80, habit: "regulier" }));
  });

  it("adds 0.02 g/L/h for women, not for « autre »", () => {
    expect(eliminationRate(woman55)).toBeCloseTo(0.155);
    expect(eliminationRate({ ...woman55, sex: "autre" })).toBeCloseTo(0.135);
  });
});

describe("elimination — P-26 to P-28", () => {
  it("is zero order at or above 0.2 g/L", () => {
    expect(eliminationAt(0.2, 0.15)).toBe(0.15);
    expect(eliminationAt(1.2, 0.15)).toBe(0.15);
  });

  it("slows down proportionally below 0.2 g/L", () => {
    expect(eliminationAt(0.1, 0.15)).toBeCloseTo(0.075);
    expect(eliminationAt(0, 0.15)).toBe(0);
  });
});

describe("food state — P-20", () => {
  const meal = { at: T0, kind: "repas" as const };
  const snack = { at: T0, kind: "collation" as const };

  it.each([
    [-31 * MIN, "jeun"],
    [-30 * MIN, "repas"],
    [3 * HOUR, "repas"],
    [3 * HOUR + MIN, "jeun"],
  ])("a drink %i ms from a meal is « %s »", (offset, expected) => {
    expect(foodStateAt(T0 + offset, [meal])).toBe(expected);
  });

  it("uses a shorter window for a snack", () => {
    expect(foodStateAt(T0 + 90 * MIN, [snack])).toBe("collation");
    expect(foodStateAt(T0 + 91 * MIN, [snack])).toBe("jeun");
  });

  it("prefers the meal when both windows apply", () => {
    expect(foodStateAt(T0, [snack, meal])).toBe("repas");
  });
});
