// The three worked cases of docs/synthese-alcoolemie.pdf (p. 6), traced in
// docs/parametres-scientifiques.md#C-1 to #C-3. Acceptance criteria (§7 of that file):
// median peak within ±15 %, peak time within ±30 min, the figure's value inside p5–p95,
// back to zero within ±25 %.
import { describe, expect, it } from "vitest";
import { simulate } from "../simulate";
import { MIN, T0, hours, input, man80, standardDrinks, woman55 } from "./fixtures";

const cases = [
  {
    id: "C-1",
    label: "femme 55 kg, 3 verres en 40 min, à jeun (β = 0,17)",
    run: () => simulate(input({ profile: woman55, intakes: standardDrinks(3, 20), now: T0 + 40 * MIN, overrides: { beta: 0.17 } })),
    figure: { peak: 0.65, peakAtH: 1, zeroAtH: 6.5 },
  },
  {
    id: "C-2",
    label: "homme 80 kg, 5 verres en 1 h 40, à jeun (β = 0,15)",
    run: () => simulate(input({ profile: man80, intakes: standardDrinks(5, 25), now: T0 + 100 * MIN, overrides: { beta: 0.15 } })),
    figure: { peak: 0.63, peakAtH: 2, zeroAtH: 7.5 },
  },
  {
    id: "C-2 (variante 2 h)",
    label: "homme 80 kg, 5 verres en 2 h, à jeun (sous-titre de la figure)",
    run: () => simulate(input({ profile: man80, intakes: standardDrinks(5, 30), now: T0 + 120 * MIN, overrides: { beta: 0.15 } })),
    figure: { peak: 0.63, peakAtH: 2, zeroAtH: 7.5 },
  },
  {
    id: "C-3",
    label: "homme 80 kg, 5 verres en 1 h 40, repas complet juste avant",
    run: () =>
      simulate(
        input({
          profile: man80,
          intakes: standardDrinks(5, 25),
          meals: [{ at: T0 - 15 * MIN, kind: "repas" }],
          now: T0 + 100 * MIN,
          overrides: { beta: 0.15 },
        }),
      ),
    figure: { peak: 0.3, peakAtH: 2.25, zeroAtH: 6.25 },
  },
];

describe.each(cases)("$id — $label", ({ run, figure }) => {
  const result = run();

  it("median peak within ±15 % of the figure", () => {
    expect(result.peak.p50).toBeGreaterThanOrEqual(figure.peak * 0.85);
    expect(result.peak.p50).toBeLessThanOrEqual(figure.peak * 1.15);
  });

  it("figure's peak inside the p5–p95 range", () => {
    expect(figure.peak).toBeGreaterThanOrEqual(result.peak.p5);
    expect(figure.peak).toBeLessThanOrEqual(result.peak.p95);
  });

  it("peak time within ±30 min", () => {
    expect(Math.abs(hours(result.peak.at) - figure.peakAtH)).toBeLessThanOrEqual(0.5);
  });

  it("back to zero within ±25 %, and the figure's time inside its range", () => {
    const zero = result.backToZero!;
    expect(hours(zero.p50)).toBeGreaterThanOrEqual(figure.zeroAtH * 0.75);
    expect(hours(zero.p50)).toBeLessThanOrEqual(figure.zeroAtH * 1.25);
    expect(figure.zeroAtH).toBeGreaterThanOrEqual(hours(zero.p5));
    expect(figure.zeroAtH).toBeLessThanOrEqual(hours(zero.p95));
  });

  it("reports a 90 % range of ±20–40 % around the peak, as the PDF states (p. 1, p. 9)", () => {
    const halfWidth = (result.peak.p95 - result.peak.p5) / 2 / result.peak.p50;
    expect(halfWidth).toBeGreaterThanOrEqual(0.15);
    expect(halfWidth).toBeLessThanOrEqual(0.45);
  });
});

describe("summary of the figure (p. 5–6)", () => {
  it("eating before drinking divides the peak by about two (Jones 1997, P-48)", () => {
    const fasting = cases[1]!.run().peak.p50;
    const fed = cases[3]!.run().peak.p50;
    expect(fed / fasting).toBeGreaterThan(0.4);
    expect(fed / fasting).toBeLessThan(0.6);
  });

  it("a 55 kg woman with 3 drinks peaks about as high as an 80 kg man with 5", () => {
    const woman = cases[0]!.run().peak.p50;
    const man = cases[1]!.run().peak.p50;
    expect(Math.abs(woman - man) / man).toBeLessThan(0.15);
  });

  it("back to zero earlier with a meal (PDF: about 1.5 h earlier)", () => {
    const fasting = cases[1]!.run().backToZero!.p50;
    const fed = cases[3]!.run().backToZero!.p50;
    expect(hours(fasting) - hours(fed)).toBeGreaterThan(0.75);
  });
});
