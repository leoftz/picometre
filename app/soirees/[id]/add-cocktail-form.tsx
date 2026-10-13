"use client";

import { useActionState, useState } from "react";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { DRINK_TYPES, drinkType } from "@/lib/bank/catalog";
import { cocktailGrams } from "@/lib/bac/dose";
import { formatStandardDrinks } from "@/lib/party/format";
import { type FormState, addCocktail } from "../actions";

/** Alcoholic types usable as cocktail ingredients (the bank, P-60 to P-79). */
const ALCOHOLS = DRINK_TYPES.filter((t) => t.abvMax > 0 && t.family !== "sans_alcool");

type Row = { key: number; drinkType: string; volumeCl: string; abv: string };

const newRow = (key: number): Row => ({ key, drinkType: "spiritueux", volumeCl: "4", abv: String(drinkType("spiritueux")!.abvDefault) });

export function AddCocktailForm({ partyId }: { partyId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(addCocktail.bind(null, partyId), { errors: {} });
  const [rows, setRows] = useState<Row[]>([newRow(0)]);
  const { errors } = state;

  const update = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const ingredients = rows.map((r) => ({ drinkType: r.drinkType, volumeMl: Number(r.volumeCl.replace(",", ".")) * 10, abv: Number(r.abv.replace(",", ".")) }));
  const grams = cocktailGrams(ingredients.map((i) => ({ volumeMl: i.volumeMl || 0, abvPercent: i.abv || 0 })));

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Nom du cocktail" htmlFor="cocktail-name" hint="Un nom générique, sans marque." error={errors.name}>
        <input id="cocktail-name" name="name" maxLength={30} placeholder="Mojito maison" className={inputClass} aria-invalid={Boolean(errors.name)} />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Les alcools de la recette, pour un verre</legend>
        {rows.map((row, index) => (
          <div key={row.key} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 border-b border-white/10 pb-3">
            <div className="col-span-3 flex flex-col gap-1 text-sm">
              <label htmlFor={`ingredient-${row.key}-type`}>Alcool {index + 1}</label>
              <select
                id={`ingredient-${row.key}-type`}
                value={row.drinkType}
                onChange={(e) => update(row.key, { drinkType: e.target.value, abv: String(drinkType(e.target.value)!.abvDefault) })}
                className={inputClass}
              >
                {ALCOHOLS.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <label htmlFor={`ingredient-${row.key}-cl`}>cl</label>
              <input id={`ingredient-${row.key}-cl`} inputMode="decimal" value={row.volumeCl} onChange={(e) => update(row.key, { volumeCl: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <label htmlFor={`ingredient-${row.key}-abv`}>%</label>
              <input id={`ingredient-${row.key}-abv`} inputMode="decimal" value={row.abv} onChange={(e) => update(row.key, { abv: e.target.value })} className={inputClass} />
            </div>
            <button
              type="button"
              onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
              disabled={rows.length === 1}
              className="h-14 rounded-bouton px-3 text-sm underline disabled:opacity-40"
              aria-label={`Retirer l'alcool ${index + 1}`}
            >
              Retirer
            </button>
          </div>
        ))}
        {rows.length < 8 ? (
          <button type="button" onClick={() => setRows((current) => [...current, newRow(Math.max(...current.map((r) => r.key)) + 1)])} className="self-start text-sm font-semibold underline">
            Ajouter un alcool
          </button>
        ) : null}
        {errors.ingredients ? <p role="alert" className="text-sm font-semibold text-corail">{errors.ingredients}</p> : null}
      </fieldset>
      <input type="hidden" name="ingredients" value={JSON.stringify(ingredients)} />

      <fieldset className="flex gap-4">
        <legend className="mb-1 font-semibold">Comment c&apos;est servi ?</legend>
        <label className="flex items-center gap-2"><input type="radio" name="pour" value="dose" className="size-5 accent-corail" /> Dosé</label>
        <label className="flex items-center gap-2"><input type="radio" name="pour" value="oeil" defaultChecked className="size-5 accent-corail" /> À l&apos;œil</label>
      </fieldset>

      <p className="text-sm text-on-surface-muted">Un verre : {formatStandardDrinks(grams)}.</p>
      {errors.form ? <p role="alert" className="font-semibold text-corail">{errors.form}</p> : null}
      <button type="submit" className={buttonClass("secondary")} disabled={pending}>
        Ajouter ce cocktail
      </button>
    </form>
  );
}
