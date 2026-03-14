import { expect, test } from "@playwright/test";

test.describe("F-COMP-01: Compliance Dashboard", () => {
  test.skip(
    true,
    "Requires an authenticated seeded user, a seeded loan ID, and compliance records or rule-engine preview data.",
  );

  test("compliance page shows regulation overview", async ({ page }) => {
    await page.goto("/loans/[testLoanId]/compliance");
    await expect(page.getByText("Compliance Dashboard")).toBeVisible();
    await expect(page.getByText("TRID")).toBeVisible();
    await expect(page.locator('[data-testid="trid-timeline"]')).toBeVisible();
  });

  test("violation banner shows when violations exist", async ({ page }) => {
    await page.goto("/loans/[violatingLoanId]/compliance");
    await expect(page.locator('[data-testid="violation-alert-banner"]')).toBeVisible();
  });

  test("audit log has no edit/delete controls", async ({ page }) => {
    await page.goto("/loans/[testLoanId]/compliance");
    await page.getByRole("tab", { name: "Audit Log" }).click();
    await expect(page.locator('[data-testid="audit-log-table"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeHidden();
  });
});
