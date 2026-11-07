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
    await expect(preview(page)).toHaveText('');
    await expect(page.locator('.ad-art-scene')).toHaveCount(1);
    const dock = await page.locator('.adventure-dock').boundingBox();
    const banner = await preview(page).boundingBox();
    expect(banner.y - (dock.y + dock.height)).toBeCloseTo(8, 0);
    expect(banner.height).toBe(50);
    expect(banner.y + banner.height).toBeLessThanOrEqual(size.height);
    const controls = await page.locator('.game-selector__controls').boundingBox();
    expect(controls.y + controls.height).toBeLessThanOrEqual(dock.y + 1);
    await page.screenshot({ path: `docs/ads/qa/web-preview-${size.width}.png` });
    for (const tab of ['missions', 'events', 'profile', 'ranking', 'settings']) {
      await page.locator(`[data-dock-action="${tab}"]`).click();
      await expect(preview(page)).toHaveCount(1);
      await page.locator('.adventure-screen > .adventure-exit').click();
      await expect(preview(page)).toHaveCount(1);
    }
    for (const [game, title] of [['memory-match', 'Memory Match'], ['link-connect', 'Link Connect'], ['triple-connect', 'Triple Connect']]) {
      await page.getByRole('button', { name: `Chọn ${title}`, exact: true }).click();
      await expect(page.locator(`.game-selector__choice[data-game-id="${game}"]`)).toHaveClass(/is-selected/);
      await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();
      await expect(preview(page)).toHaveCount(1);
      for (const tab of ['shop', 'collection']) {
        await page.locator(`[data-dock-action="${tab}"]`).click();
        await expect(page.locator('.adventure-screen .menu-ad-preview')).toHaveCount(1);
        await expect(preview(page)).toHaveCount(1);
        const screenDock = await page.locator('.adventure-screen .adventure-dock').boundingBox();
        const screenBanner = await preview(page).boundingBox();
        expect(screenBanner.y - screenDock.y - screenDock.height).toBeCloseTo(8, 0);
        expect(screenBanner.y + screenBanner.height).toBeLessThanOrEqual(size.height);
        if (size.width === 412 && game === 'memory-match') await page.screenshot({ path: `docs/ads/qa/web-${tab}-412.png` });
        if (tab === 'shop' && game === 'memory-match') {
          await page.evaluate(async () => (await import('/js/modal.js')).openAppModal({ id: 'ads-check-modal', title: 'Thông tin', content: 'Chọn vật phẩm bạn muốn sử dụng.' }));
          await expect(preview(page)).toHaveCount(1);
          await page.locator('#ads-check-modal .app-modal__close').click();
          await expect(page.locator('#ads-check-modal')).toHaveCount(0);
          await expect(preview(page)).toHaveCount(1);
        }
        await page.locator('.adventure-screen [data-dock-action="map"]').click();
        await expect(preview(page)).toHaveCount(1);
      }
      await previewMapLevel(page);
      await expect(preview(page)).toHaveCount(1);
      await closeLevelPreview(page);
      await expect(preview(page)).toHaveCount(1);
      await startMapLevel(page);
      await page.getByRole('button', { name: 'Bỏ qua', exact: true }).click();
      await expect(page.locator('.gameplay-ad-slot .menu-ad-preview')).toHaveCount(1);
      const shell = page.locator('.game-shell-root:visible');
      await expect.poll(() => shell.evaluate(root => {
        const bannerTop = root.querySelector('.menu-ad-preview').getBoundingClientRect().top;
        if (root.classList.contains('shell-scroll-playing')) {
          root.scrollTop = root.scrollHeight;
          const lastContent = root.querySelector('.triple-connect__tray') || root.querySelector('[data-shell-region="frame"]');
          return Math.max(root.getBoundingClientRect().bottom, lastContent.getBoundingClientRect().bottom) - bannerTop;
        }
        return root.querySelector('[data-shell-region="frame"]').getBoundingClientRect().bottom - bannerTop;
      })).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `docs/ads/qa/gameplay-${game}-${size.width}.png` });
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
  await page.locator('.game-selector__choice.is-selected').click();
  for (let i = 0; i < 10; i++) {
    for (const tab of ['shop', 'collection', 'map']) {
      await page.locator(`[data-dock-action="${tab}"]:visible`).click();
      await expect(preview(page)).toHaveCount(1);
    }
  }
  await page.locator('.adventure-map-page .adventure-exit').click();
  await expect(preview(page)).toHaveCount(1);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(preview(page)).toHaveCount(1);
  expect((await preview(page).boundingBox()).height).toBe(50);
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

test('30 gameplay restarts across three games release the previous banner owner', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/');
  for (const [game, title, trigger] of [
    ['memory-match', 'Memory Match', '#btn-actions-menu'],
    ['link-connect', 'Link Connect', '#link-actions-menu-toggle'],
    ['triple-connect', 'Triple Connect', '#triple-actions-menu-toggle'],
  ]) {
    await page.getByRole('button', { name: `Chọn ${title}`, exact: true }).click();
    await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();
    await startMapLevel(page);
      await page.getByRole('button', { name: 'Bỏ qua', exact: true }).click();
    for (let i = 0; i < 10; i++) {
      await expect(page.locator('.gameplay-ad-slot')).toHaveCount(1);
      await page.evaluate(async () => { window.adsPreviousScope = (await import('/js/gameShell/gameShell.js')).getGameShellDiagnostics().activeScope; });
      await page.locator(trigger).click();
      await page.locator('#game-exit-modal').getByRole('button', { name: 'Chơi lại', exact: true }).click();
      await expect(page.locator('#game-exit-modal')).toHaveCount(0);
      await expect(preview(page)).toHaveCount(1);
      expect(await page.evaluate(() => Object.values(window.adsPreviousScope.diagnostics()).every(value => value === false || value === 0))).toBe(true);
    }
    await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
    await expect(page.locator('.gameplay-ad-slot')).toHaveCount(0);
    await expect(preview(page)).toHaveCount(1);
  }
});
