import { expect, test } from "@playwright/test";

test("the age gate comes first, with the fixed safety message", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Picomètre");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("picomètre");
  await expect(page.getByText("Tu as 18 ans ou plus ?")).toBeVisible();
  await expect(page.getByText("Si tu as bu, tu ne conduis pas.")).toBeVisible();
});

test("a minor is kept out", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Non, pas encore" }).click();
  await expect(page.getByRole("heading", { name: "Rendez-vous à tes 18 ans" })).toBeVisible();
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
