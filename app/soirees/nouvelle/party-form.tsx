"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Avatar } from "@/components/avatar";
import { DateTimeField } from "@/components/datetime-field";
import { ShareGaugeCheckbox } from "@/components/sharing-control";
import { Field, buttonClass, inputClass } from "@/components/ui";
import type { AvatarId } from "@/lib/account/avatars";
import { type FormState, createParty } from "../actions";

const initial: FormState = { errors: {} };

export interface FriendCard {
  id: string;
  pseudo: string;
  avatar: string;
}

export function PartyForm({ defaultStart, friends }: { defaultStart: string; friends: FriendCard[] }) {
  const [state, formAction, pending] = useActionState(createParty, initial);
  const { errors } = state;
  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <Field label="Nom de la soirée" htmlFor="title" error={errors.title}>
        <input id="title" name="title" maxLength={60} placeholder="Anniv de Sam" className={inputClass} aria-invalid={Boolean(errors.title)} />
      </Field>
      <Field label="Date et heure" htmlFor="startsAt-input" error={errors.startsAt}>
        <DateTimeField id="startsAt-input" name="startsAt" defaultValue={defaultStart} invalid={Boolean(errors.startsAt)} />
      </Field>
      <Field label="Lieu (facultatif)" htmlFor="location" error={errors.location}>
        <input id="location" name="location" maxLength={80} className={inputClass} />
      </Field>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">Qui vient ?</legend>
        {friends.length > 0 ? (
          <div className="flex flex-col gap-2">
            {friends.map((friend) => (
              <label key={friend.id} className="flex items-center gap-3">
                <input type="checkbox" name="friend" value={friend.id} className="size-5 accent-corail" />
                <Avatar id={friend.avatar as AvatarId} size={32} />
                {friend.pseudo}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-muted">
            Pas encore d&apos;amis sur Picomètre : ajoute-les depuis <Link href="/amis" className="underline">Mes amis</Link>, puis invite-les depuis la page de la soirée.
          </p>
        )}
      </fieldset>
      <ShareGaugeCheckbox />
      {errors.form ? <p role="alert" className="font-semibold text-corail">{errors.form}</p> : null}
      <button type="submit" className={buttonClass("primary")} disabled={pending}>
        {pending ? "Création…" : "Créer la soirée"}
      </button>
    </form>
  );
}
