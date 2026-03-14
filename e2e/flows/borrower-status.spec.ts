import { expect, test } from "@playwright/test";

test.describe("F-STATUS-01: Borrower Status Portal", () => {
  test.skip(true, "Requires an authenticated borrower fixture and a loan assigned to that borrower.");

  test("borrower sees their loan status", async ({ page }) => {
    await page.goto("/my-loans");
    await expect(page.locator('[data-testid="loan-status-card"]')).toBeVisible();
  });

  test("milestone tracker shows current stage highlighted", async ({ page }) => {
    await page.goto("/my-loans/[testLoanId]");
    await expect(page.locator('[data-testid="milestone-tracker"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-milestone"]')).toHaveClass(/active/);
  });

  test("action items shown prominently", async ({ page }) => {
    await page.goto("/my-loans/[testLoanId]");
    await expect(page.locator('[data-testid="action-items"]')).toBeVisible();
  });
});
