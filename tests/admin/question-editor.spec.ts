// tests/admin/question-editor.spec.ts
import { test, expect } from '@playwright/test';

// Use baseURL from playwright.config.ts; ROUTE can be absolute or relative.
const ROUTE = process.env.ROUTE ?? '/admin/questions';

test.describe('Admin QuestionEditor — Smoke', () => {
  test('quick create -> preview updates -> publish modal (smoke)', async ({ page }) => {
    // navigate to editor (webServer in config will reuse existing server)
    await page.goto(ROUTE);

    // wait for editor to load
    await page.waitForSelector('[data-testid="input-question"]', { timeout: 10_000 });

    // fill form (Quick Create)
    await page.fill('[data-testid="input-question"]', 'What is the correct test of preview?');

    await page.fill('[data-testid="input-choice-0"]', 'Alpha');
    await page.fill('[data-testid="input-choice-1"]', 'Bravo');
    await page.fill('[data-testid="input-choice-2"]', 'Charlie');
    await page.fill('[data-testid="input-choice-3"]', 'Delta');

    // select correct answer (example selects Bravo)
    await page.selectOption('[data-testid="select-answer-key"]', 'B');

    // ensure preview updated (scopes to QuestionCard listbox)
    await page.click('[data-testid="tab-preview"]');
    const previewList = page.locator('div[role="listbox"]');
    await expect(previewList).toContainText('Bravo');

    // click Publish -> expect modal/dialog shows up
    await page.click('[data-testid="tab-form"]');
    await page.click('[data-testid="btn-publish"]');

    // success banner acts as confirmation
    await expect(page.locator('[role="status"]')).toContainText(/Question ready/i);
  });
});
