import { describe, expect, it } from "vitest";
import { fieldErrors } from "@/lib/account/schemas";
import { cocktailSchema, participationSchema, partySchema, plannedDrinkSchema } from "../schemas";

const errorsOf = (result: { success: boolean; error?: Parameters<typeof fieldErrors>[0] }) =>
  result.success ? {} : fieldErrors(result.error!);

describe("partySchema", () => {
  it("accepts a party and turns an empty location into null", () => {
    const result = partySchema.parse({ title: " Crémaillère ", startsAt: "2026-10-17T18:00:00.000Z", location: "" });
    expect(result).toEqual({ title: "Crémaillère", startsAt: "2026-10-17T18:00:00.000Z", location: null });
  });

  it("requires a name and a date", () => {
    expect(errorsOf(partySchema.safeParse({ title: "", startsAt: "", location: "" }))).toEqual({
      title: "Donne un nom à ta soirée.",
      startsAt: "Indique la date et l'heure.",
    });
  });
});

describe("plannedDrinkSchema — bank rules (P-60 to P-93)", () => {
  const ipa = { drinkType: "biere-ipa", abv: "6.5", glass: "pinte", pour: "dose" };

  it("accepts a drink of the bank", () => {
    expect(plannedDrinkSchema.safeParse(ipa).success).toBe(true);
  });

  it("keeps the ABV within the type's range", () => {
    expect(errorsOf(plannedDrinkSchema.safeParse({ ...ipa, abv: "12" })).abv).toBe("Pour ce type, le degré va de 5,5 % à 7,5 %.");
  });

  it("only allows glasses offered for the type", () => {
    expect(errorsOf(plannedDrinkSchema.safeParse({ ...ipa, glass: "shot" })).glass).toBe("Choisis un verre proposé pour cette boisson.");
  });

  it("refuses ingredient-only and unknown types", () => {
    expect(plannedDrinkSchema.safeParse({ ...ipa, drinkType: "bitter-leger", abv: "11" }).success).toBe(false);
    expect(plannedDrinkSchema.safeParse({ ...ipa, drinkType: "marque-x" }).success).toBe(false);
  });
});

describe("cocktailSchema", () => {
  const margarita = {
    name: "Margarita maison",
    pour: "oeil",
    ingredients: [
      { drinkType: "spiritueux", volumeMl: 50, abv: 40 },
      { drinkType: "liqueur", volumeMl: 20, abv: 30 },
    ],
  };

  it("accepts a recipe of bank alcohols", () => {
    expect(cocktailSchema.safeParse(margarita).success).toBe(true);
  });

  it("needs at least one alcohol, from the bank, within its range", () => {
    expect(errorsOf(cocktailSchema.safeParse({ ...margarita, ingredients: [] })).ingredients).toBe("Ajoute au moins un alcool.");
    expect(cocktailSchema.safeParse({ ...margarita, ingredients: [{ drinkType: "eau", volumeMl: 50, abv: 0 }] }).success).toBe(false);
    expect(cocktailSchema.safeParse({ ...margarita, ingredients: [{ drinkType: "liqueur", volumeMl: 20, abv: 60 }] }).success).toBe(false);
  });
});

describe("participationSchema", () => {
  it("drops the meal time when nothing was eaten", () => {
    expect(participationSchema.parse({ objective: "festive", mealKind: "aucun", mealAt: "2026-10-17T18:00:00.000Z" })).toEqual({
      objective: "festive",
      mealKind: "aucun",
      mealAt: null,
    });
  });

  it("requires a time for a meal", () => {
    expect(errorsOf(participationSchema.safeParse({ objective: "festive", mealKind: "repas", mealAt: "" })).mealAt).toBe(
      "Indique l'heure du repas.",
    );
  });

  it("requires an objective", () => {
    expect(errorsOf(participationSchema.safeParse({ objective: "", mealKind: "aucun", mealAt: "" })).objective).toBe("Choisis ton objectif.");
  });
});
