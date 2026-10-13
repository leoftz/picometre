// The drink and glass bank — docs/parametres-scientifiques.md §1.1 (P-60 to P-93).
// Single source of truth: the SQL seed (supabase/migrations/*_drink_bank.sql) is generated from this file
// by `npm run bank:sql`, and lib/bank/__tests__/catalog.test.ts checks both against the doc.
// Generic types only, never a brand (loi Évin, charte §9.8).

export type DrinkFamily = "biere" | "cidre" | "vin" | "aperitif" | "spiritueux" | "liqueur" | "sans_alcool";

export interface GlassSize {
  slug: string;
  label: string;
  volumeMl: number;
  ref: string;
}

export interface DrinkType {
  slug: string;
  label: string;
  family: DrinkFamily;
  abvDefault: number;
  abvMin: number;
  abvMax: number;
  /** Glasses offered for this type; the first one is the default (★ in the doc). Empty = cocktail ingredient only. */
  glasses: string[];
  ref: string;
}

export const FAMILY_LABELS: Record<DrinkFamily, string> = {
  biere: "Bières",
  cidre: "Cidres et prémix",
  vin: "Vins",
  aperitif: "Apéritifs",
  spiritueux: "Spiritueux",
  liqueur: "Liqueurs",
  sans_alcool: "Sans alcool",
};

export const GLASS_SIZES: readonly GlassSize[] = [
  { slug: "shot", label: "Shot (3 cl)", volumeMl: 30, ref: "P-80" },
  { slug: "dose", label: "Dose (4 cl)", volumeMl: 40, ref: "P-81" },
  { slug: "double", label: "Double (5 cl)", volumeMl: 50, ref: "P-82" },
  { slug: "dose-pastis", label: "Dose de pastis (2 cl)", volumeMl: 20, ref: "P-83" },
  { slug: "aperitif", label: "Verre à apéritif (6 cl)", volumeMl: 60, ref: "P-84" },
  { slug: "flute", label: "Flûte (10 cl)", volumeMl: 100, ref: "P-85" },
  { slug: "vin", label: "Verre à vin (12 cl)", volumeMl: 120, ref: "P-86" },
  { slug: "grand-vin", label: "Grand verre à vin (15 cl)", volumeMl: 150, ref: "P-87" },
  { slug: "demi", label: "Demi ou bolée (25 cl)", volumeMl: 250, ref: "P-88" },
  { slug: "33cl", label: "Bouteille ou canette (33 cl)", volumeMl: 330, ref: "P-89" },
  { slug: "pinte", label: "Pinte (50 cl)", volumeMl: 500, ref: "P-90" },
  { slug: "grand-aperitif", label: "Grand verre à apéritif (8 cl)", volumeMl: 80, ref: "P-92" },
  { slug: "verre", label: "Verre (25 cl)", volumeMl: 250, ref: "P-93" },
];

/** Bounds of a custom glass (P-91), in mL. */
export const CUSTOM_GLASS_ML = { min: 10, max: 1000 } as const;

const BEER_GLASSES_DEMI = ["demi", "33cl", "pinte"];
const BEER_GLASSES_33 = ["33cl", "demi", "pinte"];
const WINE_GLASSES = ["vin", "grand-vin"];

export const DRINK_TYPES: readonly DrinkType[] = [
  { slug: "biere-blonde", label: "Bière blonde", family: "biere", abvDefault: 5, abvMin: 4, abvMax: 5.5, glasses: BEER_GLASSES_DEMI, ref: "P-60" },
  { slug: "biere-blanche", label: "Bière blanche", family: "biere", abvDefault: 5, abvMin: 4.5, abvMax: 5.5, glasses: BEER_GLASSES_DEMI, ref: "P-61" },
  { slug: "biere-ipa", label: "Bière IPA", family: "biere", abvDefault: 6.5, abvMin: 5.5, abvMax: 7.5, glasses: BEER_GLASSES_33, ref: "P-62" },
  { slug: "biere-ambree", label: "Bière ambrée ou brune", family: "biere", abvDefault: 6.5, abvMin: 5, abvMax: 8, glasses: BEER_GLASSES_33, ref: "P-63" },
  { slug: "biere-forte", label: "Bière forte ou triple", family: "biere", abvDefault: 8.5, abvMin: 7.5, abvMax: 10, glasses: ["33cl", "demi"], ref: "P-64" },
  { slug: "biere-sans-alcool", label: "Bière sans alcool", family: "sans_alcool", abvDefault: 0.5, abvMin: 0, abvMax: 1.2, glasses: BEER_GLASSES_33, ref: "P-65" },
  { slug: "cidre", label: "Cidre", family: "cidre", abvDefault: 5, abvMin: 2, abvMax: 6, glasses: ["demi", "33cl"], ref: "P-66" },
  { slug: "hard-seltzer", label: "Hard seltzer ou prémix", family: "cidre", abvDefault: 4.5, abvMin: 4, abvMax: 7, glasses: ["33cl"], ref: "P-67" },
  { slug: "vin-rouge", label: "Vin rouge", family: "vin", abvDefault: 13, abvMin: 12, abvMax: 14.5, glasses: WINE_GLASSES, ref: "P-68" },
  { slug: "vin-blanc", label: "Vin blanc", family: "vin", abvDefault: 12, abvMin: 11, abvMax: 13.5, glasses: WINE_GLASSES, ref: "P-69" },
  { slug: "vin-rose", label: "Vin rosé", family: "vin", abvDefault: 12.5, abvMin: 11, abvMax: 13.5, glasses: WINE_GLASSES, ref: "P-70" },
  { slug: "effervescent", label: "Effervescent (champagne, crémant…)", family: "vin", abvDefault: 12, abvMin: 11, abvMax: 12.5, glasses: ["flute"], ref: "P-71" },
  { slug: "vin-doux", label: "Vin doux ou porto", family: "aperitif", abvDefault: 19, abvMin: 15, abvMax: 22, glasses: ["aperitif"], ref: "P-72" },
  { slug: "vermouth", label: "Apéritif ou vermouth", family: "aperitif", abvDefault: 16, abvMin: 14, abvMax: 18, glasses: ["aperitif", "grand-aperitif"], ref: "P-73" },
  { slug: "bitter-leger", label: "Bitter apéritif léger", family: "aperitif", abvDefault: 11, abvMin: 8, abvMax: 15, glasses: [], ref: "P-79" },
  { slug: "pastis", label: "Pastis ou anisé", family: "aperitif", abvDefault: 45, abvMin: 40, abvMax: 45, glasses: ["dose-pastis"], ref: "P-75" },
  { slug: "spiritueux", label: "Spiritueux (vodka, gin, rhum, whisky…)", family: "spiritueux", abvDefault: 40, abvMin: 37.5, abvMax: 50, glasses: ["dose", "shot", "double"], ref: "P-74" },
  { slug: "liqueur", label: "Liqueur", family: "liqueur", abvDefault: 25, abvMin: 15, abvMax: 35, glasses: ["shot"], ref: "P-76" },
  { slug: "soft", label: "Soft", family: "sans_alcool", abvDefault: 0, abvMin: 0, abvMax: 0, glasses: ["verre"], ref: "P-78" },
  { slug: "eau", label: "Eau", family: "sans_alcool", abvDefault: 0, abvMin: 0, abvMax: 0, glasses: ["verre"], ref: "P-78" },
];

export const drinkType = (slug: string) => DRINK_TYPES.find((t) => t.slug === slug);
export const glassSize = (slug: string) => GLASS_SIZES.find((g) => g.slug === slug);
