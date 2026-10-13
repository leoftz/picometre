// What the group may see of a gauge (PLAN §2, E11): a level, the schedule of its next changes, the Stop.
// Never a value in g/L. Pure: used by the sharing device and by the group view.
import { levelOf } from "@/lib/bac/simulate";
import type { GaugeLevel, SimulationResult } from "@/lib/bac/types";

// A type alias, not an interface, so it fits the database's Json type.
export type ScheduleEntry = {
  at: string;
  level: GaugeLevel;
};

export interface SharedGauge {
  level: GaugeLevel;
  schedule: ScheduleEntry[];
  stopped: boolean;
  /** Highest level reached so far: what « Capitaine de soirée » compares (docs/parametres-scientifiques.md#P-59). */
  peak_level: GaugeLevel;
}

/** Same limit as the database (gauge_shares guard). */
const MAX_ENTRIES = 48;

/**
 * The level now and each later change of the gauge estimate (p75, P-39) if nothing else is drunk,
 * so the group sees the gauge come down even once the device is asleep.
 */
export function shareFrom(result: SimulationResult, now: number): SharedGauge {
  const schedule: ScheduleEntry[] = [];
  let previous = result.level;
  let peak: GaugeLevel = result.level;
  for (const point of result.curve) {
    if (point.t <= now) {
      peak = Math.max(peak, levelOf(point.gauge)) as GaugeLevel;
      continue;
    }
    const level = levelOf(point.gauge);
    if (level !== previous) {
      schedule.push({ at: new Date(point.t).toISOString(), level });
      previous = level;
    }
  }
  // Past the end of the curve the gauge is back to its lowest level.
  if (previous !== 1 && result.curve.length > 0) {
    schedule.push({ at: new Date(result.curve.at(-1)!.t + 5 * 60_000).toISOString(), level: 1 });
  }
  return {
    level: result.level,
    schedule: schedule.slice(0, MAX_ENTRIES),
    stopped: result.stopLocked,
    peak_level: result.stopLocked ? 4 : peak,
  };
}

/** The level a shared gauge shows at `now`, following its schedule. */
export function levelAt(share: Pick<SharedGauge, "level" | "schedule">, now: number): GaugeLevel {
  let level = share.level;
  for (const entry of share.schedule) {
    if (Date.parse(entry.at) <= now) level = entry.level;
    else break;
  }
  return level;
}

/** Whether two shares would show the same thing (avoids publishing every minute for nothing). */
export function sameShare(a: SharedGauge, b: SharedGauge): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
