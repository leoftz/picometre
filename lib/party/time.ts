// Wall-clock times are always Paris time (French app), on the server (UTC) and on the device alike,
// so rendering is identical on both sides and no time zone is guessed.

export const TIME_ZONE = "Europe/Paris";

/** Paris UTC offset (minutes) at a given instant (+60 in winter, +120 in summer). */
export function parisOffsetMinutes(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const wall = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!);
  return Math.round((wall - at.getTime()) / 60_000);
}

/** `YYYY-MM-DDTHH:mm` (datetime-local value) of an instant, in Paris time. */
export function toParisInput(at: Date): string {
  const wall = new Date(at.getTime() + parisOffsetMinutes(at) * 60_000);
  return wall.toISOString().slice(0, 16);
}

/** Instant of a Paris `YYYY-MM-DDTHH:mm` wall-clock time (handles summer/winter time). */
export function fromParisInput(local: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes: the offset depends on the instant itself around DST changes.
  let instant = asUtc - parisOffsetMinutes(new Date(asUtc)) * 60_000;
  instant = asUtc - parisOffsetMinutes(new Date(instant)) * 60_000;
  return new Date(instant);
}

/** Default party start: 20:00 tonight, Paris time, or the next full hour if it is already later. */
export function defaultPartyStart(now: Date): Date {
  const wall = new Date(now.getTime() + parisOffsetMinutes(now) * 60_000);
  const hour = Math.max(wall.getUTCHours() + 1, 20);
  const local = `${wall.toISOString().slice(0, 10)}T${String(Math.min(hour, 23)).padStart(2, "0")}:00`;
  return fromParisInput(local)!;
}
