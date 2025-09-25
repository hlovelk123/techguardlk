import { expect, test } from "@playwright/test";

test.describe("Authentication pages", () => {
  test("sign-in form fields are present", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeEnabled();
  });

  test("sign-up page displays required inputs", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("password reset page adapts when token provided", async ({ page }) => {
    await page.goto("/auth/reset");
    await expect(page.getByRole("heading", { name: /Reset password/i })).toBeVisible();

    await page.goto("/auth/reset?token=mock-token");
    await expect(page.getByRole("heading", { name: /Set new password/i })).toBeVisible();
    await expect(page.getByLabel(/New password/i)).toBeVisible();
  });
});
