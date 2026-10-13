"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AlertCard } from "@/components/alert-card";
import { BacCurve } from "@/components/bac-curve";
import { Gauge } from "@/components/gauge";
import { UpcomingPeak } from "@/components/upcoming-peak";
import { buttonClass } from "@/components/ui";
import { ethanolGrams } from "@/lib/bac/dose";
import type { Pour } from "@/lib/bac/types";
import { drinkType, glassSize } from "@/lib/bank/catalog";
import { alertsFor } from "@/lib/party/alerts";
import { type ParticipantData, toSimulationInput } from "@/lib/party/estimate";
import { formatGrams, formatStandardDrinks, formatTime } from "@/lib/party/format";
import { useEstimate } from "@/lib/party/use-estimate";
import { createClient } from "@/lib/supabase/client";

export interface PlannedDrink {
  id: string;
  kind: "boisson" | "cocktail";
  drink_type: string | null;
  name: string | null;
  abv: number | null;
  default_glass: string | null;
  ethanol_g: number;
  pour: Pour;
}

export interface Consumption {
  id: string;
  party_drink_id: string | null;
  label: string;
  glass_size: string | null;
  portion: number;
  consumed_at: string;
  ethanol_g: number;
  pour: Pour;
  pending?: boolean;
}

type Choice = { glass: string | null; portion: number; label: string; grams: number };

const UNDO_MS = 10_000;
const COLUMNS = "id, party_drink_id, label, glass_size, portion, consumed_at, ethanol_g, pour";

function drinkLabel(drink: PlannedDrink) {
  return drink.kind === "cocktail" ? drink.name! : drinkType(drink.drink_type!)?.label ?? "Boisson";
}

/** Second tap: the glasses offered for the drink (default first), or the portion of a cocktail. */
function choicesFor(drink: PlannedDrink): Choice[] {
  if (drink.kind === "cocktail") {
    return [
      { glass: null, portion: 1, label: "1 verre", grams: drink.ethanol_g },
      { glass: null, portion: 0.5, label: "½ verre", grams: drink.ethanol_g / 2 },
    ];
  }
  const type = drinkType(drink.drink_type!)!;
  const glasses = [drink.default_glass!, ...type.glasses.filter((g) => g !== drink.default_glass)];
  return glasses.map((slug) => ({
    glass: slug,
    portion: 1,
    label: glassSize(slug)!.label,
    grams: ethanolGrams(glassSize(slug)!.volumeMl, Number(drink.abv)),
  }));
}

