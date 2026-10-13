import { ALCOHOL_FREE_RECIPES, RECIPES, recipeGrams } from "@/lib/bank/recipes";
import { formatStandardDrinks } from "@/lib/party/format";
import { addRecipe } from "../actions";

const cl = (ml: number) => `${(ml / 10).toLocaleString("fr-FR")} cl`;

/**
 * E7 — recipe ideas while preparing the party (docs/parametres-scientifiques.md §1.2). Neutral: no photo,
 * no superlative; alcohol-free recipes first, and each cocktail shows its alcohol-free version next to it.
 */
export function RecipeLibrary({ partyId }: { partyId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-on-surface-muted">
        Des idées pour préparer la soirée. Chaque cocktail a sa version sans alcool. Fait maison, il est compté « à l&apos;œil ».
      </p>

      <section aria-labelledby="recettes-sans-alcool" className="flex flex-col gap-2">
        <h3 id="recettes-sans-alcool" className="font-semibold">Sans alcool</h3>
        <ul className="flex flex-col gap-2">
          {ALCOHOL_FREE_RECIPES.map((r) => (
            <li key={r.ref} className="flex items-center justify-between gap-3 rounded-bouton bg-menthe px-4 py-3 text-nuit">
              <span>
                <span className="font-semibold">{r.name}</span>
                <span className="block text-sm">{r.others}</span>
              </span>
              <AddButton partyId={partyId} refId={r.ref} alcoholFree name={r.name} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recettes-cocktails" className="flex flex-col gap-2">
        <h3 id="recettes-cocktails" className="font-semibold">Cocktails</h3>
        <ul className="flex flex-col gap-3">
          {RECIPES.map((r) => (
            <li key={r.ref} className="flex flex-col gap-2 rounded-bouton bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <span>
                  <span className="font-semibold">{r.name}</span>
                  <span className="block text-sm text-on-surface-muted">
                    {r.ingredients.map((i) => `${i.label} ${cl(i.volumeMl)}`).join(" + ")}
                    {r.others !== "—" ? ` · ${r.others}` : ""} · {formatStandardDrinks(recipeGrams(r))}
                  </span>
                </span>
                <AddButton partyId={partyId} refId={r.ref} alcoholFree={false} name={r.name} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-bouton bg-menthe px-3 py-2 text-nuit">
                <span className="text-sm">
                  <span className="font-semibold">Sans alcool : {r.alcoholFree.name}</span>
                  <span className="block">{r.alcoholFree.others}</span>
                </span>
                <AddButton partyId={partyId} refId={r.ref} alcoholFree name={r.alcoholFree.name} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AddButton({ partyId, refId, alcoholFree, name }: { partyId: string; refId: string; alcoholFree: boolean; name: string }) {
  return (
    <form action={addRecipe.bind(null, partyId, refId, alcoholFree)} className="shrink-0">
      <button
        type="submit"
        aria-label={`Ajouter ${name}`}
        className="min-h-11 rounded-bouton border-2 border-current px-4 text-sm font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-citron"
      >
        Ajouter
      </button>
    </form>
  );
}
