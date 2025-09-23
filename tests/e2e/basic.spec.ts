import { test, expect } from "@playwright/test";

test("homepage has hero copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Manage every seat/i })).toBeVisible();
});
