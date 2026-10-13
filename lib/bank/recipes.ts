// Cocktail recipe library — docs/parametres-scientifiques.md §1.2 (R-01 to R-23, R-50 to R-55).
// Generic recipes, no brand (loi Évin, charte §9.8); quantities are usual bar measures (hors PDF — à valider).
// lib/bank/__tests__/recipes.test.ts checks every recipe against the doc and the bank.
import { ethanolGrams } from "@/lib/bac/dose";

export interface RecipeIngredient {
  /** What the doc calls it (rhum blanc, gin…): display only, never a brand. */
  label: string;
  /** A drink type of the bank (lib/bank/catalog.ts). */
  drinkType: string;
  volumeMl: number;
  abv: number;
}

export interface AlcoholFree {
  name: string;
  others: string;
}

export interface Recipe {
  ref: string;
  name: string;
  ingredients: RecipeIngredient[];
  others: string;
  /** The alcohol-free version, always shown next to the recipe (charte §4). */
  alcoholFree: AlcoholFree;
}

/** Recipes from 2.5 standard drinks are not offered (they stay possible through the cocktail builder). */
export const MAX_RECIPE_STANDARD_DRINKS = 2.5;

const spirit = (label: string, cl: number, abv = 40): RecipeIngredient => ({ label, drinkType: "spiritueux", volumeMl: cl * 10, abv });
const liqueur = (label: string, cl: number, abv: number): RecipeIngredient => ({ label, drinkType: "liqueur", volumeMl: cl * 10, abv });
const sparkling = (cl: number): RecipeIngredient => ({ label: "effervescent", drinkType: "effervescent", volumeMl: cl * 10, abv: 12 });

