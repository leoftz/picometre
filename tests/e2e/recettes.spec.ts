// Recipe library (lot 11): only while preparing the party, each cocktail with its alcohol-free version.
import { expect, test } from "@playwright/test";
import { createAccount } from "./support/account";

test("pick recipes while preparing the party; the library closes once the party is under way", async ({ page }) => {
  await createAccount(page);
  await page.getByRole("link", { name: "Créer une soirée" }).click();
  await page.getByLabel("Nom de la soirée").fill("Apéro d'été");
  await page.getByRole("button", { name: "Créer la soirée" }).click();

  await test.step("a cocktail, then an alcohol-free recipe", async () => {
    await page.getByText("Idées de recettes").click();
    const library = page.getByRole("region", { name: "Cocktails" });
    const mojito = library.getByRole("listitem").filter({ hasText: /^Mojito/ });
    await expect(mojito).toContainText("rhum blanc 5 cl");
    await expect(mojito).toContainText("Sans alcool : Virgin mojito");
    await mojito.getByRole("button", { name: "Ajouter Mojito" }).click();
    const planned = page.getByRole("list", { name: "Liste des boissons prévues" });
    await expect(planned.getByRole("listitem").filter({ hasText: "Mojito" })).toContainText("15,8 g, ≈ 1,6 verre standard · à l'œil");

    const alcoholFree = page.getByRole("region", { name: "Sans alcool" });
    if (!(await alcoholFree.isVisible())) await page.getByText("Idées de recettes").click();
    await alcoholFree.getByRole("button", { name: "Ajouter Virgin colada" }).click();
    await expect(planned.getByRole("listitem").filter({ hasText: "Virgin colada" })).toContainText("sans alcool");
  });

  await test.step("the alcohol-free recipe is entered like any drink, in green", async () => {
    await page.getByRole("radio", { name: /Soirée festive/ }).check();
    await page.getByText("Rien mangé").click();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("C'est noté.")).toBeVisible();
    await page.getByRole("link", { name: "Ouvrir ma jauge" }).click();
    await page.getByRole("button", { name: /^Virgin colada/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^1 verre/ }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Virgin colada" })).toContainText("sans alcool");
  });

  await test.step("once a drink is entered, no more recipe ideas", async () => {
    await page.getByRole("link", { name: /^← Apéro d'été/ }).click();
    await expect(page.getByRole("heading", { name: "Apéro d'été" })).toBeVisible();
    await expect(page.getByText("Idées de recettes")).toHaveCount(0);
  });
});
