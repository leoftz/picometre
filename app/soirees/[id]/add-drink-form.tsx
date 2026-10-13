"use client";

import { useActionState, useState } from "react";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { DRINK_TYPES, FAMILY_LABELS, type DrinkFamily, drinkType, glassSize } from "@/lib/bank/catalog";
import { ethanolGrams } from "@/lib/bac/dose";
import { formatAbv, formatStandardDrinks } from "@/lib/party/format";
import { type FormState, addPlannedDrink } from "../actions";

const SERVED = DRINK_TYPES.filter((t) => t.glasses.length > 0);
const FAMILIES = [...new Set(SERVED.map((t) => t.family))] as DrinkFamily[];

export function AddDrinkForm({ partyId }: { partyId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(addPlannedDrink.bind(null, partyId), { errors: {} });
  const [slug, setSlug] = useState(SERVED[0]!.slug);
  const type = drinkType(slug)!;
  const [abv, setAbv] = useState(String(type.abvDefault));
  const [glass, setGlass] = useState(type.glasses[0]!);
  const { errors } = state;

  const choose = (next: string) => {
    const t = drinkType(next)!;
    setSlug(next);
    setAbv(String(t.abvDefault));
    setGlass(t.glasses[0]!);
  };
  const grams = ethanolGrams(glassSize(glass)?.volumeMl ?? 0, Number(abv) || 0);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Boisson" htmlFor="drinkType" error={errors.drinkType}>
        <select id="drinkType" name="drinkType" value={slug} onChange={(e) => choose(e.target.value)} className={inputClass}>
          {FAMILIES.map((family) => (
            <optgroup key={family} label={FAMILY_LABELS[family]}>
              {SERVED.filter((t) => t.family === family).map((t) => (
                <option key={t.slug} value={t.slug}>{t.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Degré (%)" htmlFor="abv" hint={type.abvMax > 0 ? `${formatAbv(type.abvMin)} à ${formatAbv(type.abvMax)}` : undefined} error={errors.abv}>
          <input
            id="abv"
            name="abv"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={type.abvMin}
            max={type.abvMax}
            value={abv}
            onChange={(e) => setAbv(e.target.value)}
            readOnly={type.abvMax === 0}
            className={inputClass}
            aria-invalid={Boolean(errors.abv)}
          />
        </Field>
        <Field label="Verre" htmlFor="glass" error={errors.glass}>
          <select id="glass" name="glass" value={glass} onChange={(e) => setGlass(e.target.value)} className={inputClass}>
            {type.glasses.map((g) => (
              <option key={g} value={g}>{glassSize(g)!.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">Comment c&apos;est servi ?</legend>
        <label className="flex items-center gap-3">
          <input type="radio" name="pour" value="dose" defaultChecked className="size-5 accent-corail" /> Dosé (bar, doseur, canette)
        </label>
        <label className="flex items-center gap-3">
          <input type="radio" name="pour" value="oeil" className="size-5 accent-corail" /> À l&apos;œil (servi à la maison)
        </label>
      </fieldset>

      {type.abvMax > 0 ? (
        <p className="text-sm text-on-surface-muted">Un verre : {formatStandardDrinks(grams)}.</p>
      ) : null}
      {errors.form ? <p role="alert" className="font-semibold text-corail">{errors.form}</p> : null}
      <button type="submit" className={buttonClass("secondary")} disabled={pending}>
        Ajouter cette boisson
      </button>
    </form>
  );
}