export const RECIPES: readonly Recipe[] = [
  { ref: "R-01", name: "Mojito", ingredients: [spirit("rhum blanc", 5)], others: "citron vert, menthe, sucre, eau gazeuse", alcoholFree: { name: "Virgin mojito", others: "citron vert, menthe, sucre, eau gazeuse" } },
  { ref: "R-02", name: "Gin tonic", ingredients: [spirit("gin", 4)], others: "tonic, citron", alcoholFree: { name: "Tonic citron-concombre", others: "tonic, citron, concombre" } },
  {
    ref: "R-03",
    name: "Spritz",
    ingredients: [sparkling(9), { label: "bitter léger", drinkType: "bitter-leger", volumeMl: 60, abv: 11 }],
    others: "eau gazeuse, orange",
    alcoholFree: { name: "Spritz sans alcool", others: "bitter sans alcool, tonic, orange" },
  },
  { ref: "R-04", name: "Hugo", ingredients: [sparkling(9)], others: "sirop de sureau, menthe, eau gazeuse", alcoholFree: { name: "Hugo sans alcool", others: "sirop de sureau, menthe, eau pétillante" } },
  { ref: "R-05", name: "Margarita", ingredients: [spirit("tequila", 5), liqueur("triple sec", 2, 30)], others: "citron vert", alcoholFree: { name: "Margarita sans alcool", others: "citron vert, orange, sel" } },
  { ref: "R-06", name: "Caïpirinha", ingredients: [spirit("cachaça", 5)], others: "citron vert, sucre", alcoholFree: { name: "Caïpi sans alcool", others: "citron vert, sucre, eau gazeuse" } },
  { ref: "R-07", name: "Daiquiri", ingredients: [spirit("rhum blanc", 5)], others: "citron vert, sucre", alcoholFree: { name: "Daiquiri fraise sans alcool", others: "fraise, citron vert, sucre" } },
  { ref: "R-08", name: "Piña colada", ingredients: [spirit("rhum", 5)], others: "ananas, lait de coco", alcoholFree: { name: "Virgin colada", others: "ananas, lait de coco" } },
  { ref: "R-09", name: "Rhum-cola", ingredients: [spirit("rhum", 5)], others: "cola, citron vert", alcoholFree: { name: "Cola citron vert", others: "cola, citron vert" } },
  { ref: "R-10", name: "Moscow mule", ingredients: [spirit("vodka", 5)], others: "ginger beer, citron vert", alcoholFree: { name: "Ginger mule sans alcool", others: "ginger beer, citron vert, menthe" } },
  { ref: "R-11", name: "Cosmopolitan", ingredients: [spirit("vodka", 4), liqueur("triple sec", 1.5, 30)], others: "cranberry, citron vert", alcoholFree: { name: "Cranberry pétillant", others: "cranberry, citron vert, eau gazeuse" } },
  { ref: "R-12", name: "Espresso martini", ingredients: [spirit("vodka", 4), liqueur("liqueur de café", 2, 20)], others: "café, sucre", alcoholFree: { name: "Espresso tonic", others: "café, tonic" } },
  { ref: "R-13", name: "White russian", ingredients: [spirit("vodka", 4), liqueur("liqueur de café", 2, 20)], others: "crème", alcoholFree: { name: "Café frappé crème", others: "café, crème, glace" } },
  {
    ref: "R-14",
    name: "Negroni",
    ingredients: [spirit("gin", 3), { label: "vermouth rouge", drinkType: "vermouth", volumeMl: 30, abv: 16 }, liqueur("bitter", 3, 25)],
    others: "orange",
    alcoholFree: { name: "Negroni sans alcool", others: "bitter sans alcool, verjus, orange" },
  },
  {
    ref: "R-15",
    name: "Americano",
    ingredients: [{ label: "vermouth rouge", drinkType: "vermouth", volumeMl: 30, abv: 16 }, liqueur("bitter", 3, 25)],
    others: "eau gazeuse, orange",
    alcoholFree: { name: "Bitter sans alcool et soda", others: "bitter sans alcool, eau gazeuse, orange" },
  },
  { ref: "R-16", name: "Ti' punch", ingredients: [spirit("rhum agricole", 4, 50)], others: "citron vert, sucre de canne", alcoholFree: { name: "Ti' punch sans alcool", others: "citron vert, canne, eau pétillante" } },
  { ref: "R-17", name: "Tequila sunrise", ingredients: [spirit("tequila", 5)], others: "jus d'orange, grenadine", alcoholFree: { name: "Sunrise sans alcool", others: "jus d'orange, grenadine" } },
  {
    ref: "R-18",
    name: "Kir",
    ingredients: [{ label: "vin blanc", drinkType: "vin-blanc", volumeMl: 100, abv: 12 }, liqueur("crème de cassis", 1.5, 16)],
    others: "—",
    alcoholFree: { name: "Cassis à l'eau pétillante", others: "sirop de cassis, eau pétillante" },
  },
  { ref: "R-19", name: "Kir royal", ingredients: [sparkling(10), liqueur("crème de cassis", 1.5, 16)], others: "—", alcoholFree: { name: "Cassis pétillant", others: "sirop de cassis, eau pétillante" } },
  { ref: "R-20", name: "Mimosa", ingredients: [sparkling(7.5)], others: "jus d'orange", alcoholFree: { name: "Jus d'orange pétillant", others: "jus d'orange, eau pétillante" } },
  { ref: "R-21", name: "Bellini", ingredients: [sparkling(10)], others: "purée de pêche", alcoholFree: { name: "Pêche pétillante", others: "purée de pêche, eau pétillante" } },
  {
    ref: "R-22",
    name: "Sangria",
    ingredients: [{ label: "vin rouge", drinkType: "vin-rouge", volumeMl: 100, abv: 13 }, spirit("spiritueux", 1)],
    others: "fruits, jus d'orange (verre de 15 cl)",
    alcoholFree: { name: "Sangria sans alcool", others: "jus de raisin, fruits, jus d'orange" },
  },
  {
    ref: "R-23",
    name: "Panaché",
    ingredients: [{ label: "bière blonde", drinkType: "biere-blonde", volumeMl: 125, abv: 5 }],
    others: "limonade",
    alcoholFree: { name: "Limonade", others: "limonade" },
  },
];

/** Alcohol-free recipes, put forward first (Menthe Fraîche). */
export const ALCOHOL_FREE_RECIPES: readonly (AlcoholFree & { ref: string })[] = [
  { ref: "R-50", name: "Virgin mojito", others: "citron vert, menthe, sucre, eau gazeuse" },
  { ref: "R-51", name: "Virgin colada", others: "ananas, lait de coco" },
  { ref: "R-52", name: "Ginger mule sans alcool", others: "ginger beer, citron vert, menthe" },
  { ref: "R-53", name: "Spritz sans alcool", others: "bitter sans alcool, tonic, orange" },
  { ref: "R-54", name: "Diabolo", others: "limonade et sirop au choix" },
  { ref: "R-55", name: "Joker eau pétillante", others: "eau gazeuse, citron, menthe ou concombre" },
];

/** docs/parametres-scientifiques.md#P-01, #P-03 — the recipe's ethanol (g), sum of its ingredients. */
export function recipeGrams(recipe: Pick<Recipe, "ingredients">): number {
  return recipe.ingredients.reduce((sum, i) => sum + ethanolGrams(i.volumeMl, i.abv), 0);
}

export const recipe = (ref: string) => RECIPES.find((r) => r.ref === ref);
export const alcoholFreeRecipe = (ref: string) => ALCOHOL_FREE_RECIPES.find((r) => r.ref === ref);
