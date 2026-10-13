"use client";

import { useActionState } from "react";
import { Avatar } from "@/components/avatar";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { AVATARS, AVATAR_STYLES } from "@/lib/account/avatars";
import { type FormState, createCharacter } from "../actions";

const initial: FormState = { errors: {} };

const SEXES = [
  { value: "f", label: "Femme" },
  { value: "m", label: "Homme" },
  { value: "autre", label: "Autre ou je préfère ne pas dire" },
] as const;

const HABITS = [
  { value: "occasionnel", label: "Occasionnel", hint: "Quelques fois par mois au plus" },
  { value: "regulier", label: "Régulier", hint: "Chaque semaine" },
  { value: "frequent", label: "Fréquent", hint: "Plusieurs fois par semaine" },
] as const;

export function CharacterForm() {
  const [state, formAction, pending] = useActionState(createCharacter, initial);
  const { errors, values = {} } = state;
  const invalid = (name: string) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      <Field label="Ton pseudo" htmlFor="pseudo" hint="Visible par tes amis. 3 à 20 caractères." error={errors.pseudo}>
        <input id="pseudo" name="pseudo" autoComplete="nickname" defaultValue={values.pseudo} className={inputClass} {...invalid("pseudo")} />
      </Field>

      <fieldset className="flex flex-col gap-3" {...invalid("avatar")}>
        <legend className="mb-2 font-semibold">Ton avatar</legend>
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((id) => (
            <label key={id} className="flex cursor-pointer flex-col items-center gap-1 rounded-bouton p-2 has-checked:bg-white/10 has-checked:outline-2 has-checked:outline-citron has-focus-visible:outline-3 has-focus-visible:outline-corail">
              <input type="radio" name="avatar" value={id} defaultChecked={values.avatar === id} className="sr-only" />
              <Avatar id={id} size={56} />
              <span className="text-xs">{AVATAR_STYLES[id].label}</span>
            </label>
          ))}
        </div>
        {errors.avatar ? <p id="avatar-error" role="alert" className="text-sm font-semibold text-corail">{errors.avatar}</p> : null}
      </fieldset>

      <Field
        label="Ta date de naissance"
        htmlFor="birthDate"
        hint="Elle sert à vérifier que tu as 18 ans. On ne garde que l'année."
        error={errors.birthDate}
      >
        <input id="birthDate" name="birthDate" type="date" autoComplete="bday" className={inputClass} {...invalid("birthDate")} />
      </Field>

      <fieldset className="flex flex-col gap-3" {...invalid("sex")}>
        <legend className="mb-1 font-semibold">Ton sexe</legend>
        <p className="text-sm text-on-surface-muted">À poids égal, le corps ne dilue pas l&apos;alcool de la même façon.</p>
        {SEXES.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-3 rounded-bouton bg-white/5 px-4 py-3 has-checked:outline-2 has-checked:outline-citron">
            <input type="radio" name="sex" value={value} defaultChecked={values.sex === value} className="size-5 accent-corail" />
            {label}
          </label>
        ))}
        {errors.sex ? <p id="sex-error" role="alert" className="text-sm font-semibold text-corail">{errors.sex}</p> : null}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Taille (cm)" htmlFor="heightCm" error={errors.heightCm}>
          <input id="heightCm" name="heightCm" type="number" inputMode="numeric" min={130} max={230} defaultValue={values.heightCm} className={inputClass} {...invalid("heightCm")} />
        </Field>
        <Field label="Poids (kg)" htmlFor="weightKg" error={errors.weightKg}>
          <input id="weightKg" name="weightKg" type="number" inputMode="decimal" step="0.1" min={35} max={250} defaultValue={values.weightKg} className={inputClass} {...invalid("weightKg")} />
        </Field>
      </div>
      <p className="-mt-4 text-sm text-on-surface-muted">Ton poids réel rend l&apos;estimation plus juste. Il reste privé.</p>

      <fieldset className="flex flex-col gap-3" {...invalid("habit")}>
        <legend className="mb-1 font-semibold">Tes habitudes</legend>
        {HABITS.map(({ value, label, hint }) => (
          <label key={value} className="flex items-center gap-3 rounded-bouton bg-white/5 px-4 py-3 has-checked:outline-2 has-checked:outline-citron">
            <input type="radio" name="habit" value={value} defaultChecked={values.habit === value} className="size-5 accent-corail" />
            <span>
              <span className="font-semibold">{label}</span>
              <span className="block text-sm text-on-surface-muted">{hint}</span>
            </span>
          </label>
        ))}
        {errors.habit ? <p id="habit-error" role="alert" className="text-sm font-semibold text-corail">{errors.habit}</p> : null}
      </fieldset>

      {errors.form ? <p role="alert" className="font-semibold text-corail">{errors.form}</p> : null}

      <button type="submit" className={buttonClass("primary")} disabled={pending}>
        {pending ? "Création…" : "Créer mon personnage"}
      </button>
    </form>
  );
}
