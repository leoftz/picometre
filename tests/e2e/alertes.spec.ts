// Critical path « alerte » (cahier des charges) and the end-of-party summary, on the LOCAL stack only.
import { expect, test, type Page } from "@playwright/test";
import { createAccount } from "./support/account";

async function partyWith(page: Page, objective: RegExp) {
  await page.getByRole("link", { name: "Créer une soirée" }).click();
  await page.getByLabel("Nom de la soirée").fill("Anniv");
  await page.getByRole("button", { name: "Créer la soirée" }).click();
  await page.getByText("Ajouter une boisson").click();
  await page.getByLabel("Boisson", { exact: true }).selectOption("biere-blonde");
  await page.getByRole("button", { name: "Ajouter cette boisson" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Bière blonde" })).toBeVisible();
  await page.getByRole("radio", { name: objective }).check();
  await page.getByText("Rien mangé").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("C'est noté.")).toBeVisible();
  await page.getByRole("link", { name: "Ouvrir ma jauge" }).click();
}

async function drinkPints(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await page.getByRole("button", { name: "Bière blonde", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: /Pinte/ }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Bière blonde" })).toHaveCount(i + 1);
  }
}

test("« Zéro gueule de bois »: the objective closes after two standard drinks", async ({ page }) => {
  await createAccount(page);
  await partyWith(page, /Zéro gueule de bois/);
  await drinkPints(page, 1);
  await expect(page.getByRole("status").filter({ hasText: "Objectif atteint" })).toBeVisible();
  await expect(page.getByText("Place au joker eau.")).toBeVisible();
});

test("« Stop pour ce soir », then the end of the party and the summary", async ({ page }) => {
  await createAccount(page);
  await partyWith(page, /Soirée festive/);

  await test.step("several pints at once: the Stop is announced and alcohol is no longer offered", async () => {
    await drinkPints(page, 4);
    await expect(page.getByRole("alert").filter({ hasText: "Stop pour ce soir" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bière blonde", exact: true })).toBeHidden();
    await expect(page.getByText("Noter quand même un verre d'alcool")).toBeVisible();
    await expect(page.getByRole("button", { name: "Joker eau" })).toBeVisible();
  });

  await test.step("the host ends the party and sees the summary with the fixed message", async () => {
    await page.getByRole("link", { name: "← Anniv" }).click();
    await page.getByText("Terminer la soirée", { exact: true }).click();
    await page.getByRole("button", { name: "Oui, terminer la soirée" }).click();
    await expect(page.getByRole("heading", { name: "Mon bilan" })).toBeVisible();
    await expect(page.getByText("Retour estimé à 0 g/L")).toBeVisible();
    await expect(page.getByText(/4 verres d'alcool notés/)).toBeVisible();
    await expect(page.getByText("Objectif dépassé ce soir")).toBeVisible();
    // Next.js keeps the previous screen (which shows it too) hidden in the DOM: target the visible one.
    await expect(page.getByText("La jauge estime, l'éthylotest décide. Si tu as bu, tu ne conduis pas.").filter({ visible: true })).toBeVisible();
  });
});
