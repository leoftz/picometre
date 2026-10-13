import type { GaugeLevel } from "@/lib/brand/tokens";

/** Charte §7 icons: 2 px rounded stroke. Paired with a text label, never alone. */
export function GaugeIcon({ level, size = 28, color = "currentColor" }: { level: GaugeLevel; size?: number; color?: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {level === 1 ? <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" {...common} /> : null}
      {level === 2 ? (
        <g {...common}>
          <circle cx="8" cy="15" r="3" />
          <circle cx="15" cy="9" r="4" />
          <circle cx="17" cy="18" r="2" />
        </g>
      ) : null}
      {level === 3 ? <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3 0-6 1-8.5z" {...common} /> : null}
      {level === 4 ? (
        <g {...common}>
          <path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-.5A5.5 5.5 0 0 1 5 13.5V11a1.5 1.5 0 0 1 3 0" />
        </g>
      ) : null}
    </svg>
  );
}
