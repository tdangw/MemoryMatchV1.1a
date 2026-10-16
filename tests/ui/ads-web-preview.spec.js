import { expect, test } from '@playwright/test';
import { startMapLevel, previewMapLevel, closeLevelPreview } from './helpers/adventureNavigation.js';

const preview = page => page.locator('.menu-ad-preview');
for (const size of [{ width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
  test(`web preview follows menu ownership at ${size.width}`, async ({ page }) => {
    const nativeImports = [];
    page.on('request', request => { if (request.url().includes('/js/ads/nativeAdapter.js')) nativeImports.push(request.url()); });
    await page.setViewportSize(size);
    await page.goto('/');
    await expect(preview(page)).toHaveCount(1);
    await expect(preview(page)).toHaveText('Quảng cáo mô phỏng');
    const dock = await page.locator('.adventure-dock').boundingBox();
    const banner = await preview(page).boundingBox();
    expect(banner.y - (dock.y + dock.height)).toBeCloseTo(28, 0);
    expect(banner.y + banner.height).toBeLessThanOrEqual(size.height);
    const controls = await page.locator('.game-selector__controls').boundingBox();
    expect(controls.y + controls.height).toBeLessThanOrEqual(dock.y + 1);
    await page.screenshot({ path: `docs/ads/qa/web-preview-${size.width}.png` });
    for (const tab of ['missions', 'events', 'profile', 'ranking', 'settings']) {
      await page.locator(`[data-dock-action="${tab}"]`).click();
      await expect(preview(page)).toHaveCount(0);
      await page.locator('.adventure-screen > .adventure-exit').click();
      await expect(preview(page)).toHaveCount(1);
    }
    for (const [game, title] of [['memory-match', 'Memory Match'], ['link-connect', 'Link Connect'], ['triple-connect', 'Triple Connect']]) {
      await page.getByRole('button', { name: `Chọn ${title}`, exact: true }).click();
      await expect(page.locator(`.game-selector__choice[data-game-id="${game}"]`)).toHaveClass(/is-selected/);
      await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();
      await expect(preview(page)).toHaveCount(1);
      await previewMapLevel(page);
      await expect(preview(page)).toHaveCount(0);
      await closeLevelPreview(page);
      await expect(preview(page)).toHaveCount(1);
      await startMapLevel(page);
      await expect(preview(page)).toHaveCount(0);
      await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
      await expect(preview(page)).toHaveCount(1);
    }
    expect(nativeImports).toEqual([]);
  });
}

test('web preview releases nodes across suspension, background and 30 navigation cycles', async ({ page }) => {
  await page.goto('/');
  await expect(preview(page)).toHaveCount(1);
  await page.evaluate(async () => {
    const ads = await import('/js/ads/menuAds.js');
    const resume = ads.suspendMenuAds('web-preview-test');
    if (document.querySelector('.menu-ad-preview')) throw new Error('Preview survived suspension');
    resume(); resume();
    const menus = await import('/js/gameSelector.js');
    for (let i = 0; i < 30; i++) { menus.openGameMenu('memory-match'); menus.showGameSelector(); }
  });
  await expect(preview(page)).toHaveCount(1);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(preview(page)).toHaveCount(1);
  expect((await preview(page).boundingBox()).height).toBe(60);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(preview(page)).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  await expect(preview(page)).toHaveCount(1);
  await page.evaluate(() => { const input = document.createElement('input'); input.id = 'preview-focus'; document.body.append(input); input.focus(); });
  await expect(preview(page)).toHaveCount(0);
  await page.evaluate(() => document.getElementById('preview-focus').remove());
  await page.locator('.game-selector__choice.is-selected').focus();
  await expect(preview(page)).toHaveCount(1);
  await page.evaluate(async () => { const runtime = await (await import('/js/ads/menuAds.js')).initializeMenuAds(); await runtime.dispose(); await runtime.dispose(); });
  await expect(preview(page)).toHaveCount(0);
});
