import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { SharingControl } from "@/components/sharing-control";
import { Loading, PageShell, buttonClass } from "@/components/ui";
import type { AvatarId } from "@/lib/account/avatars";
import { drinkType, glassSize } from "@/lib/bank/catalog";
import { enforceOnboarding } from "@/lib/auth/dal";
import { formatAbv, formatGrams, formatPartyDate, formatStandardDrinks } from "@/lib/party/format";
import { libraryOpen } from "@/lib/party/library";
import { createClient } from "@/lib/supabase/server";
import { answerInvitation, deleteParty, endParty, inviteFriends, removeParticipant, removePlannedDrink } from "../actions";
import { AddCocktailForm } from "./add-cocktail-form";
import { AddDrinkForm } from "./add-drink-form";
import { ParticipationForm } from "./participation-form";
import { RecipeLibrary } from "./recipe-library";

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
  const [{ data: party }, { data: me }, { data: drinks }, { data: participants }, { data: cards }, { data: friendships }, { count: drinksEntered }] = await Promise.all([
    supabase.from("parties").select("id, title, starts_at, location, host_id, status").eq("id", id).maybeSingle(),
    supabase.from("participant_private").select("objective, meal_kind, meal_at, stop_locked_at").eq("party_id", id).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("party_drinks")
      .select("id, kind, drink_type, abv, default_glass, name, ethanol_g, pour, added_by, cocktail_ingredients(drink_type, volume_ml, abv)")
      .eq("party_id", id)
      .order("created_at"),
    supabase.from("party_participants").select("user_id, role, invite_status, share_gauge").eq("party_id", id).order("role"),
    supabase.from("profile_cards").select("id, pseudo, avatar"),
    supabase.from("friendships").select("requester_id, addressee_id").eq("status", "accepted"),
    supabase.from("consumptions").select("id", { count: "exact", head: true }).eq("party_id", id),
  ]);
  // RLS hides parties the user is not part of: same answer as a party that does not exist.
  if (!party || !me) notFound();
  const isHost = party.host_id === user.id;
  const showLibrary = libraryOpen({ status: party.status, stopLockedAt: me.stop_locked_at, drinksEntered: drinksEntered ?? 0 });
  const card = (userId: string) => cards?.find((c) => c.id === userId);
  const myInvite = participants?.find((p) => p.user_id === user.id)?.invite_status;
  const inParty = new Set(participants?.map((p) => p.user_id));
  const invitable = (friendships ?? [])
    .map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id))
    .filter((friendId) => !inParty.has(friendId))
    .map((friendId) => card(friendId))
    .filter((c) => c !== undefined);
  const STATUS = { invited: "Invitation envoyée", accepted: "Sera de la soirée", declined: "Ne viendra pas" } as const;

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

      {myInvite === "invited" ? (
        <section role="status" className="flex flex-col gap-3 rounded-carte border-2 border-citron p-4">
          <p className="font-semibold">{card(party.host_id)?.pseudo ?? "Quelqu'un"} t&apos;invite à cette soirée.</p>
          <div className="grid grid-cols-2 gap-3">
            <form action={answerInvitation.bind(null, party.id, true)}>
              <button type="submit" className={buttonClass("primary")}>Accepter</button>
            </form>
            <form action={answerInvitation.bind(null, party.id, false)}>
              <button type="submit" className={buttonClass("secondary")}>Décliner</button>
            </form>
          </div>
        </section>
      ) : party.status === "ended" ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="font-semibold">Soirée terminée.</p>
          <Link href={`/soirees/${party.id}/bilan`} className={buttonClass("primary")}>
            Voir mon bilan
          </Link>
          <Link href={`/soirees/${party.id}/jauge`} className={buttonClass("secondary")}>
            Ma jauge
          </Link>
        </div>
      ) : (
        <Link href={`/soirees/${party.id}/jauge`} className={buttonClass("primary")}>
          Ouvrir ma jauge
        </Link>
      )}

      <section aria-labelledby="mon-objectif" className="flex flex-col gap-4">
        <h2 id="mon-objectif" className="font-display text-2xl font-bold">Ma soirée</h2>
        <ParticipationForm
          partyId={party.id}
          objective={me.objective}
          mealKind={me.meal_kind}
          mealAt={me.meal_at}
          defaultMealAt={party.starts_at}
        />
        {myInvite === "accepted" && party.status !== "ended" ? (
          <SharingControl partyId={party.id} sharing={participants?.find((p) => p.user_id === user.id)?.share_gauge ?? false} />
        ) : null}
      </section>

      <section aria-labelledby="participants" className="flex flex-col gap-4">
        <h2 id="participants" className="font-display text-2xl font-bold">Participants</h2>
        <ul className="flex flex-col gap-2">
          {participants?.map((p) => (
            <li key={p.user_id} className="flex items-center justify-between gap-3 rounded-bouton bg-white/5 px-4 py-3">
              <span className="flex items-center gap-3">
                {card(p.user_id) ? <Avatar id={card(p.user_id)!.avatar as AvatarId} size={36} /> : null}
                <span>
                  <span className="font-semibold">{card(p.user_id)?.pseudo ?? "Participant"}</span>
                  <span className="block text-sm text-on-surface-muted">{p.role === "host" ? "Organise la soirée" : STATUS[p.invite_status]}</span>
                </span>
              </span>
              {p.role === "guest" && (isHost || p.user_id === user.id) ? (
                <form action={removeParticipant.bind(null, party.id, p.user_id)}>
                  <button type="submit" className="text-sm underline">{p.user_id === user.id ? "Quitter" : "Retirer"}</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
        {isHost && party.status !== "ended" ? (
          invitable.length > 0 ? (
            <details className="rounded-carte bg-white/5 p-4">
              <summary className="cursor-pointer font-semibold">Inviter des amis</summary>
              <form action={inviteFriends.bind(null, party.id)} className="mt-4 flex flex-col gap-3">
                <fieldset className="flex flex-col gap-2">
                  <legend className="sr-only">Amis à inviter</legend>
                  {invitable.map((friend) => (
                    <label key={friend.id} className="flex items-center gap-3">
                      <input type="checkbox" name="friend" value={friend.id} className="size-5 accent-corail" />
                      <Avatar id={friend.avatar as AvatarId} size={32} />
                      {friend.pseudo}
                    </label>
                  ))}
                </fieldset>
                <button type="submit" className={buttonClass("secondary")}>Envoyer les invitations</button>
              </form>
            </details>
          ) : (
            <p className="text-sm text-on-surface-muted">
              Pour inviter du monde, ajoute d&apos;abord tes amis depuis <Link href="/amis" className="underline">Mes amis</Link>.
            </p>
          )
        ) : null}
      </section>

      <section aria-labelledby="boissons" className="flex flex-col gap-4">
        <h2 id="boissons" className="font-display text-2xl font-bold">Boissons prévues</h2>
        {drinks && drinks.length > 0 ? (
          <ul className="flex flex-col gap-2" aria-label="Liste des boissons prévues">
            {drinks.map((drink) => (
              <li key={drink.id} className="flex items-center justify-between gap-3 rounded-bouton bg-white/5 px-4 py-3">
                <div>
                  <p className="font-semibold">{drink.kind === "cocktail" ? drink.name : drinkType(drink.drink_type!)?.label}</p>
                  <p className="text-sm text-on-surface-muted">
                    {drink.kind === "cocktail"
                      ? drink.cocktail_ingredients.length === 0
                        ? "Cocktail"
                        : `Cocktail · ${drink.cocktail_ingredients.length} alcool${drink.cocktail_ingredients.length > 1 ? "s" : ""}`
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
            {showLibrary ? (
              <details className="rounded-carte bg-white/5 p-4">
                <summary className="cursor-pointer font-semibold">Idées de recettes</summary>
                <div className="mt-4"><RecipeLibrary partyId={party.id} /></div>
              </details>
            ) : null}
        </>
      </section>

      {isHost && party.status !== "ended" ? (
        <details className="rounded-carte bg-white/5 p-4">
          <summary className="cursor-pointer font-semibold">Terminer la soirée</summary>
          <p className="mt-2 mb-3 text-sm text-on-surface-muted">Chacun pourra voir son bilan. Les jauges restent consultables.</p>
          <form action={endParty.bind(null, party.id)}>
            <button type="submit" className={buttonClass("secondary")}>Oui, terminer la soirée</button>
          </form>
        </details>
      ) : null}

      {isHost ? (
        <form action={deleteParty.bind(null, party.id)}>
          <button type="submit" className={buttonClass("danger")}>Supprimer la soirée</button>
        </form>
      ) : null}
    </div>
  );
}
