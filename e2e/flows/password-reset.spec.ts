import { expect, test } from "@playwright/test";

test.describe("F-AUTH-03: Password Reset", () => {
  test("forgot password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  });

  test("forgot password validates email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
  });

  test("forgot password shows success state after submit", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Check your email")).toBeVisible();
  });

  test("reset password validates minimum length and matching passwords", async ({ page }) => {
    await page.goto("/reset-password");
    await page.locator('input[name="password"]').fill("short");
    await page.locator('input[name="confirm_password"]').fill("short");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();

    await page.locator('input[name="password"]').fill("password123");
    await page.locator('input[name="confirm_password"]').fill("different123");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("login page shows success message after reset", async ({ page }) => {
    await page.goto("/login?reset=success");
    await expect(page.getByText("Password reset successful. Sign in with your new password.")).toBeVisible();
  });
});
