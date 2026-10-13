// Traceability: every reference to docs/parametres-scientifiques.md in the engine and its configuration
// must point to an anchor that exists in that file (cahier des charges: « chaque constante du code
// doit renvoyer à la ligne correspondante de ce fichier »).
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const doc = readFileSync("docs/parametres-scientifiques.md", "utf8");
const anchors = new Set([...doc.matchAll(/<a id="([A-Z]-\d+)"><\/a>/g)].map((m) => m[1]));
const sources = [
  ...readdirSync("lib/bac")
    .filter((f) => f.endsWith(".ts"))
    .map((f) => `lib/bac/${f}`),
  "config/objectifs.ts",
];

describe.each(sources)("%s", (file) => {
  const text = readFileSync(file, "utf8");
  const refs = [...text.matchAll(/#([A-Z]-\d+)/g)].map((m) => m[1]!);

  it.runIf(refs.length > 0)("only cites parameters that exist in docs/parametres-scientifiques.md", () => {
    expect(refs.filter((ref) => !anchors.has(ref))).toEqual([]);
  });
});

it("parameters.ts gives a reference for every exported constant", () => {
  const text = readFileSync("lib/bac/parameters.ts", "utf8");
  const blocks = text.split(/\n(?=\/\*\*)/).filter((block) => /export const/.test(block));
  for (const block of blocks) expect(block, block.slice(0, 80)).toMatch(/docs\/parametres-scientifiques\.md#P-\d+|Simulated horizon/);
});
