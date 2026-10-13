import { describe, expect, it } from "vitest";
import { libraryOpen } from "../library";

describe("libraryOpen — docs/parametres-scientifiques.md §1.2", () => {
  const preparing = { status: "planned", stopLockedAt: null, drinksEntered: 0 };
  it("is open while preparing the party", () => expect(libraryOpen(preparing)).toBe(true));
  it("closes with the first drink entered", () => expect(libraryOpen({ ...preparing, drinksEntered: 1 })).toBe(false));
  it("closes once the party is ended", () => expect(libraryOpen({ ...preparing, status: "ended" })).toBe(false));
  it("closes after a Stop", () => expect(libraryOpen({ ...preparing, stopLockedAt: "2026-10-17T22:00:00Z" })).toBe(false));
  it("stays closed for an unknown party", () => expect(libraryOpen({ ...preparing, status: undefined })).toBe(false));
});
