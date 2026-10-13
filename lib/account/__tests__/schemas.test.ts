import { describe, expect, it } from "vitest";
import { characterSchema, emailSchema, fieldErrors, isAdult } from "../schemas";

const today = new Date(2026, 9, 13); // 13 October 2026

describe("isAdult — 18 and over only (charte §9.6)", () => {
  it.each([
    ["2008-10-13", true], // 18 today
    ["2008-10-14", false], // 18 tomorrow
    ["2008-12-31", false], // same birth year, still 17: why the full date is checked
    ["1990-01-01", true],
    ["2012-05-05", false],
  ])("born %s → adult: %s", (birthDate, expected) => {
    expect(isAdult(birthDate, today)).toBe(expected);
  });
});

describe("characterSchema", () => {
  const valid = {
    pseudo: "leo_76",
    avatar: "citron",
    birthDate: "1995-05-12",
    sex: "m",
    heightCm: "180",
    weightKg: "80.25",
    habit: "regulier",
  };
  const parse = (overrides: Record<string, string>) => characterSchema(today).safeParse({ ...valid, ...overrides });

  it("accepts a valid character and rounds the weight to 0.1 kg", () => {
    const result = parse({});
    expect(result.success && result.data).toMatchObject({ heightCm: 180, weightKg: 80.3 });
  });

  it.each([
    ["pseudo", "ab", "Ton pseudo doit faire au moins 3 caractères."],
    ["pseudo", "léo", "Lettres sans accent, chiffres, point, tiret ou tiret bas uniquement."],
    ["birthDate", "2010-01-01", "Picomètre est réservé aux 18 ans et plus."],
    ["birthDate", "", "Indique ta date de naissance."],
    ["heightCm", "100", "La taille doit être comprise entre 130 et 230 cm."],
    ["weightKg", "300", "Le poids doit être compris entre 35 et 250 kg."],
    ["avatar", "licorne", "Choisis un avatar."],
    ["habit", "", "Indique tes habitudes de consommation."],
  ])("rejects %s = %j with a clear French message", (field, value, message) => {
    const result = parse({ [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)[field]).toBe(message);
  });

  it("matches the database limits (profiles and profile_health checks)", () => {
    expect(parse({ heightCm: "130" }).success).toBe(true);
    expect(parse({ heightCm: "230" }).success).toBe(true);
    expect(parse({ weightKg: "35" }).success).toBe(true);
    expect(parse({ weightKg: "250" }).success).toBe(true);
    expect(parse({ pseudo: "a".repeat(20) }).success).toBe(true);
    expect(parse({ pseudo: "a".repeat(21) }).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("normalises the address", () => {
    expect(emailSchema.parse({ email: "  Leo@Example.COM " }).email).toBe("leo@example.com");
  });
});
