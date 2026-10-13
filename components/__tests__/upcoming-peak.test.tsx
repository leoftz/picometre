import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { simulate } from "@/lib/bac";
import { UpcomingPeak } from "../upcoming-peak";

const T0 = Date.UTC(2026, 9, 17, 18, 0);
const MIN = 60_000;
const profile = { sex: "f" as const, ageYears: 30, heightCm: 165, weightKg: 55, habit: "occasionnel" as const };
const drinks = [0, 1, 2].map((i) => ({ at: T0 + i * MIN, grams: 12.3, pour: "dose" as const }));
const run = (now: number) => simulate({ profile, intakes: drinks, meals: [], objective: "festive", now, seed: "t" });

describe("UpcomingPeak", () => {
  it("warns right after drinking, while the current estimate is still low", () => {
    const now = T0 + 3 * MIN;
    const result = run(now);
    expect(result.level).toBe(1);
    render(<UpcomingPeak result={result} now={now} />);
    expect(screen.getByRole("heading", { name: /^À venir : / })).toBeTruthy();
    expect(screen.getByText(/Pic estimé vers/)).toBeTruthy();
  });

  it("disappears once the peak is behind", () => {
    const now = T0 + 4 * 60 * MIN;
    const { container } = render(<UpcomingPeak result={run(now)} now={now} />);
    expect(container.textContent).toBe("");
  });
});
