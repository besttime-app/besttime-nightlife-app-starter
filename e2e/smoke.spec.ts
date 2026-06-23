import { expect, test } from "@playwright/test";

test("map-first app shell renders", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /BestTime venues/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Nightlife" }).first()).toBeVisible();
  await expect(page.locator('[aria-label="Venue map"]:visible')).toBeVisible();
});
