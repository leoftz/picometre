import { LEVEL_FLOORS_G_PER_L } from "@/config/objectifs";
import type { CurvePoint } from "@/lib/bac/types";
import { gaugeLevels } from "@/lib/brand/tokens";
import { formatTime } from "@/lib/party/format";

const W = 340;
const H = 190;
const PAD = { left: 30, right: 8, top: 10, bottom: 24 };
const HOUR = 3_600_000;

/**
 * Estimated curve: 90 % range as a band (P-35), median as a line, a « maintenant » marker.
 * Horizontal guides are the gauge levels (charte §5), never driving limits (parametres-scientifiques N-6).
 */
export function BacCurve({ curve, now }: { curve: CurvePoint[]; now: number }) {
  // Show from the first drink until the high end of the range is back to zero (or 2 h ahead at least).
  const first = curve.find((p) => p.p95 > 0.005)?.t ?? now;
  const lastHigh = [...curve].reverse().find((p) => p.p95 > 0.01)?.t ?? now;
  const start = Math.min(first, now) - 15 * 60_000;
  const end = Math.max(lastHigh, now + 2 * HOUR);
  const points = curve.filter((p) => p.t >= start && p.t <= end);
  const yMax = Math.max(0.9, ...points.map((p) => p.p95)) * 1.05;

  const x = (t: number) => PAD.left + ((t - start) / (end - start)) * (W - PAD.left - PAD.right);
  const y = (c: number) => PAD.top + (1 - c / yMax) * (H - PAD.top - PAD.bottom);
  const line = (key: "p5" | "p50" | "p95") => points.map((p) => `${x(p.t).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const band = `${line("p95")} ${[...points].reverse().map((p) => `${x(p.t).toFixed(1)},${y(p.p5).toFixed(1)}`).join(" ")}`;

  const ticks: number[] = [];
  for (let t = Math.ceil(start / HOUR) * HOUR; t <= end; t += HOUR * Math.max(1, Math.round((end - start) / HOUR / 5))) ticks.push(t);
  const peak = points.reduce((best, p) => (p.p50 > best.p50 ? p : best), points[0] ?? { t: now, p50: 0 });

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Courbe estimée. Pic médian vers ${formatTime(peak.t)}. La bande montre la fourchette de l'estimation.`}
      >
        {([2, 3, 4] as const).map((level) => (
          <g key={level}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(LEVEL_FLOORS_G_PER_L[level])} y2={y(LEVEL_FLOORS_G_PER_L[level])} stroke={gaugeLevels[level].color} strokeOpacity={0.6} strokeDasharray="4 4" />
            <text x={PAD.left - 4} y={y(LEVEL_FLOORS_G_PER_L[level]) + 4} textAnchor="end" fontSize={10} fill="#BBB7BA">
              {LEVEL_FLOORS_G_PER_L[level].toLocaleString("fr-FR")}
            </text>
          </g>
        ))}
        <polygon points={band} fill="#FFF8F0" fillOpacity={0.14} />
        <polyline points={line("p50")} fill="none" stroke="#FFD23F" strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={x(now)} x2={x(now)} y1={PAD.top} y2={H - PAD.bottom} stroke="#FFF8F0" strokeWidth={1.5} />
        <text x={x(now) + 3} y={PAD.top + 9} fontSize={10} fill="#FFF8F0">
          maintenant
        </text>
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize={10} fill="#BBB7BA">
            {formatTime(t)}
          </text>
        ))}
      </svg>
      <figcaption className="text-xs text-on-surface-muted">
        Ligne : estimation centrale · bande : fourchette · pointillés : passage aux niveaux{" "}
        {gaugeLevels[2].name}, {gaugeLevels[3].name} et {gaugeLevels[4].name}.
      </figcaption>
    </figure>
  );
}
