import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { colors, contrastRatio, gaugeLevels, textPairs } from "../tokens";

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("charte §5 — WCAG AA", () => {
  it.each(textPairs)("$name reaches AA", ({ fg, bg, large }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(large ? 3 : 4.5);
  });
});

describe("charte §5 — gauge levels", () => {
  it("keeps the non-negotiable colours and labels", () => {
    expect(gaugeLevels).toMatchObject({
      1: { color: "#3DDC97", label: "Frais comme un gardon" },
      2: { color: "#FFD23F", label: "Ça pétille" },
      3: { color: "#FF9F1C", label: "La jauge chauffe" },
      4: { color: "#E63946", label: "Pause obligatoire" },
    });
  });

  it("gives every level an icon, so colour is never the only signal", () => {
    for (const level of Object.values(gaugeLevels)) expect(level.icon).not.toBe("");
  });
});

describe("app/globals.css", () => {
  const css = readFileSync("app/globals.css", "utf8");

  it.each(Object.entries(colors))("declares --color-%s as in tokens.ts", (name, hex) => {
    expect(css).toContain(`--color-${name}: ${hex};`);
  });

  it.each(Object.entries(gaugeLevels))("declares --color-jauge-%s as in tokens.ts", (level, { color }) => {
    expect(css).toContain(`--color-jauge-${level}: ${color};`);
  });
});
