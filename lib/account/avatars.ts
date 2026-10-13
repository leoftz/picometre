import { colors } from "@/lib/brand/tokens";

/** Preset avatars (charte §7: simple round characters, no realistic face). No photo upload: data minimisation. */
export const AVATARS = ["bulle", "citron", "menthe", "corail", "nuit", "etoile", "lune", "eclair"] as const;
export type AvatarId = (typeof AVATARS)[number];

export const AVATAR_STYLES: Record<AvatarId, { label: string; body: string; accent: string }> = {
  bulle: { label: "Bulle", body: colors.violet, accent: colors.creme },
  citron: { label: "Citron", body: colors.citron, accent: colors.nuit },
  menthe: { label: "Menthe", body: colors.menthe, accent: colors.nuit },
  corail: { label: "Corail", body: colors.corail, accent: colors.nuit },
  nuit: { label: "Nuit", body: colors.creme, accent: colors.nuit },
  etoile: { label: "Étoile", body: colors.citron, accent: colors.corail },
  lune: { label: "Lune", body: colors.brume, accent: colors.nuit },
  eclair: { label: "Éclair", body: colors.menthe, accent: colors.violet },
};
