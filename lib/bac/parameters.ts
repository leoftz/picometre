// Every numeric constant of the BAC engine, each pointing to its line in
// docs/parametres-scientifiques.md (the traceable link to docs/synthese-alcoolemie.pdf).
// lib/bac/__tests__/parameters.test.ts checks that every `ref` below exists in that file.

import type { FoodState, Habit } from "./types";

/** docs/parametres-scientifiques.md#P-01 — ethanol density (g/mL). */
export const ETHANOL_DENSITY_G_PER_ML = 0.789;

/** docs/parametres-scientifiques.md#P-02 — French standard drink (g of pure ethanol). */
export const STANDARD_DRINK_G = 10;

/** docs/parametres-scientifiques.md#P-05 — Watson total body water, men (L; age in years, height cm, weight kg). */
export const WATSON_MALE = { intercept: 2.447, age: -0.09516, height: 0.1074, weight: 0.3362 } as const;

/** docs/parametres-scientifiques.md#P-06 — Watson total body water, women (no age term). */
export const WATSON_FEMALE = { intercept: -2.097, height: 0.1069, weight: 0.2466 } as const;

/** docs/parametres-scientifiques.md#P-07 — r = TBW / (BLOOD_WATER_FRACTION × weight). */
export const BLOOD_WATER_FRACTION = 0.8;

/**
 * Bioavailability F by food state, as a uniform range sampled by Monte Carlo, capped at 1.
 * docs/parametres-scientifiques.md#P-10 (jeun 1.0), #P-11 (collation 0.95), #P-12 (repas 0.65–0.75),
 * #P-13 (±0.05 spread around jeun and collation — hors PDF).
 */
export const BIOAVAILABILITY: Record<FoodState, { nominal: number; min: number; max: number }> = {
  jeun: { nominal: 1.0, min: 0.95, max: 1.05 },
  collation: { nominal: 0.95, min: 0.9, max: 1.0 },
  repas: { nominal: 0.7, min: 0.65, max: 0.75 },
};

/**
 * First-order absorption rate constant ka (h⁻¹) by food state — hors PDF, calibrated on the p. 6 figure.
 * docs/parametres-scientifiques.md#P-16 (jeun), #P-17 (collation), #P-18 (repas).
 */
export const ABSORPTION_KA_PER_H: Record<FoodState, number> = { jeun: 6, collation: 4, repas: 2 };

/** docs/parametres-scientifiques.md#P-19 — log-normal variability of ka (CV) — hors PDF. */
export const ABSORPTION_KA_CV = 0.3;

/**
 * Meal effect window around the declared meal time (minutes) — hors PDF.
 * docs/parametres-scientifiques.md#P-20
 */
export const MEAL_WINDOW_MIN: Record<Exclude<FoodState, "jeun">, { before: number; after: number }> = {
  repas: { before: 30, after: 180 },
  collation: { before: 30, after: 90 },
};

/**
 * Central elimination rate β (g/L/h) by drinking habit.
 * docs/parametres-scientifiques.md#P-21 (occasionnel 0.12–0.15 → 0.135), #P-22 (régulier 0.15–0.18 → 0.165),
 * #P-23 (fréquent: deliberately uses the régulier value instead of the PDF's 0.18–0.25, see charte §9).
 */
export const BETA_BY_HABIT: Record<Habit, number> = { occasionnel: 0.135, regulier: 0.165, frequent: 0.165 };

/** docs/parametres-scientifiques.md#P-24 — β increase for women (g/L/h). Not applied to sex "autre" (P-08, prudence). */
export const BETA_FEMALE_INCREASE = 0.02;

/** docs/parametres-scientifiques.md#P-25 — β variability (CV) and truncation bounds (g/L/h, bounds hors PDF). */
export const BETA_CV = 0.22;
export const BETA_BOUNDS = { min: 0.08, max: 0.35 } as const;

/** docs/parametres-scientifiques.md#P-27 — saturation threshold Cs (g/L): zero order above (#P-26), proportional below (#P-28). */
export const SATURATION_G_PER_L = 0.2;

/** docs/parametres-scientifiques.md#P-30 — time step of the curve. */
export const STEP_MIN = 5;

/** docs/parametres-scientifiques.md#P-31 — r variability (CV). */
export const R_CV = 0.09;

/** docs/parametres-scientifiques.md#P-32 — correlation between r and β. */
export const R_BETA_CORRELATION = -0.135;

/**
 * Variability of the ethanol mass of one drink (CV) on volume and on ABV.
 * docs/parametres-scientifiques.md#P-33 (5 %, upper bound of the PDF's 3–5 %) and the « à l'œil » pour of §1.1 (15 %, hors PDF).
 */
export const DRINK_VOLUME_CV = { dose: 0.05, oeil: 0.15 } as const;
export const DRINK_ABV_CV = 0.05;

/** docs/parametres-scientifiques.md#P-34 — declared (not measured) body weight variability (CV) — hors PDF. */
export const WEIGHT_CV = 0.05;

/** docs/parametres-scientifiques.md#P-35 — restituted percentiles. */
export const PERCENTILES = { low: 0.05, median: 0.5, high: 0.95 } as const;

/**
 * docs/parametres-scientifiques.md#P-39 — percentile used for the displayed gauge level and the Stop (hors PDF):
 * slightly above the median, because the median falls faster than the PDF figure on the way down.
 */
export const GAUGE_PERCENTILE = 0.75;

/** docs/parametres-scientifiques.md#P-36 — Monte Carlo draws (choix technique). */
export const MONTE_CARLO_DRAWS = 1000;

/** docs/parametres-scientifiques.md#P-37 — BAC landmarks reported on the way down (g/L). Never presented as driving limits (N-6). */
export const LANDMARKS_G_PER_L = { haut: 0.5, bas: 0.2 } as const;

/** docs/parametres-scientifiques.md#P-38 — « back to zero » threshold (g/L) — hors PDF. */
export const ZERO_G_PER_L = 0.01;

/** Simulated horizon after the last drink (h): long enough for the slowest draw (β = 0.08) to reach zero from ~2 g/L. */
export const HORIZON_AFTER_LAST_DRINK_H = 26;
