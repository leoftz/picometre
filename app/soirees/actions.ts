"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrors } from "@/lib/account/schemas";
import { requireUser } from "@/lib/auth/dal";
import { cocktailSchema, participationSchema, partySchema, plannedDrinkSchema } from "@/lib/party/schemas";
import { createClient } from "@/lib/supabase/server";

export type FormState = { errors: Record<string, string>; ok?: boolean };

const SAVE_FAILED = { errors: { form: "L'enregistrement a échoué. Réessaie." } };

export async function createParty(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = partySchema.safeParse({
    title: formData.get("title"),
    startsAt: formData.get("startsAt"),
    location: formData.get("location") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const id = crypto.randomUUID();
  const supabase = await createClient();
  const { error } = await supabase
    .from("parties")
    .insert({ id, title: parsed.data.title, starts_at: parsed.data.startsAt, location: parsed.data.location });
  if (error) return SAVE_FAILED;
  redirect(`/soirees/${id}`);
}

export async function saveParticipation(partyId: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = participationSchema.safeParse({
    objective: formData.get("objective"),
    mealKind: formData.get("mealKind"),
    mealAt: formData.get("mealAt") ?? "",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("participant_private")
    .update({ objective: parsed.data.objective, meal_kind: parsed.data.mealKind, meal_at: parsed.data.mealAt })
    .eq("party_id", partyId)
    .eq("user_id", user.id);
  if (error) return SAVE_FAILED;
  revalidatePath(`/soirees/${partyId}`);
  return { errors: {}, ok: true };
}

export async function addPlannedDrink(partyId: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = plannedDrinkSchema.safeParse({
    drinkType: formData.get("drinkType"),
    abv: formData.get("abv"),
    glass: formData.get("glass"),
    pour: formData.get("pour"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("party_drinks").insert({
    party_id: partyId,
    kind: "boisson",
    drink_type: parsed.data.drinkType,
    abv: parsed.data.abv,
    default_glass: parsed.data.glass,
    pour: parsed.data.pour,
  });
  if (error) return SAVE_FAILED;
  revalidatePath(`/soirees/${partyId}`);
  return { errors: {}, ok: true };
}

export async function addCocktail(partyId: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  let ingredients: unknown;
  try {
    ingredients = JSON.parse(String(formData.get("ingredients") ?? "[]"));
  } catch {
    ingredients = [];
  }
  const parsed = cocktailSchema.safeParse({ name: formData.get("name"), pour: formData.get("pour"), ingredients });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("party_drinks")
    .insert({ id, party_id: partyId, kind: "cocktail", name: parsed.data.name, pour: parsed.data.pour });
  if (error) return SAVE_FAILED;
  const { error: ingredientsError } = await supabase.from("cocktail_ingredients").insert(
    parsed.data.ingredients.map((i) => ({ party_drink_id: id, drink_type: i.drinkType, volume_ml: i.volumeMl, abv: i.abv })),
  );
  if (ingredientsError) {
    await supabase.from("party_drinks").delete().eq("id", id);
    return SAVE_FAILED;
  }
  revalidatePath(`/soirees/${partyId}`);
  return { errors: {}, ok: true };
}

export async function removePlannedDrink(partyId: string, drinkId: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("party_drinks").delete().eq("id", drinkId).eq("party_id", partyId);
  revalidatePath(`/soirees/${partyId}`);
}

export async function deleteParty(partyId: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("parties").delete().eq("id", partyId);
  redirect("/accueil");
}
