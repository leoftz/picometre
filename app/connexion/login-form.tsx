"use client";

import { useActionState } from "react";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { type MagicLinkState, sendMagicLink, signInWithGoogle } from "./actions";

const initial: MagicLinkState = { status: "idle" };

export function LoginForm({ magicLink }: { magicLink: boolean }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initial);

  if (state.status === "sent") {
    return (
      <div role="status" className="space-y-3 rounded-carte bg-white/5 p-6">
        <p className="font-display text-2xl font-bold">Regarde ta boîte mail</p>
        <p>
          On a envoyé un lien de connexion à <strong>{state.email}</strong>. Il est valable une heure.
        </p>
        <p className="text-sm text-on-surface-muted">Ouvre-le sur ce téléphone pour garder ta session ouverte.</p>
      </div>
    );
  }

  const google = (
    <form action={signInWithGoogle}>
      <button type="submit" className={buttonClass(magicLink ? "secondary" : "primary")}>
        Continuer avec Google
      </button>
    </form>
  );
  if (!magicLink) return google;

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Ton adresse e-mail" htmlFor="email" error={state.status === "error" ? state.message : undefined}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            className={inputClass}
            aria-invalid={state.status === "error"}
            aria-describedby={state.status === "error" ? "email-error" : undefined}
          />
        </Field>
        <button type="submit" className={buttonClass("primary")} disabled={pending}>
          {pending ? "Envoi…" : "Recevoir un lien de connexion"}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-muted">ou</p>

      {google}
    </div>
  );
}
