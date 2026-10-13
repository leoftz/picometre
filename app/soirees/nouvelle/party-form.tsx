"use client";

import { useActionState } from "react";
import { DateTimeField } from "@/components/datetime-field";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { type FormState, createParty } from "../actions";

const initial: FormState = { errors: {} };

export function PartyForm({ defaultStart }: { defaultStart: string }) {
  const [state, formAction, pending] = useActionState(createParty, initial);
  const { errors } = state;
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <Field label="Nom de la soirée" htmlFor="title" error={errors.title}>
        <input id="title" name="title" maxLength={60} placeholder="Anniv de Sam" className={inputClass} aria-invalid={Boolean(errors.title)} />
      </Field>
      <Field label="Date et heure" htmlFor="startsAt-input" error={errors.startsAt}>
        <DateTimeField id="startsAt-input" name="startsAt" defaultValue={defaultStart} invalid={Boolean(errors.startsAt)} />
      </Field>
      <Field label="Lieu (facultatif)" htmlFor="location" error={errors.location}>
        <input id="location" name="location" maxLength={80} className={inputClass} />
      </Field>
      {errors.form ? <p role="alert" className="font-semibold text-corail">{errors.form}</p> : null}
      <button type="submit" className={buttonClass("primary")} disabled={pending}>
        {pending ? "Création…" : "Créer la soirée"}
      </button>
    </form>
  );
}
