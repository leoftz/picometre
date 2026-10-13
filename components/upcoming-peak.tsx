import { levelOf } from "@/lib/bac/simulate";
import type { SimulationResult } from "@/lib/bac/types";
import { gaugeLevels } from "@/lib/brand/tokens";
import { formatTime } from "@/lib/party/format";
import { GaugeIcon } from "./gauge-icon";

const format = (gramsPerLiter: number) => gramsPerLiter.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Right after drinking, the current estimate is still low because alcohol is not absorbed yet.
 * Show where the gauge is heading, so a low « now » never reads as « all clear ».
 */
export function UpcomingPeak({ result, now }: { result: SimulationResult; now: number }) {
  const ahead = result.curve.filter((p) => p.t > now);
  if (ahead.length === 0) return null;
  const top = ahead.reduce((best, p) => (p.gauge > best.gauge ? p : best));
  if ( top.gauge <= result.current.gauge + 0.02 || top.t - now < 5 * 60_000) return null;

  const level = levelOf(top.gauge);
  const { label, color } = gaugeLevels[level];
  return (
    <section aria-labelledby="a-venir" className="flex items-start gap-3 rounded-carte border-2 p-4" style={{ borderColor: color }}>
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
        <GaugeIcon level={level} size={22} color="#1B1F3B" />
      </span>
      <div>
        <h2 id="a-venir" className="font-semibold">À venir : {label}</h2>
        <p className="text-sm text-on-surface-muted">
          L&apos;alcool n&apos;est pas encore tout absorbé. Pic estimé vers {formatTime(top.t)}, autour de {format(top.p50)} g/L (entre{" "}
          {format(top.p5)} et {format(top.p95)}).
        </p>
      </div>
    </section>
  );
}
