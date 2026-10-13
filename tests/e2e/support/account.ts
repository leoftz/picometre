import { expect, type Page } from "@playwright/test";
import { magicLinkFor } from "./mailpit";

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
}

export async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.getByRole("link", { name: "Oui, j'ai 18 ans ou plus" }).click();
  await page.getByLabel("Ton adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
  await expect(page.getByText("Regarde ta boîte mail")).toBeVisible();
  await page.goto(await magicLinkFor(email));
}

/** Avatars are visually hidden radios inside a picture label: pick them like a user would, by tapping the label. */
export async function chooseAvatar(page: Page, name: string) {
  await page.locator("label", { hasText: name }).first().click();
  await expect(page.getByRole("radio", { name })).toBeChecked();
}

/** Signs up a fresh adult user through the real flow and lands on /accueil. */
export async function createAccount(page: Page, pseudo = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`) {
  await signIn(page, uniqueEmail());
  await page.getByRole("checkbox", { name: /conditions d'utilisation/ }).check();
  await page.getByRole("checkbox", { name: /estimer ma jauge/ }).check();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByLabel("Ton pseudo").fill(pseudo);
  await chooseAvatar(page, "Menthe");
  await page.getByLabel("Ta date de naissance").fill("1994-02-20");
  await page.getByLabel("Femme").check();
  await page.getByLabel("Taille (cm)").fill("168");
  await page.getByLabel("Poids (kg)").fill("62");
  await page.getByRole("radio", { name: /Occasionnel/ }).check();
  await page.getByRole("button", { name: "Créer mon personnage" }).click();
  await expect(page).toHaveURL(/\/accueil$/);
  return pseudo;
}
