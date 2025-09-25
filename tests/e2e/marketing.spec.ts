import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const axeTags = ["wcag2a", "wcag2aa"];

test.describe("Marketing experience", () => {
  test("home page renders hero content and passes accessibility scan", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Manage every seat/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse plans/i })).toBeVisible();

    const accessibilityScan = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    expect(accessibilityScan.violations).toEqual([]);
  });

  test("primary call to action navigates to signup", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /Start free trial/i });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});
