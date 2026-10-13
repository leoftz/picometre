import { describe, expect, it } from "vitest";
import { defaultPartyStart, fromParisInput, parisOffsetMinutes, toParisInput } from "../time";

describe("Paris wall-clock times", () => {
  it("knows winter and summer time", () => {
    expect(parisOffsetMinutes(new Date("2026-01-15T12:00:00Z"))).toBe(60);
    expect(parisOffsetMinutes(new Date("2026-07-15T12:00:00Z"))).toBe(120);
  });

  it("converts both ways, around the October change too", () => {
    for (const local of ["2026-10-17T20:00", "2026-10-25T23:30", "2026-03-29T03:30", "2026-12-31T23:59"]) {
      expect(toParisInput(fromParisInput(local)!)).toBe(local);
    }
    expect(fromParisInput("2026-10-17T20:00")!.toISOString()).toBe("2026-10-17T18:00:00.000Z");
    expect(fromParisInput("2026-12-17T20:00")!.toISOString()).toBe("2026-12-17T19:00:00.000Z");
  });

  it("rejects malformed input", () => {
    expect(fromParisInput("17/10/2026 20:00")).toBeNull();
  });

  it("defaults a party to 20:00 tonight, or the next hour when later", () => {
    expect(toParisInput(defaultPartyStart(new Date("2026-10-13T10:00:00Z")))).toBe("2026-10-13T20:00");
    expect(toParisInput(defaultPartyStart(new Date("2026-10-13T19:30:00Z")))).toBe("2026-10-13T22:00");
  });
});
