import { expect, test } from "@playwright/test";

test.describe("F-DISC-01: Disclosure Generation", () => {
  test.skip(
    true,
    "Requires an authenticated seeded user plus disclosure records or migrations applied in Supabase.",
  );

  test("disclosures list renders", async ({ page }) => {
    await page.goto("/loans/[testLoanId]/disclosures");
    await expect(page.locator('[data-testid="disclosure-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="generate-le-btn"]')).toBeVisible();
  });

  test("fee tolerance table shows violations in red", async ({ page }) => {
    await page.goto("/loans/[testLoanId]/disclosures/[cdDisclosureId]");
    await expect(page.locator('[data-testid="fee-tolerance-table"]')).toBeVisible();
  });

  test("changed circumstance form requires reason", async ({ page }) => {
    await page.goto("/loans/[testLoanId]/disclosures");
    await page.click('[data-testid="redisclose-btn"] button');
    await expect(page.getByText("Reason is required")).toBeVisible();
  });
});
