// Trophies (lot 9, E13). Never a reward for a quantity of alcohol (charte §9); wording follows charte §4.
import type { Database } from "@/lib/supabase/database.types";

export type TrophyKind = Database["public"]["Enums"]["trophy_kind"];

export const TROPHY_COPY: Record<TrophyKind, { title: string; body: string }> = {
  capitaine: {
    title: "Capitaine de soirée",
    body: "La jauge la plus calme du groupe ce soir.",
  },
  joker_eau: {
    title: "As du joker eau",
    body: "Au moins un verre d'eau pour deux verres d'alcool.",
  },
  atterrissage: {
    title: "Atterrissage parfait",
    body: "La jauge est restée dans l'objectif du début à la fin.",
  },
};

export const TROPHY_ORDER: readonly TrophyKind[] = ["atterrissage", "joker_eau", "capitaine"];
