import { previewMapLevel, closeLevelPreview } from './helpers/adventureNavigation.js';
import { expect, test } from '@playwright/test';
test.skip(process.env.GAME_SHELL_TEST_SERVER !== 'preview', 'Production bundle smoke only.');
test('built chunks open home/maps and account fallback without module initialization errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Never create production test accounts or analytics traffic in a bundle smoke.
  await page.route(/https:\/\/(?:[^/]*googleapis\.com|[^/]*google-analytics\.com|[^/]*googletagmanager\.com)\//, route => route.abort());
  await page.goto('/');
  await expect(page.locator('.adventure-dock')).toBeVisible();
  await page.getByRole('button', { name: /Memory Match Mới thấy/ }).click();
  await expect(page.locator('.adventure-map-node--level')).toHaveCount(100);
  await previewMapLevel(page, 1, 'hard');
  await closeLevelPreview(page);
  await expect(page.locator('[data-level="1"]')).toBeEnabled();
  await page.locator('.adventure-account').click();
  await expect(page.locator('#account-modal')).toBeVisible();
  expect(errors).toEqual([]);
});
