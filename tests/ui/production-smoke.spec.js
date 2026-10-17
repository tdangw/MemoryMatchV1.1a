import { previewMapLevel, closeLevelPreview } from './helpers/adventureNavigation.js';
import { expect, test } from '@playwright/test';

test.skip(process.env.GAME_SHELL_TEST_SERVER !== 'preview', 'Built application smoke only.');
test('built mobile menu, map and account open without writing to production services', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.route(/googleapis\.com|google-analytics\.com|googletagmanager\.com/, route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  await expect(page.locator('.menu-ad-preview')).toHaveCount(1);
  await expect(page.locator('.menu-ad-preview')).toHaveText('Quảng cáo');
  await expect(page.locator('.adventure-wallet')).toHaveCount(0);
  await expect(page.locator('.adventure-account')).toHaveCount(0);
  await page.locator('.game-selector__choice').filter({ hasText: 'Memory Match' }).click();
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  await expect(page.locator('.menu-ad-preview')).toHaveCount(1);
  await expect(page.locator('.adventure-map-node--level')).toHaveCount(100);
  await expect(page.locator('[data-level="1"]')).toBeEnabled();
  await expect(page.locator('[data-level="2"]')).toBeDisabled();
  expect(await page.locator('.adventure-map-decoration').count()).toBeGreaterThanOrEqual(10);
  const atlasReady = await page.evaluate(async () => {
    const image = new Image(); image.src = '/assets/adventure/garden-sprites.webp'; await image.decode();
    return image.naturalWidth > 0 && getComputedStyle(document.querySelector('.adventure-map-chest-art')).backgroundImage.includes('garden-sprites.webp');
  });
  expect(atlasReady).toBe(true);
  await previewMapLevel(page, 1, 'hard');
  await expect(page.locator('.menu-ad-preview')).toHaveCount(0);
  await closeLevelPreview(page);
  await expect(page.locator('.menu-ad-preview')).toHaveCount(1);
  for (const tab of ['shop', 'collection']) {
    await page.locator(`[data-dock-action="${tab}"]`).click();
    await expect(page.locator('.adventure-screen .menu-ad-preview')).toHaveText('Quảng cáo');
    await expect(page.locator('.menu-ad-preview')).toHaveCount(1);
    await page.locator('.adventure-screen [data-dock-action="map"]').click();
    await expect(page.locator('.menu-ad-preview')).toHaveCount(1);
  }
  await expect(page.locator('.adventure-mode-toggle')).toHaveCount(0);
  await page.locator('.adventure-exit').click();
  await page.locator('[data-dock-action="profile"]').click();
  await expect(page.locator('#account-modal')).toBeVisible();
  await expect(page.locator('.menu-ad-preview')).toHaveCount(1);
  await expect(page.locator('#account-modal')).not.toContainText('Firebase');
  await expect(page.getByRole('button', { name: 'Đồng bộ ngay', exact: true })).toHaveCount(0);
  await expect(page.locator('#account-modal .app-modal__close')).toHaveCount(0);
  await page.locator('.adventure-screen .adventure-exit').click();
  await expect(page.locator('.app-modal-overlay')).toHaveCount(0);
  await page.screenshot({ path: '.firebase/production-map-mobile.png' });
  expect(errors).toEqual([]);
});
