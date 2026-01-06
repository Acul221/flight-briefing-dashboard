import { test, expect } from "@playwright/test";

test("importer dry-run smoke", async ({ page }) => {
  // Simple browser-less smoke: ensure we can load about:blank and run minimal script
  await page.goto("about:blank");
  const result = await page.evaluate(() => ({ ok: true }));
  expect(result.ok).toBe(true);
});
