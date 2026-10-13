import { ETHANOL_DENSITY_G_PER_ML, STANDARD_DRINK_G } from "./parameters";

/** Pure ethanol mass of a drink: volume (mL) × ABV (%) / 100 × 0.789 — docs/parametres-scientifiques.md#P-01. */
export function ethanolGrams(volumeMl: number, abvPercent: number): number {
  if (volumeMl < 0 || abvPercent < 0 || abvPercent > 100) throw new RangeError("Invalid volume or ABV");
  return volumeMl * (abvPercent / 100) * ETHANOL_DENSITY_G_PER_ML;
}

/** Ethanol mass of a cocktail: sum over its alcoholic ingredients — docs/parametres-scientifiques.md#P-03. */
export function cocktailGrams(ingredients: readonly { volumeMl: number; abvPercent: number }[]): number {
  return ingredients.reduce((sum, { volumeMl, abvPercent }) => sum + ethanolGrams(volumeMl, abvPercent), 0);
}

/** Equivalent in French standard drinks (10 g) — docs/parametres-scientifiques.md#P-02. */
export function standardDrinks(grams: number): number {
  return grams / STANDARD_DRINK_G;
}
