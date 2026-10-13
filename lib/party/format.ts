// French formatting helpers. Parties are shown in Paris time, whatever the server's time zone.

import { TIME_ZONE } from "./time";

export function formatPartyDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatTime(iso: string | number): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE }).format(new Date(iso));
}

export function formatAbv(abv: number): string {
  return `${abv.toLocaleString("fr-FR")} %`;
}

export function formatGrams(grams: number): string {
  return `${grams.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g`;
}

/** « ≈ 1,6 verre standard » — informative, never as a goal (charte §9). */
export function formatStandardDrinks(grams: number): string {
  const count = Math.round((grams / 10) * 10) / 10;
  return `≈ ${count.toLocaleString("fr-FR")} verre${count >= 2 ? "s" : ""} standard`;
}

export const OBJECTIVE_COPY = {
  desinhibe: { label: "Juste désinhibé", hint: "Rester dans le « Ça pétille », même en fourchette haute." },
  zero_gdb: { label: "Zéro gueule de bois", hint: "Deux verres standard maximum, et une jauge basse." },
  festive: { label: "Soirée festive", hint: "Plus de marge, mais le même plafond de sécurité." },
} as const;

export const MEALS = {
  aucun: "Rien mangé",
  collation: "Une collation",
  repas: "Un vrai repas",
} as const;
