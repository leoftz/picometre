import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, PageShell, buttonClass } from "@/components/ui";
import { drinkType, glassSize } from "@/lib/bank/catalog";
import { enforceOnboarding } from "@/lib/auth/dal";
import { formatAbv, formatGrams, formatPartyDate, formatStandardDrinks } from "@/lib/party/format";
import { createClient } from "@/lib/supabase/server";
import { deleteParty, removePlannedDrink } from "../actions";
import { AddCocktailForm } from "./add-cocktail-form";
import { AddDrinkForm } from "./add-drink-form";
import { ParticipationForm } from "./participation-form";

export const metadata: Metadata = { title: "Soirée" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// E7–E9 — a party: my objective and meal, and the planned drinks. Every member adds their own
// drinks; the author or the host can remove them (PLAN Q-12).
export default function Party({ params }: PageProps<"/soirees/[id]">) {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Content params={params} />
      </Suspense>
    </PageShell>
  );
}

async function Content({ params }: Pick<PageProps<"/soirees/[id]">, "params">) {
  const user = await enforceOnboarding("termine");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: party }, { data: me }, { data: drinks }] = await Promise.all([
    supabase.from("parties").select("id, title, starts_at, location, host_id").eq("id", id).maybeSingle(),
    supabase.from("party_participants").select("objective, meal_kind, meal_at").eq("party_id", id).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("party_drinks")
      .select("id, kind, drink_type, abv, default_glass, name, ethanol_g, pour, added_by, cocktail_ingredients(drink_type, volume_ml, abv)")
      .eq("party_id", id)
      .order("created_at"),
  ]);
  // RLS hides parties the user is not part of: same answer as a party that does not exist.
  if (!party || !me) notFound();
  const isHost = party.host_id === user.id;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <Link href="/accueil" className="text-sm underline">← Mes soirées</Link>
        <h1 className="font-display text-3xl font-extrabold">{party.title}</h1>
        <p className="text-on-surface-muted first-letter:uppercase">
          {formatPartyDate(party.starts_at)}
          {party.location ? ` · ${party.location}` : ""}
        </p>
      </header>

      <Link href={`/soirees/${party.id}/jauge`} className={buttonClass("primary")}>
        Ouvrir ma jauge
      </Link>

      <section aria-labelledby="mon-objectif" className="flex flex-col gap-4">
        <h2 id="mon-objectif" className="font-display text-2xl font-bold">Ma soirée</h2>
        <ParticipationForm
          partyId={party.id}
          objective={me.objective}
          mealKind={me.meal_kind}
          mealAt={me.meal_at}
          defaultMealAt={party.starts_at}
        />
      </section>

      <section aria-labelledby="boissons" className="flex flex-col gap-4">
        <h2 id="boissons" className="font-display text-2xl font-bold">Boissons prévues</h2>
        {drinks && drinks.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {drinks.map((drink) => (
              <li key={drink.id} className="flex items-center justify-between gap-3 rounded-bouton bg-white/5 px-4 py-3">
                <div>
                  <p className="font-semibold">{drink.kind === "cocktail" ? drink.name : drinkType(drink.drink_type!)?.label}</p>
                  <p className="text-sm text-on-surface-muted">
                    {drink.kind === "cocktail"
                      ? `Cocktail · ${drink.cocktail_ingredients.length} alcool${drink.cocktail_ingredients.length > 1 ? "s" : ""}`
                      : `${glassSize(drink.default_glass!)?.label} · ${formatAbv(drink.abv!)}`}
                    {" · "}
                    {Number(drink.ethanol_g) > 0 ? `${formatGrams(Number(drink.ethanol_g))}, ${formatStandardDrinks(Number(drink.ethanol_g))}` : "sans alcool"}
                    {drink.pour === "oeil" ? " · à l'œil" : ""}
                  </p>
                </div>
                {isHost || drink.added_by === user.id ? (
                  <form action={removePlannedDrink.bind(null, party.id, drink.id)}>
                    <button type="submit" className="text-sm underline" aria-label={`Retirer ${drink.kind === "cocktail" ? drink.name : drinkType(drink.drink_type!)?.label}`}>
                      Retirer
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-on-surface-muted">Rien de prévu pour l&apos;instant. Pense à l&apos;eau et aux softs.</p>
        )}

        <>
            <details className="rounded-carte bg-white/5 p-4">
              <summary className="cursor-pointer font-semibold">Ajouter une boisson</summary>
              <div className="mt-4"><AddDrinkForm partyId={party.id} /></div>
            </details>
            <details className="rounded-carte bg-white/5 p-4">
              <summary className="cursor-pointer font-semibold">Ajouter un cocktail</summary>
              <div className="mt-4"><AddCocktailForm partyId={party.id} /></div>
            </details>
        </>
      </section>

      {isHost ? (
        <form action={deleteParty.bind(null, party.id)}>
          <button type="submit" className={buttonClass("danger")}>Supprimer la soirée</button>
        </form>
      ) : null}
    </div>
  );
}
