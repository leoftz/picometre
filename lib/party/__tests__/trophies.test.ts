// The trophy rules live in config/objectifs.ts and in the SQL that awards them: both must agree.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OBJECTIVES, TROPHIES } from "@/config/objectifs";
import { TROPHY_COPY } from "../trophies";

const file = readdirSync("supabase/migrations").find((f) => f.endsWith("_trophies.sql"))!;
const sql = readFileSync(`supabase/migrations/${file}`, "utf8");

describe("trophy rules — docs/parametres-scientifiques.md#P-58, #P-59", () => {
  it("« As du joker eau » uses the configured thresholds", () => {
    expect(sql).toContain(`n.water >= ${TROPHIES.jokerEauMinWater} and n.water * ${TROPHIES.jokerEauAlcoholPerWater} >= n.alcoholic`);
  });

  it("« Capitaine de soirée » needs the configured number of people sharing", () => {
    expect(sql).toContain(`if sharers >= ${TROPHIES.capitaineMinSharers} then`);
  });

  it("« Atterrissage parfait » checks the cap of « Zéro gueule de bois »", () => {
    expect(sql).toContain(`mine.objective = 'zero_gdb' and total > ${OBJECTIVES.zero_gdb.capGrams}`);
  });
});

describe("trophy wording — charte §9 and §12", () => {
  it.each(Object.entries(TROPHY_COPY))("%s never praises a quantity of alcohol and stays neutral", (_, copy) => {
    const text = `${copy.title} ${copy.body}`;
    expect(text).not.toMatch(/\b(roi|reine|champion|record|cul sec|descente|le plus bu)\b/i);
    expect(text.split(/[.!?]/).every((sentence) => sentence.trim().split(/\s+/).length <= 20)).toBe(true);
  });
});
