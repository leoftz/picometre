// Generates the PWA / favicon assets from the brand icon (docs/brand/picometre-icone.svg).
// Run with `npm run icons` after any change to the brand icon, then commit the outputs.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = await readFile("docs/brand/picometre-icone.svg", "utf8");
// The C2PA provenance manifest is not needed in served assets.
const svg = source.replace(/<metadata>[\s\S]*?<\/metadata>/, "");

// Maskable variant: full-bleed background, artwork scaled into the 80 % safe zone.
const inner = svg.match(/<g [\s\S]*<\/g>/)?.[0];
if (!inner) throw new Error("Unexpected icon structure: <g> group not found");
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#1B1F3B"/><g transform="translate(51.2,51.2) scale(0.8)">${inner}</g></svg>`;

const outputs = [
  { file: "public/icons/icon-192.png", svg, size: 192 },
  { file: "public/icons/icon-512.png", svg, size: 512 },
  { file: "public/icons/maskable-512.png", svg: maskable, size: 512 },
  { file: "app/apple-icon.png", svg: maskable, size: 180 },
];

for (const { file, svg: input, size } of outputs) {
  await sharp(Buffer.from(input), { density: 300 }).resize(size, size).png().toFile(file);
  console.log(`✓ ${file}`);
}

await writeFile("app/icon.svg", svg);
console.log("✓ app/icon.svg");
