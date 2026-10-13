"use client";

import { useActionState, useState } from "react";
import { DateTimeField } from "@/components/datetime-field";
import { Field, buttonClass } from "@/components/ui";
import { MEALS, OBJECTIVE_COPY } from "@/lib/party/format";
import { type FormState, saveParticipation } from "../actions";

type Objective = keyof typeof OBJECTIVE_COPY;
type MealKind = keyof typeof MEALS;

export function ParticipationForm({
  partyId,
  objective,
  mealKind,
  mealAt,
  defaultMealAt,
}: {
  partyId: string;
  objective: Objective | null;
  mealKind: MealKind | null;
  mealAt: string | null;
  defaultMealAt: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveParticipation.bind(null, partyId), { errors: {} });
  const [meal, setMeal] = useState<MealKind | null>(mealKind);
  const { errors } = state;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Ton objectif</legend>
        {(Object.keys(OBJECTIVE_COPY) as Objective[]).map((key) => (
          <label key={key} className="flex items-start gap-3 rounded-carte bg-white/5 p-4 has-checked:outline-2 has-checked:outline-citron">
            <input type="radio" name="objective" value={key} defaultChecked={objective === key} className="mt-1 size-5 shrink-0 accent-corail" />
            <span>
              <span className="font-display text-lg font-bold">{OBJECTIVE_COPY[key].label}</span>
              <span className="block text-sm text-on-surface-muted">{OBJECTIVE_COPY[key].hint}</span>
            </span>
          </label>
        ))}
        {errors.objective ? <p role="alert" className="text-sm font-semibold text-corail">{errors.objective}</p> : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Tu as mangé ou tu vas manger ?</legend>
        <p className="text-sm text-on-surface-muted">Manger avant de boire divise le pic de la jauge par deux environ.</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MEALS) as MealKind[]).map((key) => (
            <label key={key} className="flex min-h-14 cursor-pointer items-center justify-center rounded-bouton bg-white/5 px-2 text-center text-sm font-semibold has-checked:bg-menthe has-checked:text-nuit has-focus-visible:outline-3 has-focus-visible:outline-corail">
              {/* Uncontrolled: React resets forms to their defaults after an action, and defaults follow the saved value. */}
              <input type="radio" name="mealKind" value={key} defaultChecked={mealKind === key} onChange={() => setMeal(key)} className="sr-only" />
              {MEALS[key]}
            </label>
          ))}
        </div>
        {errors.mealKind ? <p role="alert" className="text-sm font-semibold text-corail">{errors.mealKind}</p> : null}
        {meal && meal !== "aucun" ? (
          <Field label="À quelle heure ?" htmlFor="mealAt-input" error={errors.mealAt}>
            <DateTimeField id="mealAt-input" name="mealAt" defaultValue={mealAt ?? defaultMealAt} invalid={Boolean(errors.mealAt)} />
          </Field>
        ) : (
          <input type="hidden" name="mealAt" value="" />
        )}
      </fieldset>

      {errors.form ? <p role="alert" className="font-semibold text-corail">{errors.form}</p> : null}
      {state.ok ? <p role="status" className="font-semibold text-menthe">C&apos;est noté.</p> : null}
      <button type="submit" className={buttonClass("primary")} disabled={pending}>
        Enregistrer
      </button>
    </form>
  );
}
