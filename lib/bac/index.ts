// BAC estimation engine — pure TypeScript, no UI or database dependency.
// Scientific basis: docs/synthese-alcoolemie.pdf, traced in docs/parametres-scientifiques.md.

export { cocktailGrams, ethanolGrams, standardDrinks } from "./dose";
export { eliminationRate, foodStateAt, totalBodyWater, widmarkR } from "./physiology";
export { levelOf, simulate } from "./simulate";
export type * from "./types";
