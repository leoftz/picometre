import { z } from "zod";
import { drinkType, glassSize } from "@/lib/bank/catalog";
import { formatAbv } from "./format";

const isoDateTime = (message: string) => z.iso.datetime({ offset: true, error: message });

export const partySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Donne un nom à ta soirée." })
    .max(60, { error: "60 caractères maximum." }),
  startsAt: isoDateTime("Indique la date et l'heure."),
  location: z
    .string()
    .trim()
    .max(80, { error: "80 caractères maximum." })
    .transform((value) => value || null),
});

/** A drink of the bank, with an ABV inside its type's range and a glass offered for that type (P-60 to P-93). */
export const plannedDrinkSchema = z
  .object({
    drinkType: z.string().min(1, { error: "Choisis une boisson." }),
    abv: z.coerce.number({ error: "Indique le degré." }),
    glass: z.string().min(1, { error: "Choisis un verre." }),
    pour: z.enum(["dose", "oeil"]),
  })
  .superRefine((value, ctx) => {
    const type = drinkType(value.drinkType);
    if (!type || type.glasses.length === 0) {
      ctx.addIssue({ code: "custom", path: ["drinkType"], message: "Choisis une boisson de la liste." });
      return;
    }
    if (value.abv < type.abvMin || value.abv > type.abvMax) {
      ctx.addIssue({
        code: "custom",
        path: ["abv"],
        message: `Pour ce type, le degré va de ${formatAbv(type.abvMin)} à ${formatAbv(type.abvMax)}.`,
      });
    }
    if (!type.glasses.includes(value.glass) || !glassSize(value.glass)) {
      ctx.addIssue({ code: "custom", path: ["glass"], message: "Choisis un verre proposé pour cette boisson." });
    }
  });

export const ingredientSchema = z
  .object({
    drinkType: z.string(),
    volumeMl: z.coerce.number().positive({ error: "Indique une quantité." }).max(500, { error: "500 mL maximum." }),
    abv: z.coerce.number(),
  })
  .superRefine((value, ctx) => {
    const type = drinkType(value.drinkType);
    if (!type || type.abvMax === 0) {
      ctx.addIssue({ code: "custom", path: ["drinkType"], message: "Choisis un alcool de la liste." });
    } else if (value.abv < type.abvMin || value.abv > type.abvMax) {
      ctx.addIssue({ code: "custom", path: ["abv"], message: `Le degré va de ${formatAbv(type.abvMin)} à ${formatAbv(type.abvMax)}.` });
    }
  });

export const cocktailSchema = z.object({
  name: z.string().trim().min(1, { error: "Donne un nom au cocktail." }).max(30, { error: "30 caractères maximum." }),
  pour: z.enum(["dose", "oeil"]),
  ingredients: z.array(ingredientSchema).min(1, { error: "Ajoute au moins un alcool." }).max(8),
});

export const participationSchema = z
  .object({
    objective: z.enum(["desinhibe", "zero_gdb", "festive"], { error: "Choisis ton objectif." }),
    mealKind: z.enum(["aucun", "collation", "repas"], { error: "Dis-nous si tu as mangé." }),
    mealAt: z.union([isoDateTime("Indique l'heure du repas."), z.literal("")]),
  })
  .superRefine((value, ctx) => {
    if (value.mealKind !== "aucun" && !value.mealAt) {
      ctx.addIssue({ code: "custom", path: ["mealAt"], message: "Indique l'heure du repas." });
    }
  })
  .transform((value) => ({
    objective: value.objective,
    mealKind: value.mealKind,
    mealAt: value.mealKind === "aucun" ? null : value.mealAt,
  }));
