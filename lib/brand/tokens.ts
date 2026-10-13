// Design tokens from docs/charte-picometre.md. Mirrored as CSS variables in app/globals.css —
// keep both in sync (lib/brand/__tests__/tokens.test.ts checks the CSS against this file).

/** Palette — charte §5 « Palette principale » and « Couleurs par type de carte ». */
export const colors = {
  nuit: "#1B1F3B",
  corail: "#FF5A5F",
  citron: "#FFD23F",
  menthe: "#3DDC97",
  creme: "#FFF8F0",
  ardoise: "#4A4E69",
  violet: "#7B5CFF",
  /**
   * Secondary text on dark backgrounds: crème at 70 % over nuit.
   * Not in the charte: Ardoise on Nuit is only 1.98:1, below WCAG AA (charte §5 requires AA).
   */
  brume: "#BBB7BA",
} as const;

export type GaugeLevel = 1 | 2 | 3 | 4;

/**
 * Gauge levels — charte §5 « Couleurs de la jauge » (non négociables).
 * Thresholds live in the BAC engine config (docs/parametres-scientifiques.md#P-40 to #P-43).
 * Never convey a level by colour alone: always render `label` and `icon` too.
 */
export const gaugeLevels: Record<GaugeLevel, { name: string; label: string; color: string; icon: string }> = {
  1: { name: "Frais", label: "Frais comme un gardon", color: "#3DDC97", icon: "goutte" },
  2: { name: "Pétillant", label: "Ça pétille", color: "#FFD23F", icon: "bulles" },
  3: { name: "Ça chauffe", label: "La jauge chauffe", color: "#FF9F1C", icon: "flamme" },
  4: { name: "Stop", label: "Pause obligatoire", color: "#E63946", icon: "main" },
};

/** WCAG 2.x relative luminance of a #RRGGBB colour. */
export function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two #RRGGBB colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text/background pairs the UI is allowed to use. `large` = WCAG large text
 * (≥ 24 px, or ≥ 18.66 px bold), which only needs 3:1 instead of 4.5:1.
 */
export const textPairs = [
  { name: "texte principal (sombre)", fg: colors.creme, bg: colors.nuit, large: false },
  { name: "texte secondaire (sombre)", fg: colors.brume, bg: colors.nuit, large: false },
  { name: "texte principal (clair)", fg: colors.nuit, bg: colors.creme, large: false },
  { name: "texte secondaire (clair)", fg: colors.ardoise, bg: colors.creme, large: false },
  // Charte §7 says crème on corail (2.90:1, fails AA): primary buttons use nuit text instead.
  { name: "bouton primaire", fg: colors.nuit, bg: colors.corail, large: false },
  { name: "bouton joker eau", fg: colors.nuit, bg: colors.menthe, large: false },
  { name: "jauge 1", fg: colors.nuit, bg: gaugeLevels[1].color, large: false },
  { name: "jauge 2", fg: colors.nuit, bg: gaugeLevels[2].color, large: false },
  { name: "jauge 3", fg: colors.nuit, bg: gaugeLevels[3].color, large: false },
  // Level 4 red reaches 3.86:1 at best: text on it must be large; small labels go on nuit/crème.
  { name: "jauge 4 (grand texte)", fg: colors.nuit, bg: gaugeLevels[4].color, large: true },
] as const;
