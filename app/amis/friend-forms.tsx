"use client";

import { useActionState, useState } from "react";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { type LinkState, type RequestState, createInviteLink, sendFriendRequest } from "./actions";

export function AddByPseudo() {
  const [state, formAction, pending] = useActionState<RequestState, FormData>(sendFriendRequest, {});
  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <Field label="Ajouter par pseudo" htmlFor="pseudo" hint="Le pseudo exact de la personne. Elle devra accepter.">
        <input id="pseudo" name="pseudo" autoComplete="off" autoCapitalize="none" className={inputClass} />
      </Field>
      {state.message ? (
        <p role={state.ok ? "status" : "alert"} className={`text-sm font-semibold ${state.ok ? "text-menthe" : "text-corail"}`}>
          {state.message}
        </p>
      ) : null}
      <button type="submit" className={buttonClass("secondary")} disabled={pending}>
        Envoyer la demande
      </button>
    </form>
  );
}

export function InviteLink() {
  const [state, setState] = useState<LinkState>({});
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  const create = async () => {
    setPending(true);
    setCopied(false);
    setState(await createInviteLink());
    setPending(false);
  };
  const share = async () => {
    if (!state.url) return;
    const text = "Rejoins-moi sur Picomètre : on s'amuse, la jauge veille.";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Picomètre", text, url: state.url });
        return;
      } catch {
        // Share sheet dismissed: fall back to copying.
      }
    }
    await navigator.clipboard.writeText(state.url);
    setCopied(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-on-surface-muted">Un lien personnel, valable 7 jours, pour une seule personne. L&apos;ouvrir vous rend amis.</p>
      {state.url ? (
        <>
          <input readOnly value={state.url} aria-label="Ton lien d'invitation" className={`${inputClass} text-sm`} onFocus={(e) => e.target.select()} />
          <button type="button" onClick={share} className={buttonClass("primary")}>
            Partager le lien
          </button>
          {copied ? <p role="status" className="text-sm font-semibold text-menthe">Lien copié.</p> : null}
        </>
      ) : (
        <button type="button" onClick={create} className={buttonClass("secondary")} disabled={pending}>
          Créer un lien d&apos;invitation
        </button>
      )}
      {state.error ? <p role="alert" className="text-sm font-semibold text-corail">{state.error}</p> : null}
    </div>
  );
}
