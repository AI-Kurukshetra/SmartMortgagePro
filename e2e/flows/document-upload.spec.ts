import { expect, test } from "@playwright/test";

const borrowerEmail =
  process.env.E2E_BORROWER_EMAIL ?? "borrower.seed@smartmortgagepro.test";
const borrowerPassword =
  process.env.E2E_BORROWER_PASSWORD ?? "SeedUser123!";

test.describe("F-DOC-01: Document Upload", () => {
  test("seeded borrower uploads demo PDF and sees it in the portal", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/login");
    await page.locator('input[name="email"]').fill(borrowerEmail);
    await page.locator('input[name="password"]').fill(borrowerPassword);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/my-loans/);

    const firstLoanLink = page
      .getByRole("link", { name: /Open this loan to upload missing documents/i })
      .first();
    await expect(firstLoanLink).toBeVisible();
    await firstLoanLink.click();
    await expect(page).toHaveURL(/\/my-loans\/[0-9a-f-]+/i);
    await expect(page.getByText("APPLICATION STATUS")).toBeVisible();

    await page
      .getByRole("button", { name: /upload missing documents|open document portal/i })
      .click();
    await expect(page.locator('[data-testid="upload-dropzone"]')).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/test-doc.pdf");

    await expect(
      page.locator('[data-testid="document-card"]').filter({ hasText: "test-doc.pdf" }).first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