// Offline queue, per party, kept in localStorage and read as an external store. Entries are replayed with
// the same id, so the database never duplicates them.
const QUEUE_EVENT = "pico:queue";
const queueKey = (partyId: string) => `pico:pending:${partyId}`;
function readQueueRaw(partyId: string): string {
  try {
    return localStorage.getItem(queueKey(partyId)) ?? "[]";
  } catch {
    return "[]";
  }
}
function readQueue(partyId: string): Consumption[] {
  try {
    return JSON.parse(readQueueRaw(partyId)) as Consumption[];
  } catch {
    return [];
  }
}
function writeQueue(partyId: string, items: Consumption[]) {
  try {
    localStorage.setItem(queueKey(partyId), JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode): the entry stays on screen until the page is closed.
  }
  window.dispatchEvent(new Event(QUEUE_EVENT));
}
function subscribeQueue(onChange: () => void) {
  window.addEventListener(QUEUE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(QUEUE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function LiveParty({
  participant,
  plannedDrinks,
  initialConsumptions,
}: {
  participant: Omit<ParticipantData, "consumptions">;
  plannedDrinks: PlannedDrink[];
  initialConsumptions: Consumption[];
}) {
  const { partyId } = participant;
  const supabase = useMemo(() => createClient(), []);
  const [consumptions, setConsumptions] = useState<Consumption[]>(initialConsumptions);
  const [drinks, setDrinks] = useState<PlannedDrink[]>(plannedDrinks);
  const [now, setNow] = useState(() => Date.now());
  const [picking, setPicking] = useState<PlannedDrink | null>(null);
  const [undo, setUndo] = useState<{ id: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The estimate moves with time: refresh every minute.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const queueRaw = useSyncExternalStore(subscribeQueue, () => readQueueRaw(partyId), () => "[]");
  // Saved drinks plus those still waiting for the network (offline entries from this or an earlier visit).
  const allConsumptions = useMemo(() => {
    let queued: Consumption[] = [];
    try {
      queued = JSON.parse(queueRaw) as Consumption[];
    } catch {
      queued = [];
    }
    const extra = queued.filter((q) => !consumptions.some((c) => c.id === q.id)).map((q) => ({ ...q, pending: true }));
    return [...consumptions, ...extra];
  }, [consumptions, queueRaw]);

  const input = useMemo(
    () => toSimulationInput({ ...participant, consumptions: allConsumptions }, now),
    [participant, allConsumptions, now],
  );
  const result = useEstimate(input);
  const alerts = result ? alertsFor(result, now) : [];
  // Stop mode as soon as the Stop is reached or announced (P-54): no alcohol is offered any more.
  const stopped = alerts.some((a) => a.kind === "stop") || Boolean(participant.stopLockedAt);

  // P-54: record the Stop once, so it survives reloads and other devices; the database forbids clearing it.
  const stopSaved = useRef(Boolean(participant.stopLockedAt));
  useEffect(() => {
    if (!result?.stopLocked || stopSaved.current) return;
    stopSaved.current = true;
    const reached = result.curve.find((p) => p.gauge >= 0.8)?.t ?? now;
    void supabase
      .from("participant_private")
      .update({ stop_locked_at: new Date(Math.min(reached, now)).toISOString() })
      .eq("party_id", partyId)
      .eq("user_id", participant.userId);
  }, [result, now, supabase, partyId, participant.userId]);

  const save = useCallback(
    async (entry: Consumption): Promise<boolean> => {
      const { data, error: insertError } = await supabase
        .from("consumptions")
        .insert({
          id: entry.id,
          party_id: partyId,
          party_drink_id: entry.party_drink_id,
          glass_size: entry.glass_size,
          portion: entry.portion,
          consumed_at: entry.consumed_at,
        })
        .select(COLUMNS)
        .single();
      // Already saved by an earlier attempt (same id): nothing to do.
      if (insertError?.code === "23505") return true;
      if (insertError) return false;
      const saved = { ...data, ethanol_g: Number(data.ethanol_g), portion: Number(data.portion) };
      setConsumptions((list) => [...list.filter((c) => c.id !== entry.id), saved]);
      return true;
    },
    [supabase, partyId],
  );

  const flushQueue = useCallback(async () => {
    const queued = readQueue(partyId);
    if (queued.length === 0) return;
    const left: Consumption[] = [];
    for (const entry of queued) if (!(await save(entry))) left.push(entry);
    writeQueue(partyId, left);
  }, [partyId, save]);

  // Replay offline entries once on arrival, then whenever the network comes back.
  useEffect(() => {
    const timer = setTimeout(flushQueue, 0);
    window.addEventListener("online", flushQueue);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", flushQueue);
    };
  }, [flushQueue]);

  const record = async (drink: PlannedDrink, choice: Choice) => {
    setPicking(null);
    setError(null);
    const at = new Date();
    const entry: Consumption = {
      id: crypto.randomUUID(),
      party_drink_id: drink.id,
      label: drinkLabel(drink),
      glass_size: choice.glass,
      portion: choice.portion,
      consumed_at: at.toISOString(),
      ethanol_g: Math.round(choice.grams * 10) / 10,
      pour: drink.pour,
      pending: true,
    };
    setConsumptions((list) => [...list, entry]);
    setNow(at.getTime());
    setUndo({ id: entry.id, label: entry.label });
    if (!(await save(entry))) {
      setConsumptions((list) => list.filter((c) => c.id !== entry.id));
      writeQueue(partyId, [...readQueue(partyId), entry]);
      setError("Pas de réseau : ton verre est gardé et sera envoyé dès que possible.");
    }
  };

  const remove = async (id: string) => {
    setConsumptions((list) => list.filter((c) => c.id !== id));
    writeQueue(partyId, readQueue(partyId).filter((c) => c.id !== id));
    setUndo((u) => (u?.id === id ? null : u));
    const { error: deleteError } = await supabase.from("consumptions").delete().eq("id", id);
    if (deleteError) setError("La suppression a échoué. Réessaie.");
  };

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  // Joker eau (charte §7): one tap. Adds a water glass to the plan first if nobody planned one.
  const jokerEau = async () => {
    let water = drinks.find((d) => d.drink_type === "eau");
    if (!water) {
      const { data, error: planError } = await supabase
        .from("party_drinks")
        .insert({ party_id: partyId, kind: "boisson", drink_type: "eau", abv: 0, default_glass: "verre" })
        .select("id, kind, drink_type, name, abv, default_glass, ethanol_g, pour")
        .single();
      if (planError || !data) {
        setError("Le joker eau n'a pas pu être noté. Réessaie.");
        return;
      }
      water = { ...data, abv: Number(data.abv), ethanol_g: Number(data.ethanol_g) } as PlannedDrink;
      setDrinks((list) => [water!, ...list]);
    }
    await record(water, { glass: "verre", portion: 1, label: "Verre (25 cl)", grams: 0 });
  };

  const ordered = [...drinks].sort((a, b) => Number(b.drink_type === "eau") - Number(a.drink_type === "eau"));
  const mine = [...allConsumptions].sort((a, b) => b.consumed_at.localeCompare(a.consumed_at));

  return (
    <div className="flex flex-col gap-8 pb-28">
      {alerts.map((alert) => (
        <AlertCard key={alert.kind} alert={alert} />
      ))}
      {result ? (
        <>
          <Gauge level={result.level} p5={result.current.p5} p50={result.current.p50} p95={result.current.p95} />
          <UpcomingPeak result={result} now={now} />
          <BacCurve curve={result.curve} now={now} />
        </>
      ) : (
        <p role="status" className="text-on-surface-muted">Calcul de ta jauge…</p>
      )}

      <section aria-labelledby="noter" className="flex flex-col gap-3">
        <h2 id="noter" className="font-display text-2xl font-bold">Je note un verre</h2>
        {ordered.length === 0 ? (
          <p className="text-on-surface-muted">Aucune boisson prévue. Ajoute-les depuis la page de la soirée.</p>
        ) : stopped ? (
          <>
            <DrinkGrid drinks={ordered.filter(isAlcoholFree)} onPick={setPicking} />
            <details className="rounded-carte bg-white/5 p-4">
              <summary className="cursor-pointer text-sm">Noter quand même un verre d&apos;alcool</summary>
              <p className="mt-2 mb-3 text-sm text-on-surface-muted">Pour que l&apos;estimation reste juste. Picomètre ne le propose plus ce soir.</p>
              <DrinkGrid drinks={ordered.filter((d) => !isAlcoholFree(d))} onPick={setPicking} />
            </details>
          </>
        ) : (
          <DrinkGrid drinks={ordered} onPick={setPicking} />
        )}
      </section>

      {error ? <p role="alert" className="font-semibold text-corail">{error}</p> : null}

      <section aria-labelledby="mes-verres" className="flex flex-col gap-3">
        <h2 id="mes-verres" className="font-display text-2xl font-bold">Mes verres</h2>
        {mine.length === 0 ? (
          <p className="text-on-surface-muted">Rien de noté pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mine.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-bouton bg-white/5 px-4 py-3">
                <div>
                  <p className="font-semibold">
                    {formatTime(c.consumed_at)} · {c.label}
                    {c.portion !== 1 ? ` (${c.portion === 0.5 ? "½" : c.portion} verre)` : ""}
                  </p>
                  <p className="text-sm text-on-surface-muted">
                    {c.glass_size ? `${glassSize(c.glass_size)?.label} · ` : ""}
                    {c.ethanol_g > 0 ? `${formatGrams(c.ethanol_g)}, ${formatStandardDrinks(c.ethanol_g)}` : "sans alcool"}
                    {c.pending ? " · en attente de réseau" : ""}
                  </p>
                </div>
                <button type="button" onClick={() => remove(c.id)} className="text-sm underline" aria-label={`Retirer ${c.label} de ${formatTime(c.consumed_at)}`}>
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {picking ? (
        <div className="fixed inset-0 z-20 flex items-end bg-nuit/70" onClick={() => setPicking(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="choix-titre"
            className="mx-auto w-full max-w-md rounded-t-carte bg-nuit p-6 pb-10 shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="choix-titre" className="mb-4 font-display text-2xl font-bold">{drinkLabel(picking)}</p>
            <div className="flex flex-col gap-3">
              {choicesFor(picking).map((choice, index) => (
                <button
                  key={`${choice.glass}-${choice.portion}`}
                  type="button"
                  autoFocus={index === 0}
                  onClick={() => record(picking, choice)}
                  className={buttonClass(index === 0 ? "primary" : "secondary", "justify-between")}
                >
                  <span>{choice.label}</span>
                  <span className="text-sm font-normal">{choice.grams > 0 ? formatStandardDrinks(choice.grams) : "sans alcool"}</span>
                </button>
              ))}
              <button type="button" onClick={() => setPicking(null)} className="mt-2 text-center underline">
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-nuit/95 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {undo ? (
            <div role="status" className="flex items-center justify-between rounded-bouton bg-creme px-4 py-3 text-nuit">
              <span>{undo.label} noté.</span>
              <button type="button" onClick={() => remove(undo.id)} className="font-semibold underline">
                Annuler
              </button>
            </div>
          ) : null}
          <button type="button" onClick={jokerEau} className={buttonClass("eau")}>
            Joker eau
          </button>
        </div>
      </div>
    </div>
  );
}

function isAlcoholFree(drink: PlannedDrink) {
  return drink.kind === "boisson" && Number(drink.abv) === 0;
}

function DrinkGrid({ drinks, onPick }: { drinks: PlannedDrink[]; onPick: (drink: PlannedDrink) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {drinks.map((drink) => (
        <button
          key={drink.id}
          type="button"
          onClick={() => onPick(drink)}
          className={`min-h-20 rounded-carte p-3 text-left font-semibold ${isAlcoholFree(drink) ? "bg-menthe text-nuit" : "bg-white/10"}`}
        >
          {drinkLabel(drink)}
          {drink.kind === "cocktail" ? <span className="block text-xs font-normal opacity-80">Cocktail</span> : null}
        </button>
      ))}
    </div>
  );
}
