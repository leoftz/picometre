import { type GaugeLevel, gaugeLevels } from "@/lib/brand/tokens";
import { GaugeIcon } from "./gauge-icon";

const SCALE_MAX = 1; // g/L shown on the thermometer; beyond that the bar stays full.
const format = (gramsPerLiter: number) => gramsPerLiter.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Charte §7 « Jauge »: rounded horizontal thermometer, label + icon (never colour alone),
 * « estimation » always written, 400 ms ease-out fill, no blinking.
 */
export function Gauge({ level, p5, p50, p95 }: { level: GaugeLevel; p5: number; p50: number; p95: number }) {
  const { label, color } = gaugeLevels[level];
  const pct = (value: number) => `${Math.min(100, (value / SCALE_MAX) * 100)}%`;

  return (
    <section aria-labelledby="jauge-titre" className="flex flex-col gap-4 rounded-carte bg-white/5 p-6">
      <h2 id="jauge-titre" className="sr-only">Ma jauge</h2>
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
          <GaugeIcon level={level} color="#1B1F3B" />
        </span>
        <p className="font-display text-2xl font-extrabold" aria-live="polite">
          {label}
        </p>
      </div>

      <div
        className="relative h-6 overflow-hidden rounded-full bg-white/10"
        role="meter"
        aria-label="Jauge estimée"
        aria-valuemin={0}
        aria-valuemax={SCALE_MAX}
        aria-valuenow={Math.min(p50, SCALE_MAX)}
        aria-valuetext={`${label}, estimation ${format(p50)} grammes par litre, entre ${format(p5)} et ${format(p95)}`}
      >
        {/* 90 % range (P-35), then the median. */}
        <div className="absolute inset-y-0 transition-all duration-400 ease-out" style={{ left: pct(p5), width: `calc(${pct(p95)} - ${pct(p5)})`, backgroundColor: color, opacity: 0.35 }} />
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-400 ease-out" style={{ width: pct(p50), backgroundColor: color }} />
      </div>

      <div>
        <p className="font-sans text-[40px] leading-none font-bold tabular-nums">
          {format(p50)} <span className="text-xl font-semibold">g/L</span>
        </p>
        <p className="mt-2 text-sm text-on-surface-muted">
          Estimation · entre {format(p5)} et {format(p95)} g/L
        </p>
      </div>
    </section>
  );
}
