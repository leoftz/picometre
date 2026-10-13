"use client";

import { useActionState } from "react";
import { buttonClass } from "@/components/ui";
import { type ActionState, deleteAccount } from "./actions";

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(deleteAccount, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex items-start gap-3">
        <input type="checkbox" name="confirm" className="mt-1 size-5 shrink-0 accent-corail" />
        <span>Je comprends que mon compte et toutes mes données seront supprimés, sans retour possible.</span>
      </label>
      {state.error ? <p role="alert" className="font-semibold text-corail">{state.error}</p> : null}
      <button type="submit" className={buttonClass("danger")} disabled={pending}>
        {pending ? "Suppression…" : "Supprimer mon compte et mes données"}
      </button>
    </form>
  );
}
