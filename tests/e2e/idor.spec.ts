import { test, expect } from "@playwright/test";

test.describe("IDOR", () => {
  test.skip(!process.env.E2E, "Set E2E=1 with two seeded users to run.");

  test("user A cannot open user B job by id", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.E2E_USER_A_EMAIL ?? "a@example.com");
    await page.getByLabel("Password").fill(process.env.E2E_USER_A_PASSWORD ?? "password-a-123");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.goto(`/jobs/${process.env.E2E_USER_B_JOB_ID ?? "00000000-0000-0000-0000-000000000000"}`);
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
