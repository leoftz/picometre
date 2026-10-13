// The recipe library must match docs/parametres-scientifiques.md §1.2 and only use the bank (P-60 to P-79).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STANDARD_DRINK_G } from "@/lib/bac/parameters";
import { drinkType } from "../catalog";
import { ALCOHOL_FREE_RECIPES, MAX_RECIPE_STANDARD_DRINKS, RECIPES, recipeGrams } from "../recipes";

const doc = readFileSync("docs/parametres-scientifiques.md", "utf8");
const row = (ref: string) => doc.split("\n").find((line) => line.includes(`<a id="${ref}"></a>`))!;
const cells = (ref: string) => row(ref).split("|").map((c) => c.trim());
const number = (text: string) => Number(text.replace(",", ".").replace(/[^\d.]/g, ""));

describe.each(RECIPES)("$ref $name", (recipe) => {
  const [, , name, , , ethanol, standard, alcoholFree] = cells(recipe.ref);

  it("is the recipe of the doc", () => {
    expect(name!.startsWith(recipe.name)).toBe(true);
    // The doc names the alcohol-free version, or only lists what goes in it (R-16).
    const cell = alcoholFree!.toLowerCase();
    expect(cell.includes(recipe.alcoholFree.name.toLowerCase().split(" ")[0]!) || cell === recipe.alcoholFree.others.toLowerCase()).toBe(true);
  });

  it("has the doc's ethanol, within 0.1 g", () => {
    expect(Math.abs(recipeGrams(recipe) - number(ethanol!))).toBeLessThanOrEqual(0.1);
    expect(Math.abs(recipeGrams(recipe) / STANDARD_DRINK_G - number(standard!))).toBeLessThanOrEqual(0.1);
  });

  it("is light enough to be offered (charte §9)", () => {
    expect(recipeGrams(recipe) / STANDARD_DRINK_G).toBeLessThan(MAX_RECIPE_STANDARD_DRINKS);
  });

  it("only uses bank types, within their ABV range", () => {
    for (const ingredient of recipe.ingredients) {
      const type = drinkType(ingredient.drinkType);
      expect(type, ingredient.drinkType).toBeDefined();
      expect(ingredient.abv).toBeGreaterThanOrEqual(type!.abvMin);
      expect(ingredient.abv).toBeLessThanOrEqual(type!.abvMax);
    }
  });

  it("fits the cocktail name limit", () => {
    expect(recipe.name.length).toBeLessThanOrEqual(30);
    expect(recipe.alcoholFree.name.length).toBeLessThanOrEqual(30);
  });
});

describe("alcohol-free recipes", () => {
  it.each(ALCOHOL_FREE_RECIPES)("$ref $name is in the doc", ({ ref, name }) => {
    expect(cells(ref)[2]).toBe(name);
  });

  it("covers every recipe of the doc", () => {
    const refs = [...doc.matchAll(/<a id="(R-\d+)"><\/a>/g)].map((m) => m[1]);
    expect(refs.sort()).toEqual([...RECIPES, ...ALCOHOL_FREE_RECIPES].map((r) => r.ref).sort());
  });
});

describe("wording — charte §9", () => {
  it("never names a brand nor praises strength", () => {
    const text = JSON.stringify([RECIPES, ALCOHOL_FREE_RECIPES]);
    expect(text).not.toMatch(/le plus fort|puissant|explosif|cul sec|bacardi|absolut|smirnoff|aperol|campari|martini rosso|kahlua|cointreau/i);
  });
});
