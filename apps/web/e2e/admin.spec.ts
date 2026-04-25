import { expect, test } from "@playwright/test";

test("admin can sign in and create a member", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin/);

  await page.goto("/admin/members/new");
  await page.getByLabel("Full name").fill("E2E User");
  const email = `e2e+${Date.now()}@x.local`;
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(/\/admin\/members(\?.*)?$/);
  await expect(page.getByText(email)).toBeVisible();
});
