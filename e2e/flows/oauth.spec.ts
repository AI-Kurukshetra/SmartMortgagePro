import { expect, test } from "@playwright/test";

test.describe("F-AUTH-02: Google OAuth", () => {
  test("Google OAuth button exists and is clickable", async ({ page }) => {
    await page.goto("/login");
    const googleButton = page.getByRole("button", { name: "Login with Google" });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test("auth callback route exists and does not 404", async ({ page }) => {
    const response = await page.request.get("/auth/callback", {
      maxRedirects: 0,
    });
    expect(response.status()).not.toBe(404);
  });

  test("failed OAuth callback surfaces login error message", async ({ page }) => {
    await page.goto("/login?error=oauth_callback_failed");
    await expect(page.getByText("Google sign-in failed. Please try again.")).toBeVisible();
  });
});
