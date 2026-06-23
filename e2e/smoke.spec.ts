import { expect, test } from "@playwright/test";

test("generated home page renders", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "To get started, edit the page.tsx file.",
    }),
  ).toBeVisible();
});
