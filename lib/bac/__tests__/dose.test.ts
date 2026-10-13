import { describe, expect, it } from "vitest";
import { cocktailGrams, ethanolGrams, standardDrinks } from "../dose";

describe("ethanolGrams — P-01", () => {
  it.each([
    // [volume mL, ABV %, expected g] — examples of docs/parametres-scientifiques.md §1.1
    [250, 5, 9.9], // demi de bière (P-88)
    [500, 5, 19.7], // pinte (P-90)
    [330, 8.5, 22.1], // triple en 33 cl (P-89)
    [120, 13, 12.3], // verre de vin rouge (P-86)
    [100, 12, 9.5], // flûte (P-85)
    [30, 40, 9.5], // shot (P-80)
    [20, 45, 7.1], // dose de pastis (P-83)
  ])("%i mL at %i %% → %f g", (volume, abv, grams) => {
    expect(ethanolGrams(volume, abv)).toBeCloseTo(grams, 1);
  });

  it("rejects impossible values", () => {
    expect(() => ethanolGrams(-1, 5)).toThrow(RangeError);
    expect(() => ethanolGrams(250, 101)).toThrow(RangeError);
  });
});

describe("cocktailGrams — P-03", () => {
  it("sums the alcoholic ingredients (R-05 Margarita: 20.5 g)", () => {
    expect(cocktailGrams([{ volumeMl: 50, abvPercent: 40 }, { volumeMl: 20, abvPercent: 30 }])).toBeCloseTo(20.5, 1);
  });

  it("is zero for a mocktail", () => {
    expect(cocktailGrams([])).toBe(0);
  });
});

describe("standardDrinks — P-02", () => {
  it("counts 10 g per standard drink", () => {
    expect(standardDrinks(19.7)).toBeCloseTo(1.97, 2);
  });
});
