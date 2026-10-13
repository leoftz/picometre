// Trophies (E13): awarded when the host ends the party, private unless the gauge is shared — LOCAL stack only.
import { expect, test, type Page } from "@playwright/test";
import { createAccount } from "./support/account";

async function chooseObjective(page: Page) {
  await page.getByRole("radio", { name: /Soirée festive/ }).check();
  await page.getByText("Rien mangé").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("C'est noté.")).toBeVisible();
}

test("ending a party awards trophies, and the group sees those of people who share", async ({ page, browser }) => {
  test.slow(); // two accounts and two browsers
  const alix = await createAccount(page);
  const bContext = await browser.newContext();
  const b = await bContext.newPage();
  const bao = await createAccount(b);

  await test.step("friends, a party, and both share their gauge", async () => {
    await b.getByRole("link", { name: /^Mes amis/ }).click();
    await b.getByLabel("Ajouter par pseudo").fill(alix);
    await b.getByRole("button", { name: "Envoyer la demande" }).click();
    await page.getByRole("link", { name: /^Mes amis/ }).click();
    await page.getByRole("region", { name: "Demandes reçues" }).getByRole("button", { name: "Accepter" }).click();

    await page.goto("/accueil");
    await page.getByRole("link", { name: "Créer une soirée" }).click();
    await page.getByLabel("Nom de la soirée").fill("Pique-nique");
    await page.getByRole("button", { name: "Créer la soirée" }).click();
    await chooseObjective(page);
    await page.getByRole("button", { name: "Partager ma jauge avec le groupe" }).click();
    await page.getByText("Inviter des amis").click();
    await page.getByRole("checkbox", { name: bao }).check();
    await page.getByRole("button", { name: "Envoyer les invitations" }).click();

    await b.goto("/accueil");
    await b.getByRole("region", { name: "Invitations" }).getByRole("link", { name: /Pique-nique/ }).click();
    await b.getByRole("button", { name: "Accepter" }).click();
    await chooseObjective(b);
    await b.getByRole("button", { name: "Partager ma jauge avec le groupe" }).click();
    await expect(b.getByText("Ta jauge est partagée avec le groupe")).toBeVisible();
  });

  await test.step("both open their gauge (it publishes their level); A takes two water jokers", async () => {
    await b.getByRole("link", { name: "Ouvrir ma jauge" }).click();
    await expect(b.getByRole("list", { name: "Jauges du groupe" }).getByRole("listitem").filter({ hasText: bao })).toContainText("Frais");
    await page.getByRole("link", { name: "Ouvrir ma jauge" }).click();
    await expect(page.getByRole("list", { name: "Jauges du groupe" }).getByRole("listitem").filter({ hasText: alix })).toContainText("Frais");
    for (let i = 1; i <= 2; i++) {
      await page.getByRole("button", { name: "Joker eau" }).click();
      await expect(page.getByRole("listitem").filter({ hasText: "Eau" })).toHaveCount(i);
    }
  });

  await test.step("no trophy before the end", async () => {
    await page.goto(page.url().replace(/\/jauge$/, "/bilan"));
    await expect(page.getByText("Les trophées arrivent quand l'hôte termine la soirée.")).toBeVisible();
  });

  await test.step("A ends the party and gets their trophies", async () => {
    await page.goto(page.url().replace(/\/bilan$/, ""));
    await page.getByText("Terminer la soirée", { exact: true }).click();
    await page.getByRole("button", { name: "Oui, terminer la soirée" }).click();
    const mine = page.getByRole("list", { name: "Mes trophées" });
    // Atterrissage parfait is claimed by the device once the estimate is done.
    await expect(mine.getByText("Atterrissage parfait")).toBeVisible({ timeout: 15_000 });
    await expect(mine.getByText("As du joker eau")).toBeVisible();
    // Both stayed at level 1: tied for the lowest gauge.
    await expect(mine.getByText("Capitaine de soirée")).toBeVisible();
    await expect(page.getByRole("list", { name: "Trophées du groupe" }).getByRole("listitem").filter({ hasText: bao })).toContainText("Capitaine de soirée");
  });

  await test.step("once A stops sharing, B no longer sees A's trophies", async () => {
    await b.goto(b.url().replace(/\/jauge$/, "/bilan"));
    await expect(b.getByRole("list", { name: "Trophées du groupe" }).getByRole("listitem").filter({ hasText: alix })).toContainText("As du joker eau");
    await page.goto(page.url().replace(/\/bilan$/, "/jauge"));
    await page.getByRole("button", { name: "Arrêter le partage" }).filter({ visible: true }).click();
    await expect(page.getByText("Ta jauge est privée").filter({ visible: true })).toBeVisible();
    await b.reload();
    await expect(b.getByRole("list", { name: "Mes trophées" }).getByText("Capitaine de soirée")).toBeVisible();
    await expect(b.getByRole("list", { name: "Trophées du groupe" })).toHaveCount(0);
  });

  await bContext.close();
});
