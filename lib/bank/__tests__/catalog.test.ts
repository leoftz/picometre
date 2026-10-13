// Traceability of the drink bank: lib/bank/catalog.ts must match docs/parametres-scientifiques.md §1.1
// row by row, and the migration must contain exactly the SQL generated from the catalog.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ethanolGrams } from "@/lib/bac";
import { CUSTOM_GLASS_ML, DRINK_TYPES, GLASS_SIZES, glassSize } from "../catalog";
import { bankSeedSql } from "../sql";

const doc = readFileSync("docs/parametres-scientifiques.md", "utf8");
const row = (ref: string) => doc.split("\n").find((line) => line.includes(`<a id="${ref}"></a>`))?.split("|").map((c) => c.trim());
/** First number of a doc cell, French decimal comma allowed: « 2 cl (servie allongée d'eau) » → 2. */
const num = (text: string) => Number(text.match(/\d+(?:,\d+)?/)![0].replace(",", "."));

describe.each(DRINK_TYPES)("$ref $label", (type) => {
  const cells = row(type.ref);

  it("exists in the doc", () => {
    expect(cells).toBeDefined();
  });

  it("has the doc's default ABV and range", () => {
    const [, , , abv, range] = cells!;
    expect(type.abvDefault).toBe(num(abv!));
    if (type.abvMax > 0) {
      const [min, max] = range!.replace(/\(.*\)/g, "").split("–").map(num);
      expect([type.abvMin, type.abvMax]).toEqual([min, max]);
    }
    expect(type.abvMin).toBeLessThanOrEqual(type.abvDefault);
    expect(type.abvDefault).toBeLessThanOrEqual(type.abvMax);
  });

  it("only offers glasses of the bank", () => {
    for (const slug of type.glasses) expect(glassSize(slug), slug).toBeDefined();
  });
});

describe.each(GLASS_SIZES)("$ref $label", (glass) => {
  it("has the doc's volume", () => {
    const cells = row(glass.ref);
    expect(cells).toBeDefined();
    expect(glass.volumeMl).toBe(num(cells![3]!) * 10);
  });
});

describe("worked examples of §1.1", () => {
  it.each([
    ["pinte", 5, 19.7],
    ["33cl", 8.5, 22.1],
    ["vin", 13, 12.3],
    ["shot", 40, 9.5],
    ["grand-aperitif", 16, 10.1],
  ])("%s at %f %% → %f g", (slug, abv, grams) => {
    expect(ethanolGrams(glassSize(slug)!.volumeMl, abv)).toBeCloseTo(grams, 1);
  });

  it("custom glasses span 1 to 100 cl (P-91)", () => {
    expect(CUSTOM_GLASS_ML).toEqual({ min: 10, max: 1000 });
  });
});

it("the migration contains exactly the SQL generated from the catalog (npm run bank:sql)", () => {
  const file = readdirSync("supabase/migrations").find((f) => f.endsWith("_drink_bank_and_parties.sql"))!;
  expect(readFileSync(`supabase/migrations/${file}`, "utf8")).toContain(bankSeedSql());
});
