import {
  BETA_BY_HABIT,
  BETA_FEMALE_INCREASE,
  BLOOD_WATER_FRACTION,
  MEAL_WINDOW_MIN,
  SATURATION_G_PER_L,
  WATSON_FEMALE,
  WATSON_MALE,
} from "./parameters";
import type { FoodState, Meal, Profile } from "./types";

/**
 * Total body water (L), Watson 1981. Sex « autre » uses the female formula, which gives the higher
 * (more cautious) estimate — docs/parametres-scientifiques.md#P-05, #P-06, #P-08.
 */
export function totalBodyWater({ sex, ageYears, heightCm, weightKg }: Profile): number {
  if (sex === "m") {
    return WATSON_MALE.intercept + WATSON_MALE.age * ageYears + WATSON_MALE.height * heightCm + WATSON_MALE.weight * weightKg;
  }
  return WATSON_FEMALE.intercept + WATSON_FEMALE.height * heightCm + WATSON_FEMALE.weight * weightKg;
}

/** Widmark factor r = TBW / (0.8 × weight) — docs/parametres-scientifiques.md#P-07. */
export function widmarkR(profile: Profile): number {
  return totalBodyWater(profile) / (BLOOD_WATER_FRACTION * profile.weightKg);
}

/**
 * Central elimination rate β (g/L/h) — docs/parametres-scientifiques.md#P-21 to #P-24.
 * The female increase is not applied to sex « autre » (cautious default, P-08).
 */
export function eliminationRate({ habit, sex }: Profile): number {
  return BETA_BY_HABIT[habit] + (sex === "f" ? BETA_FEMALE_INCREASE : 0);
}

/**
 * Instantaneous elimination (g/L/h) at concentration c: zero order above Cs, proportional below.
 * docs/parametres-scientifiques.md#P-26, #P-27, #P-28.
 */
export function eliminationAt(c: number, beta: number): number {
  return c >= SATURATION_G_PER_L ? beta : (beta * c) / SATURATION_G_PER_L;
}

/**
 * Food state of a drink taken at `at`, from the declared meals — docs/parametres-scientifiques.md#P-20.
 * A full meal wins over a snack when both windows apply.
 */
export function foodStateAt(at: number, meals: readonly Meal[]): FoodState {
  const inWindow = (meal: Meal) => {
    const window = MEAL_WINDOW_MIN[meal.kind];
    return at >= meal.at - window.before * 60_000 && at <= meal.at + window.after * 60_000;
  };
  if (meals.some((m) => m.kind === "repas" && inWindow(m))) return "repas";
  if (meals.some((m) => m.kind === "collation" && inWindow(m))) return "collation";
  return "jeun";
}
