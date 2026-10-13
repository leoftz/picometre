import { z } from "zod";
import { AVATARS } from "./avatars";

export const ADULT_AGE = 18;

/**
 * True if someone born on `birthDate` (YYYY-MM-DD) is at least 18 on `today`.
 * The full date is only used for this check: only the year is stored (data minimisation).
 */
export function isAdult(birthDate: string, today: Date): boolean {
  const [year, month, day] = birthDate.split("-").map(Number) as [number, number, number];
  const age = today.getFullYear() - year - (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day) ? 1 : 0);
  return age >= ADULT_AGE;
}

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({ error: "Cette adresse e-mail ne semble pas valide." })),
});

export const pseudoSchema = z
  .string()
  .trim()
  .min(3, { error: "Ton pseudo doit faire au moins 3 caractères." })
  .max(20, { error: "Ton pseudo doit faire 20 caractères maximum." })
  .regex(/^[A-Za-z0-9_.-]+$/, { error: "Lettres sans accent, chiffres, point, tiret ou tiret bas uniquement." });

export function characterSchema(today: Date) {
  return z.object({
    pseudo: pseudoSchema,
    avatar: z.enum(AVATARS, { error: "Choisis un avatar." }),
    birthDate: z
      .iso.date({ error: "Indique ta date de naissance." })
      .refine((date) => Number(date.slice(0, 4)) >= 1900, { error: "Cette date de naissance ne semble pas valide." })
      .refine((date) => isAdult(date, today), { error: "Picomètre est réservé aux 18 ans et plus." }),
    sex: z.enum(["f", "m", "autre"], { error: "Indique ton sexe pour le calcul." }),
    heightCm: z.coerce
      .number({ error: "Indique ta taille en centimètres." })
      .int({ error: "Indique ta taille en centimètres, sans virgule." })
      .min(130, { error: "La taille doit être comprise entre 130 et 230 cm." })
      .max(230, { error: "La taille doit être comprise entre 130 et 230 cm." }),
    weightKg: z.coerce
      .number({ error: "Indique ton poids en kilos." })
      .min(35, { error: "Le poids doit être compris entre 35 et 250 kg." })
      .max(250, { error: "Le poids doit être compris entre 35 et 250 kg." })
      .transform((kg) => Math.round(kg * 10) / 10),
    habit: z.enum(["occasionnel", "regulier", "frequent"], { error: "Indique tes habitudes de consommation." }),
  });
}

export type CharacterInput = z.infer<ReturnType<typeof characterSchema>>;

/** First error message per field, for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}
