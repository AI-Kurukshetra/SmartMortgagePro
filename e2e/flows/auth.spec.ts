import { expect, test } from "@playwright/test";

test.describe("F-AUTH-01: Login/Signup Flow", () => {
  test("renders login page with correct layout", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("SmartMortgage Pro")).toBeVisible();
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login with Google" })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Forgot password?")).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("shows validation errors for invalid email", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("notanemail");
    await page.locator('input[type="password"]').fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
  });

  test("password toggle shows and hides password", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.getByTestId("password-toggle");

    await expect(passwordInput).toHaveAttribute("type", "password");
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("navigates to signup page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/signup");
    await expect(page.getByText("Create your account")).toBeVisible();
  });

  test("signup shows confirm password mismatch error", async ({ page }) => {
    await page.goto("/signup");
    await page.locator('input[name="full_name"]').fill("John Doe");
    await page.locator('input[name="email"]').fill("john@example.com");
    await page.locator('input[name="password"]').fill("password123");
    await page.locator('input[name="confirm_password"]').fill("password456");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("unauthenticated user is redirected from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });
});
