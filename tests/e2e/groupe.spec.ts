// Group view (E11): per-party consent, live levels only, immediate revocation — LOCAL stack only.
import { expect, test, type Page } from "@playwright/test";
import { createAccount } from "./support/account";

async function chooseObjective(page: Page) {
  await page.getByRole("radio", { name: /Soirée festive/ }).check();
  await page.getByText("Rien mangé").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("C'est noté.")).toBeVisible();
}

test("a guest shares their level with the group, live, and stops sharing at once", async ({ page, browser }) => {
  test.slow(); // two accounts and two browsers
  const alix = await createAccount(page);
  const bContext = await browser.newContext();
  const b = await bContext.newPage();
  const bao = await createAccount(b);

  await test.step("B and A become friends, A invites B", async () => {
    await b.getByRole("link", { name: /^Mes amis/ }).click();
    await b.getByLabel("Ajouter par pseudo").fill(alix);
    await b.getByRole("button", { name: "Envoyer la demande" }).click();
    await page.getByRole("link", { name: /^Mes amis/ }).click();
    await page.getByRole("region", { name: "Demandes reçues" }).getByRole("button", { name: "Accepter" }).click();

    await page.goto("/accueil");
    await page.getByRole("link", { name: "Créer une soirée" }).click();
    await page.getByLabel("Nom de la soirée").fill("Crémaillère");
    await page.getByRole("button", { name: "Créer la soirée" }).click();
    await chooseObjective(page);
    await page.getByText("Inviter des amis").click();
    await page.getByRole("checkbox", { name: bao }).check();
    await page.getByRole("button", { name: "Envoyer les invitations" }).click();

    await b.goto("/accueil");
    await b.getByRole("region", { name: "Invitations" }).getByRole("link", { name: /Crémaillère/ }).click();
    await b.getByRole("button", { name: "Accepter" }).click();
    await chooseObjective(b);
  });

  const group = page.getByRole("list", { name: "Jauges du groupe" });

  await test.step("nothing is shared by default", async () => {
    await page.getByRole("link", { name: "Ouvrir ma jauge" }).click();
    await expect(page.getByRole("heading", { name: "Ma jauge", level: 1 })).toBeVisible();
    await expect(group.getByRole("listitem").filter({ hasText: bao })).toContainText("Jauge privée");
    await expect(page.getByText("Ta jauge est privée").filter({ visible: true })).toBeVisible();
  });

  await test.step("B consents when joining: A sees B's level live, without reloading, and never a value in g/L", async () => {
    await b.getByRole("button", { name: "Partager ma jauge avec le groupe" }).click();
    await expect(b.getByText("Ta jauge est partagée avec le groupe")).toBeVisible();
    await b.getByRole("link", { name: "Ouvrir ma jauge" }).click();
    await expect(b.getByRole("heading", { name: "Ma jauge", level: 1 })).toBeVisible();
    await expect(b.getByRole("list", { name: "Jauges du groupe" }).getByRole("listitem").filter({ hasText: bao })).toContainText("Frais comme un gardon");
    const row = group.getByRole("listitem").filter({ hasText: bao });
    await expect(row).toContainText("Frais comme un gardon");
    await expect(row).toContainText("Mis à jour à");
    await expect(group).not.toContainText("g/L");
  });

  await test.step("B stops sharing: it disappears from A's screen at once", async () => {
    await b.getByRole("button", { name: "Arrêter le partage" }).filter({ visible: true }).click();
    await expect(b.getByText("Ta jauge est privée").filter({ visible: true })).toBeVisible();
    await expect(group.getByRole("listitem").filter({ hasText: bao })).toContainText("Jauge privée");
  });

  await bContext.close();
});

test("the host invites friends while creating the party and follows their gauge all evening", async ({ page, browser }) => {
  test.slow(); // two accounts and two browsers
  const alix = await createAccount(page);
  const bContext = await browser.newContext();
  const b = await bContext.newPage();
  const bao = await createAccount(b);

  await test.step("B and A become friends", async () => {
    await b.getByRole("link", { name: /^Mes amis/ }).click();
    await b.getByLabel("Ajouter par pseudo").fill(alix);
    await b.getByRole("button", { name: "Envoyer la demande" }).click();
    await page.getByRole("link", { name: /^Mes amis/ }).click();
    await page.getByRole("region", { name: "Demandes reçues" }).getByRole("button", { name: "Accepter" }).click();
  });

  await test.step("A invites B and shares their own gauge right from the creation form", async () => {
    await page.goto("/accueil");
    await page.getByRole("link", { name: "Créer une soirée" }).click();
    await page.getByLabel("Nom de la soirée").fill("Raclette");
    await expect(page.getByRole("checkbox", { name: "Partager ma jauge avec le groupe" })).not.toBeChecked();
    await page.getByRole("checkbox", { name: bao }).check();
    await page.getByRole("checkbox", { name: "Partager ma jauge avec le groupe" }).check();
    await page.getByRole("button", { name: "Créer la soirée" }).click();
    await expect(page.getByRole("heading", { name: "Raclette" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: bao })).toContainText("Invitation envoyée");
    await expect(page.getByText("Ta jauge est partagée avec le groupe")).toBeVisible();
    await page.getByText("Ajouter une boisson").click();
    await page.getByLabel("Boisson", { exact: true }).selectOption("biere-ipa");
    await page.getByRole("button", { name: "Ajouter cette boisson" }).click();
    await chooseObjective(page);
  });

  await test.step("B accepts and consents to share in the same step", async () => {
    await b.goto("/accueil");
    await b.getByRole("region", { name: "Invitations" }).getByRole("link", { name: /Raclette/ }).click();
    await b.getByRole("checkbox", { name: "Partager ma jauge avec le groupe" }).check();
    await b.getByRole("button", { name: "Accepter" }).click();
    await expect(b.getByText("Ta jauge est partagée avec le groupe")).toBeVisible();
    await chooseObjective(b);
    await b.getByRole("link", { name: "Ouvrir ma jauge" }).click();
    await expect(b.getByRole("heading", { name: "Ma jauge", level: 1 })).toBeVisible();
  });

  await test.step("A follows B's level live, and B sees A's", async () => {
    await page.getByRole("link", { name: "Ouvrir ma jauge" }).click();
    const group = page.getByRole("list", { name: "Jauges du groupe" });
    await expect(group.getByRole("listitem").filter({ hasText: bao })).toContainText("Frais comme un gardon");
    await expect(b.getByRole("list", { name: "Jauges du groupe" }).getByRole("listitem").filter({ hasText: alix })).toContainText("Frais comme un gardon");
    await expect(group).not.toContainText("g/L");
  });

  await bContext.close();
});
