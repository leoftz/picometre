import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { Loading, PageShell } from "@/components/ui";
import type { AvatarId } from "@/lib/account/avatars";
import { enforceOnboarding } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { answerFriendRequest, removeFriendship, revokeInviteLink } from "./actions";
import { AddByPseudo, InviteLink } from "./friend-forms";

export const metadata: Metadata = { title: "Mes amis" };

// E14 — friends: by pseudo (acceptance required) or by a single-use link.
export default function Friends({ searchParams }: PageProps<"/amis">) {
  return (
    <PageShell>
      <Suspense fallback={<Loading />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

type Card = { id: string; pseudo: string; avatar: string };

function Person({ card, children }: { card: Card | undefined; children?: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-bouton bg-white/5 px-4 py-3">
      <span className="flex items-center gap-3">
        {card ? <Avatar id={card.avatar as AvatarId} size={40} /> : null}
        <span className="font-semibold">{card?.pseudo ?? "Personnage supprimé"}</span>
      </span>
      {children ? <span className="flex gap-3">{children}</span> : null}
    </li>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/amis">, "searchParams">) {
  const user = await enforceOnboarding("termine");
  const { ajout, lien } = await searchParams;
  const supabase = await createClient();
  const [{ data: friendships }, { data: cards }, { data: links }] = await Promise.all([
    supabase.from("friendships").select("id, requester_id, addressee_id, status").neq("status", "declined"),
    supabase.from("profile_cards").select("id, pseudo, avatar"),
    supabase.from("friend_invites").select("token, expires_at").is("used_at", null).gt("expires_at", new Date().toISOString()),
  ]);
  const card = (id: string) => cards?.find((c) => c.id === id) as Card | undefined;
  const other = (f: { requester_id: string; addressee_id: string }) => (f.requester_id === user.id ? f.addressee_id : f.requester_id);
  const friends = friendships?.filter((f) => f.status === "accepted") ?? [];
  const received = friendships?.filter((f) => f.status === "pending" && f.addressee_id === user.id) ?? [];
  const sent = friendships?.filter((f) => f.status === "pending" && f.requester_id === user.id) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <Link href="/accueil" className="text-sm underline">← Accueil</Link>
        <h1 className="font-display text-3xl font-extrabold">Mes amis</h1>
      </header>

      {typeof ajout === "string" ? (
        <p role="status" className="rounded-carte bg-menthe p-4 font-semibold text-nuit">Toi et {ajout} êtes amis.</p>
      ) : null}
      {lien === "invalide" ? (
        <p role="alert" className="font-semibold text-corail">Ce lien d&apos;invitation a expiré ou a déjà servi.</p>
      ) : null}

      {received.length > 0 ? (
        <section aria-labelledby="recues" className="flex flex-col gap-3">
          <h2 id="recues" className="font-display text-2xl font-bold">Demandes reçues</h2>
          <ul className="flex flex-col gap-2">
            {received.map((f) => (
              <Person key={f.id} card={card(other(f))}>
                <form action={answerFriendRequest.bind(null, f.id, true)}>
                  <button type="submit" className="font-semibold underline">Accepter</button>
                </form>
                <form action={answerFriendRequest.bind(null, f.id, false)}>
                  <button type="submit" className="underline">Refuser</button>
                </form>
              </Person>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="amis" className="flex flex-col gap-3">
        <h2 id="amis" className="font-display text-2xl font-bold">Amis</h2>
        {friends.length === 0 ? (
          <p className="text-on-surface-muted">Pas encore d&apos;amis ici. Envoie ton lien ou cherche un pseudo.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {friends.map((f) => (
              <Person key={f.id} card={card(other(f))}>
                <form action={removeFriendship.bind(null, f.id)}>
                  <button type="submit" className="text-sm underline" aria-label={`Retirer ${card(other(f))?.pseudo ?? "cet ami"} de mes amis`}>
                    Retirer
                  </button>
                </form>
              </Person>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="ajouter" className="flex flex-col gap-6">
        <h2 id="ajouter" className="font-display text-2xl font-bold">Ajouter</h2>
        <InviteLink />
        <AddByPseudo />
      </section>

      {sent.length > 0 || (links?.length ?? 0) > 0 ? (
        <section aria-labelledby="en-attente" className="flex flex-col gap-3">
          <h2 id="en-attente" className="font-display text-xl font-bold">En attente</h2>
          <ul className="flex flex-col gap-2">
            {sent.map((f) => (
              <Person key={f.id} card={card(other(f))}>
                <form action={removeFriendship.bind(null, f.id)}>
                  <button type="submit" className="text-sm underline">Annuler la demande</button>
                </form>
              </Person>
            ))}
            {links?.map((l) => (
              <li key={l.token} className="flex items-center justify-between gap-3 rounded-bouton bg-white/5 px-4 py-3 text-sm">
                <span>Lien d&apos;invitation non utilisé</span>
                <form action={revokeInviteLink.bind(null, l.token)}>
                  <button type="submit" className="underline">Désactiver</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
