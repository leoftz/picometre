// Critical path « création de soirée » (cahier des charges), on the LOCAL Supabase stack only.
import { expect, test } from "@playwright/test";
import { createAccount } from "./support/account";

test("create a party, plan drinks and a cocktail, set my objective and meal", async ({ page, browser }) => {
  await createAccount(page);
  let partyUrl = "";

  await test.step("create the party", async () => {
    await page.getByRole("link", { name: "Créer une soirée" }).click();
    await page.getByLabel("Nom de la soirée").fill("Crémaillère");
    await page.getByLabel("Lieu (facultatif)").fill("Chez Sam");
    await page.getByRole("button", { name: "Créer la soirée" }).click();
    await expect(page.getByRole("heading", { name: "Crémaillère" })).toBeVisible();
    await expect(page.getByText(/Chez Sam/)).toBeVisible();
    partyUrl = page.url();
  });

  await test.step("plan a pint of IPA from the bank, with its ABV kept in range", async () => {
    await page.getByText("Ajouter une boisson").click();
    await page.getByLabel("Boisson", { exact: true }).selectOption("biere-ipa");
    await page.getByLabel("Degré (%)").fill("12");
    await page.getByRole("button", { name: "Ajouter cette boisson" }).click();
    await expect(page.getByText("Pour ce type, le degré va de 5,5 % à 7,5 %.")).toBeVisible();
    await page.getByLabel("Degré (%)").fill("6.5");
    await page.getByLabel("Verre", { exact: true }).selectOption("pinte");
    await expect(page.getByText("Un verre : ≈ 2,6 verres standard.")).toBeVisible();
    await page.getByRole("button", { name: "Ajouter cette boisson" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Bière IPA" })).toContainText("Pinte (50 cl) · 6,5 % · 25,6 g");
  });

  await test.step("plan water too", async () => {
    await page.getByLabel("Boisson", { exact: true }).selectOption("eau");
    await page.getByRole("button", { name: "Ajouter cette boisson" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Eau" })).toContainText("sans alcool");
  });

  await test.step("build a cocktail: grams are summed from the recipe (P-03)", async () => {
    await page.getByText("Ajouter un cocktail").click();
    await page.getByLabel("Nom du cocktail").fill("Margarita maison");
    await page.getByRole("button", { name: "Ajouter un alcool" }).click();
    await page.getByLabel("Alcool 1", { exact: true }).selectOption("spiritueux");
    await page.getByRole("textbox", { name: "cl" }).first().fill("5");
    await page.getByLabel("Alcool 2", { exact: true }).selectOption("liqueur");
    await page.getByRole("textbox", { name: "cl" }).nth(1).fill("2");
    await page.getByRole("textbox", { name: "%" }).nth(1).fill("30");
    await expect(page.getByText("Un verre : ≈ 2,1 verres standard.")).toBeVisible();
    await page.getByRole("button", { name: "Ajouter ce cocktail" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Margarita maison" })).toContainText("2 alcools · 20,5 g");
  });

  await test.step("set my objective and meal", async () => {
    await page.getByRole("radio", { name: /Zéro gueule de bois/ }).check();
    await page.getByText("Un vrai repas").click();
    await expect(page.getByLabel("À quelle heure ?")).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("C'est noté.")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Un vrai repas" })).toBeChecked();
    await page.reload();
    await expect(page.getByRole("radio", { name: /Zéro gueule de bois/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Un vrai repas" })).toBeChecked();
  });

  await test.step("another user cannot open the party", async () => {
    const context = await browser.newContext();
    const stranger = await context.newPage();
    await createAccount(stranger);
    await stranger.goto(partyUrl);
    await expect(stranger.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(stranger.getByText("Crémaillère")).toHaveCount(0);
    await context.close();
  });

  await test.step("the host deletes the party", async () => {
    await page.getByRole("button", { name: "Supprimer la soirée" }).click();
    await expect(page).toHaveURL(/\/accueil$/);
    await expect(page.getByText("Aucune soirée prévue.")).toBeVisible();
  });
});
