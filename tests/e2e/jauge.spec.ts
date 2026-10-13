// Critical path « saisie d'un verre » (cahier des charges), on the LOCAL Supabase stack only.
import { expect, test, type Page } from "@playwright/test";
import { createAccount } from "./support/account";

async function partyWithIpa(page: Page) {
  await page.getByRole("link", { name: "Créer une soirée" }).click();
  await page.getByLabel("Nom de la soirée").fill("Apéro");
  await page.getByRole("button", { name: "Créer la soirée" }).click();
  await page.getByText("Ajouter une boisson").click();
  await page.getByLabel("Boisson", { exact: true }).selectOption("biere-ipa");
  await page.getByRole("button", { name: "Ajouter cette boisson" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Bière IPA" })).toBeVisible();
  await page.getByRole("radio", { name: /Soirée festive/ }).check();
  await page.getByText("Rien mangé").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("C'est noté.")).toBeVisible();
}

test("record a drink in 2 taps and see the estimated gauge with its range", async ({ page }) => {
  await createAccount(page);
  await partyWithIpa(page);
  await page.getByRole("link", { name: "Ouvrir ma jauge" }).click();

  await test.step("before any drink: level 1, estimation written", async () => {
    await expect(page.getByText("Frais comme un gardon")).toBeVisible();
    await expect(page.getByText(/^Estimation · entre/)).toBeVisible();
  });

  await test.step("2 taps: the drink, then the glass", async () => {
    await page.getByRole("button", { name: "Bière IPA", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Bière IPA" });
    await expect(dialog.getByRole("button", { name: /Bouteille ou canette \(33 cl\)/ })).toBeFocused();
    await dialog.getByRole("button", { name: /Pinte \(50 cl\)/ }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Bière IPA" })).toContainText("Pinte (50 cl) · 25,6 g");
    await expect(page.getByRole("meter", { name: "Jauge estimée" })).toHaveAttribute("aria-valuetext", /estimation .* grammes par litre, entre/);
    // Just after drinking the estimate is still low: the coming peak must be shown.
    await expect(page.getByRole("heading", { name: /^À venir : / })).toBeVisible();
  });

  await test.step("undo within 10 seconds", async () => {
    await page.getByRole("button", { name: "Bière IPA", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: /33 cl/ }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Bière IPA" })).toHaveCount(2);
    await page.getByRole("status").getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Bière IPA" })).toHaveCount(1);
  });

  await test.step("joker eau: one tap, always visible", async () => {
    await page.getByRole("button", { name: "Joker eau" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Eau" })).toContainText("sans alcool");
  });

  await test.step("drinks persist after a reload", async () => {
    await page.reload();
    await expect(page.getByRole("listitem").filter({ hasText: "Bière IPA" })).toHaveCount(1);
    await expect(page.getByRole("listitem").filter({ hasText: "Eau" })).toHaveCount(1);
    await expect(page.getByText("La jauge estime, l'éthylotest décide. Si tu as bu, tu ne conduis pas.")).toBeVisible();
  });
});
