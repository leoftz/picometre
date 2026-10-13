"use client";

import { useState } from "react";
import { fromParisInput, toParisInput } from "@/lib/party/time";
import { inputClass } from "./ui";

/** Date and time picker in Paris time, posted as an ISO 8601 instant (`name`). Same rendering on server and device. */
export function DateTimeField({
  id,
  name,
  defaultValue,
  invalid,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  invalid?: boolean;
}) {
  const [local, setLocal] = useState(defaultValue ? toParisInput(new Date(defaultValue)) : "");
  const iso = fromParisInput(local)?.toISOString() ?? "";
  return (
    <>
      <input
        id={id}
        type="datetime-local"
        value={local}
        onChange={(event) => setLocal(event.target.value)}
        className={inputClass}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${name}-error` : undefined}
      />
      <input type="hidden" name={name} value={iso} />
    </>
  );
}
