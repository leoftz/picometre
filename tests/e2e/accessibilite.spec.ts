// Automated WCAG 2.1 AA audit (axe) of every screen, on the LOCAL stack (charte §12, lot 10).
// It cannot replace a manual pass (screen reader, keyboard), but it catches contrast, labels and roles.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createAccount } from "./support/account";

async function audit(page: Page, screen: string) {
  // Every screen has a title; wait for it, as a client-side navigation swaps it in.
  await expect(page).toHaveTitle(/Picomètre/);
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const report = violations.map((v) => `${screen} · ${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(report, report.join("\n")).toEqual([]);
}

test("public screens", async ({ page }) => {
  for (const [path, screen] of [
    ["/", "barrière d'âge"],
    ["/mineur", "mineur"],
    ["/conditions", "conditions"],
    ["/confidentialite", "confidentialité"],
    ["/mentions-legales", "mentions légales"],
  ] as const) {
    await page.goto(path);
    await audit(page, screen);
  }
  await page.goto("/");
  await page.getByRole("link", { name: "Oui, j'ai 18 ans ou plus" }).click();
  await expect(page.getByLabel("Ton adresse e-mail")).toBeVisible();
  await audit(page, "connexion");
});

test("signed-in screens", async ({ page }) => {
  test.slow();
  await createAccount(page);
  await audit(page, "accueil");

  await page.getByRole("link", { name: "Créer une soirée" }).click();
  await audit(page, "nouvelle soirée");
  await page.getByLabel("Nom de la soirée").fill("Audit");
  await page.getByRole("button", { name: "Créer la soirée" }).click();
  await page.getByText("Ajouter une boisson").click();
  await page.getByLabel("Boisson", { exact: true }).selectOption("biere-blonde");
  await page.getByRole("button", { name: "Ajouter cette boisson" }).click();
  await page.getByText("Idées de recettes").click();
  await audit(page, "soirée (préparation)");

  await page.getByRole("radio", { name: /Soirée festive/ }).check();
  await page.getByText("Rien mangé").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("C'est noté.")).toBeVisible();
  await page.getByRole("link", { name: "Ouvrir ma jauge" }).click();
  await page.getByRole("button", { name: "Bière blonde", exact: true }).click();
  await audit(page, "choix du verre");
  await page.getByRole("dialog").getByRole("button", { name: /Demi/ }).click();
  await expect(page.getByRole("heading", { name: /^À venir : / })).toBeVisible();
  await audit(page, "jauge");

  await page.goto(page.url().replace(/\/jauge$/, "/bilan"));
  await expect(page.getByRole("heading", { name: "Mon bilan" })).toBeVisible();
  await expect(page.getByText("Pic estimé")).toBeVisible();
  await audit(page, "bilan");

  await page.goto("/amis");
  await audit(page, "amis");
  await page.goto("/reglages");
  await audit(page, "réglages");
});
