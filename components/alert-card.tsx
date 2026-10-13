import { gaugeLevels } from "@/lib/brand/tokens";
import type { AlertMessage } from "@/lib/party/alerts";
import { GaugeIcon } from "./gauge-icon";

/** Alerts: text on a neutral background (contrast AA), the colour and icon only reinforce it. No sound, no vibration (charte §8). */
export function AlertCard({ alert }: { alert: AlertMessage }) {
  const stop = alert.tone === "stop";
  const color = stop ? gaugeLevels[4].color : "#3DDC97";
  return (
    <section role={stop ? "alert" : "status"} className="flex items-start gap-3 rounded-carte border-2 bg-white/5 p-4" style={{ borderColor: color }}>
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
        {stop ? (
          <GaugeIcon level={4} size={24} color="#1B1F3B" />
        ) : (
          <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" fill="none" stroke="#1B1F3B" strokeWidth={2} strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <div>
        <h2 className="font-display text-xl font-bold">{alert.title}</h2>
        <p className="text-on-surface">{alert.body}</p>
      </div>
    </section>
  );
}
