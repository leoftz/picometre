import type { ReactNode } from "react";

// Charte §7 buttons. Primary text is nuit on corail (crème would fail WCAG AA, see PLAN « Écarts à la charte »).
const BUTTON = {
  primary: "bg-corail text-nuit hover:brightness-105",
  secondary: "border-2 border-on-surface text-on-surface hover:bg-white/5",
  eau: "bg-menthe text-nuit hover:brightness-105",
  danger: "border-2 border-jauge-4 text-on-surface hover:bg-jauge-4/10",
} as const;

export function buttonClass(variant: keyof typeof BUTTON = "primary", extra = ""): string {
  return `inline-flex h-14 w-full items-center justify-center gap-2 rounded-bouton px-6 text-base font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-citron disabled:opacity-60 ${BUTTON[variant]} ${extra}`;
}

export function PageShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-6 pt-10 pb-16">
      <p className="font-display text-2xl font-extrabold" aria-label="Picomètre">
        <span className="text-corail">pico</span>mètre
      </p>
      {title ? <h1 className="font-display text-3xl font-extrabold">{title}</h1> : null}
      {children}
    </main>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="font-semibold">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-on-surface-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-corail">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "h-14 w-full rounded-bouton border-2 border-white/15 bg-white/5 px-4 text-base text-on-surface placeholder:text-on-surface-muted focus:border-citron focus:outline-none aria-[invalid=true]:border-corail";

export function Loading() {
  return (
    <p className="text-on-surface-muted" role="status">
      Chargement…
    </p>
  );
}
