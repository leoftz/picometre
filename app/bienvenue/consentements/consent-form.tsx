"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass } from "@/components/ui";
import { CONSENT_TEXTS } from "@/lib/account/consents";
import { type FormState, acceptConsents } from "../actions";

const initial: FormState = { errors: {} };

export function ConsentForm() {
  const [state, formAction, pending] = useActionState(acceptConsents, initial);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <ConsentBox name="cgu" error={state.errors.cgu}>
        {CONSENT_TEXTS.cgu}{" "}
        <Link href="/conditions" className="underline" target="_blank">
          Lire les conditions
        </Link>{" "}
        ·{" "}
        <Link href="/confidentialite" className="underline" target="_blank">
          Lire la politique de confidentialité
        </Link>
      </ConsentBox>

      <ConsentBox name="health_data" error={state.errors.health_data}>
        {CONSENT_TEXTS.health_data}
      </ConsentBox>

      {state.errors.form ? (
        <p role="alert" className="font-semibold text-corail">
          {state.errors.form}
        </p>
      ) : null}

      <button type="submit" className={buttonClass("primary")} disabled={pending}>
        Continuer
      </button>
    </form>
  );
}

function ConsentBox({ name, error, children }: { name: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-start gap-3 rounded-carte bg-white/5 p-4">
        {/* Never pre-checked: consent must be an explicit act (GDPR art. 4(11)). */}
        <input
          type="checkbox"
          name={name}
          className="mt-1 size-6 shrink-0 accent-corail"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-sm font-semibold text-corail">
          {error}
        </p>
      ) : null}
    </div>
  );
}
