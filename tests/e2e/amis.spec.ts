// Friends and party invitations, with several users in separate browsers, on the LOCAL stack only.
import { expect, test } from "@playwright/test";
import { createAccount, randomPseudo } from "./support/account";

test("a friend link signs a newcomer up and makes them friends, then the host invites them to a party", async ({ page, browser }) => {
  const alix = await createAccount(page);
  let link = "";

  await test.step("A creates a single-use link", async () => {
    await page.getByRole("link", { name: /^Mes amis/ }).click();
    await page.getByRole("button", { name: "Créer un lien d'invitation" }).click();
    link = await page.getByLabel("Ton lien d'invitation").inputValue();
    expect(link).toMatch(/\/amis\/lien\/[0-9a-f]{36}$/);
  });

  const bContext = await browser.newContext();
  const b = await bContext.newPage();
  const bao = randomPseudo();

  await test.step("B opens it without an account, signs up, and lands friends with A", async () => {
    await b.goto(new URL(link).pathname);
    await expect(b.getByText("Tu as 18 ans ou plus ?")).toBeVisible();
    await createAccount(b, bao, /\/amis\?ajout=/);
    await expect(b.getByText(`Toi et ${alix} êtes amis.`)).toBeVisible();
    await expect(b.getByRole("listitem").filter({ hasText: alix })).toBeVisible();
  });

  await test.step("the link only works once", async () => {
    const cContext = await browser.newContext();
    const c = await cContext.newPage();
    await createAccount(c);
    await c.goto(new URL(link).pathname);
    await expect(c.getByText("Ce lien d'invitation a expiré ou a déjà servi.")).toBeVisible();
    await cContext.close();
  });

  await test.step("A invites B to a party", async () => {
    await page.goto("/accueil");
    await page.getByRole("link", { name: "Créer une soirée" }).click();
    await page.getByLabel("Nom de la soirée").fill("Raclette");
    await page.getByRole("button", { name: "Créer la soirée" }).click();
    await page.getByText("Inviter des amis").click();
    await page.getByRole("checkbox", { name: bao }).check();
    await page.getByRole("button", { name: "Envoyer les invitations" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: bao })).toContainText("Invitation envoyée");
  });

  await test.step("B sees the invitation at home and accepts it", async () => {
    await b.goto("/accueil");
    const invitations = b.getByRole("region", { name: "Invitations" });
    await invitations.getByRole("link", { name: /Raclette/ }).click();
    await expect(b.getByText(`${alix} t'invite à cette soirée.`)).toBeVisible();
    await b.getByRole("button", { name: "Accepter" }).click();
    await expect(b.getByRole("link", { name: "Ouvrir ma jauge" })).toBeVisible();
    await expect(b.getByRole("listitem").filter({ hasText: bao })).toContainText("Sera de la soirée");
    await expect(b.getByRole("listitem").filter({ hasText: alix })).toContainText("Organise la soirée");
  });

  await bContext.close();
});

test("a friend request by pseudo needs the other person's acceptance", async ({ page, browser }) => {
  const alix = await createAccount(page);
  const cContext = await browser.newContext();
  const cam = await cContext.newPage();
  const camPseudo = await createAccount(cam);

  await cam.getByRole("link", { name: /^Mes amis/ }).click();
  await cam.getByLabel("Ajouter par pseudo").fill(alix.toUpperCase());
  await cam.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(cam.getByText("Demande envoyée. Elle attend sa réponse.")).toBeVisible();
  await cam.getByLabel("Ajouter par pseudo").fill("personne-de-ce-nom");
  await cam.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(cam.getByText("Aucun personnage avec ce pseudo. Vérifie l'orthographe.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: "Mes amis · 1 demande" })).toBeVisible();
  await page.getByRole("link", { name: /^Mes amis/ }).click();
  const received = page.getByRole("region", { name: "Demandes reçues" });
  await expect(received.getByRole("listitem").filter({ hasText: camPseudo })).toBeVisible();
  await received.getByRole("button", { name: "Accepter" }).click();
  await expect(page.getByRole("region", { name: "Amis" }).getByRole("listitem").filter({ hasText: camPseudo })).toBeVisible();

  await cContext.close();
});
