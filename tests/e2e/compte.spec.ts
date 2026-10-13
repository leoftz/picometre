// Critical path « inscription » (cahier des charges) and GDPR rights, against the LOCAL Supabase stack only.
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { chooseAvatar, signIn, uniqueEmail } from "./support/account";

test("a signed-out visitor is sent to the sign-in page", async ({ page, request }) => {
  await page.goto("/accueil");
  await expect(page).toHaveURL(/\/connexion$/);
  expect((await request.get("/compte/export")).status()).toBe(401);
});

test("sign-up: consents, 18+ check, character, export, consent withdrawal and account deletion", async ({ page }) => {
  const email = uniqueEmail();
  const pseudo = `e2e${Date.now().toString(36)}`;

  await test.step("magic link", async () => {
    await signIn(page, email);
    await expect(page).toHaveURL(/\/bienvenue\/consentements$/);
  });

  await test.step("explicit consents, never pre-checked", async () => {
    const terms = page.getByRole("checkbox", { name: /conditions d'utilisation/ });
    const health = page.getByRole("checkbox", { name: /estimer ma jauge/ });
    await expect(terms).not.toBeChecked();
    await expect(health).not.toBeChecked();
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Coche cette case pour continuer.")).toBeVisible();
    await terms.check();
    await health.check();
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page).toHaveURL(/\/bienvenue\/personnage$/);
  });

  await test.step("a minor birth date is refused", async () => {
    await page.getByLabel("Ton pseudo").fill(pseudo);
    await chooseAvatar(page, "Citron");
    await page.getByLabel("Ta date de naissance").fill("2010-06-01");
    await page.getByLabel("Homme").check();
    await page.getByLabel("Taille (cm)").fill("180");
    await page.getByLabel("Poids (kg)").fill("80");
    await page.getByRole("radio", { name: /Régulier/ }).check();
    await page.getByRole("button", { name: "Créer mon personnage" }).click();
    await expect(page.getByText("Picomètre est réservé aux 18 ans et plus.")).toBeVisible();
  });

  await test.step("an adult creates the character", async () => {
    await chooseAvatar(page, "Citron");
    await page.getByLabel("Ta date de naissance").fill("1995-05-12");
    await page.getByLabel("Homme").check();
    await page.getByRole("radio", { name: /Régulier/ }).check();
    await page.getByRole("button", { name: "Créer mon personnage" }).click();
    await expect(page).toHaveURL(/\/accueil$/);
    await expect(page.getByRole("heading", { name: `Salut ${pseudo}` })).toBeVisible();
  });

  await test.step("export contains my data, and only the birth year", async () => {
    await page.getByRole("link", { name: "Réglages et données" }).click();
    const downloading = page.waitForEvent("download");
    await page.getByRole("link", { name: "Exporter mes données" }).click();
    const file = await (await downloading).path();
    const data = JSON.parse(await readFile(file, "utf8"));
    expect(data.account.email).toBe(email);
    expect(data.profile).toMatchObject({ pseudo, avatar: "citron", birth_year: 1995 });
    expect(data.health_data).toMatchObject({ sex: "m", height_cm: 180, weight_kg: 80, habit: "regulier" });
    expect(JSON.stringify(data)).not.toContain("1995-05-12");
    expect(data.consents.map((c: { kind: string }) => c.kind).sort()).toEqual(["cgu", "health_data"]);
  });

  await test.step("withdrawing the health consent erases the health data", async () => {
    await expect(page.getByText("80 kg")).toBeVisible();
    await page.getByRole("button", { name: "Retirer mon accord pour les données de santé" }).click();
    await expect(page.getByText("tes données de santé sont effacées")).toBeVisible();
    await expect(page.getByText("80 kg")).toHaveCount(0);
  });

  await test.step("account deletion needs a confirmation, then erases everything", async () => {
    await page.getByRole("button", { name: "Supprimer mon compte et mes données" }).click();
    await expect(page.getByText("Coche la case pour confirmer la suppression.")).toBeVisible();
    await page.getByRole("checkbox", { name: /sans retour possible/ }).check();
    await page.getByRole("button", { name: "Supprimer mon compte et mes données" }).click();
    await expect(page.getByText("Ton compte et toutes tes données sont supprimés.")).toBeVisible();
  });

  await test.step("signing in again starts from scratch", async () => {
    await signIn(page, email);
    await expect(page).toHaveURL(/\/bienvenue\/consentements$/);
  });
});
