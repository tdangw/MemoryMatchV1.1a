import { expect, test } from '@playwright/test';

test.skip(process.env.GAME_SHELL_TEST_SERVER !== 'preview', 'Built application smoke only.');
test('built mobile menu, map and account open without writing to production services', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.route(/googleapis\.com|google-analytics\.com|googletagmanager\.com/, route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  await page.locator('.game-selector__choice').filter({ hasText: 'Memory Match' }).click();
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  await expect(page.locator('.adventure-map-node--level')).toHaveCount(100);
  await expect(page.locator('[data-level="1"]')).toBeEnabled();
  await expect(page.locator('[data-level="2"]')).toBeDisabled();
  await page.locator('[data-mode="hard"]').click();
  await expect(page.locator('.adventure-map-play')).toHaveText('Chơi màn 1');
  await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
  await expect(page.locator('#account-modal')).toBeVisible();
  await expect(page.locator('#account-modal')).not.toContainText('Firebase');
  await expect(page.getByRole('button', { name: 'Đồng bộ ngay', exact: true })).toHaveCount(0);
  await page.locator('#account-modal .app-modal__close').click();
  await expect(page.locator('.app-modal-overlay')).toHaveCount(0);
  await page.screenshot({ path: '.firebase/production-map-mobile.png' });
  expect(errors).toEqual([]);
});
