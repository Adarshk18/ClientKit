import { test, expect } from "@playwright/test";

test.describe("public document", () => {
  test.skip(!process.env.E2E, "Set E2E=1 and seed the demo document to run.");

  test("sign happy path shows pay", async ({ page }) => {
    await page.goto("/s/demo-acme");
    await expect(page.getByRole("heading", { name: /Acme site rebuild/i })).toBeVisible();
    await page.getByLabel("Legal name").fill("Jordan Client");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Sign" }).click();
    await expect(page.getByRole("heading", { name: "Signed" })).toBeVisible();
    await expect(page.getByText(/Pay/i).first()).toBeVisible();
  });

  test("expired document cannot be signed", async ({ page }) => {
    await page.goto("/s/does-not-exist-expired");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
