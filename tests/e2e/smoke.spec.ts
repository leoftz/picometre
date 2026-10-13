import { expect, test } from "@playwright/test";

test("home page shows the brand, the 18+ notice and the fixed safety message", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Picomètre");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("picomètre");
  await expect(page.getByText("Réservé aux 18 ans et plus.")).toBeVisible();
  await expect(page.getByText("Si tu as bu, tu ne conduis pas.")).toBeVisible();
});

test("every gauge level has a text label, not only a colour", async ({ page }) => {
  await page.goto("/");
  const levels = page.getByRole("list", { name: "Les niveaux de la jauge" }).getByRole("listitem");

  await expect(levels).toHaveText([
    "Niveau 1 : Frais comme un gardon",
    "Niveau 2 : Ça pétille",
    "Niveau 3 : La jauge chauffe",
    "Niveau 4 : Pause obligatoire",
  ]);
});

test("the PWA manifest is installable", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);

  const manifest = await response.json();
  expect(manifest).toMatchObject({ name: "Picomètre", lang: "fr", display: "standalone", start_url: "/" });
  expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain("maskable");
});

test("security headers are set", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});
