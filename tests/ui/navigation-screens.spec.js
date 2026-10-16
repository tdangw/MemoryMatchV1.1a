import { expect, test } from '@playwright/test';
import { startMapLevel, previewMapLevel, closeLevelPreview } from './helpers/adventureNavigation.js';

for (const viewport of [{ width: 412, height: 915 }, { width: 640, height: 360 }, { width: 1024, height: 900 }]) {
  test(`five destinations are full screens with bounded owners at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('.adventure-header .adventure-account')).toHaveCount(0);
    await expect(page.locator('[data-dock-action]')).toHaveText(['Nhiệm vụ', 'Sự kiện', 'Profile', 'Xếp hạng', 'Cài đặt']);
    for (const action of ['missions', 'events']) {
      await page.locator(`.adventure-page:not([hidden]) [data-dock-action="${action}"]`).click();
      await expect(page.locator(`.adventure-screen[data-screen="${action}"]`)).toContainText('Sắp ra mắt');
      if (action === 'events') {
        await expect(page.locator('#events-screen .app-modal__title')).toHaveText('Sự kiện');
        await expect(page.locator('.adventure-screen [data-dock-action="events"]')).toHaveAttribute('aria-current', 'page');
        await expect(page.locator('#events-screen .ui-icon--events')).toBeVisible();
        await expect(page.getByText('Bạn bè', { exact: true })).toHaveCount(0);
        await expect(page.locator('[data-dock-action="friends"]')).toHaveCount(0);
        if (viewport.width === 412) await page.screenshot({ path: 'docs/design/app-tabs/qa/events-412.png', animations: 'disabled' });
      }
    }
    await page.locator('.adventure-page:not([hidden]) [data-dock-action="profile"]').click();
    await expect(page.locator('.adventure-screen[data-screen="profile"] #account-modal')).toBeVisible();
    await expect(page.locator('.app-modal-overlay, [aria-modal="true"], .app-modal__close')).toHaveCount(0);
    await page.locator('.adventure-screen .adventure-exit').click();
    await page.locator('.game-selector__choice').filter({ hasText: 'Link Connect' }).click();
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
    await previewMapLevel(page);
    const colors = await page.locator('.adventure-level-modes label span').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundImage));
    for (const [index, color] of ['rgb(135, 80, 46)', 'rgb(36, 86, 145)', 'rgb(184, 134, 50)', 'rgb(112, 59, 160)'].entries()) expect(colors[index]).toContain(color);
    await closeLevelPreview(page);
    const scroll = await page.locator('.adventure-map-scroll').evaluate(node => node.scrollTop);
    const baseline = await page.evaluate(async () => (await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics());
    for (let cycle = 0; cycle < 5; cycle++) {
      for (const action of ['shop', 'collection', 'ranking', 'settings']) {
        await page.locator(`.adventure-page:not([hidden]) [data-dock-action="${action}"]`).click();
        const screen = page.locator(`.adventure-screen[data-screen="${action}"]`);
        await expect(screen).toBeVisible();
        await expect(screen.locator(`[data-dock-action="${action}"]`)).toHaveAttribute('aria-current', 'page');
        await expect(page.locator('.adventure-screen')).toHaveCount(1);
        await expect(screen.locator('.app-screen-content')).toHaveCount(1);
        await expect(screen.locator('[data-ad-placement]')).toHaveCount(0);
        await expect(page.locator('.app-modal-overlay, [aria-modal="true"], .app-modal__close')).toHaveCount(0);
        const bounds = await screen.locator('.app-modal').boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(bounds.width).toBe(Math.min(viewport.width, 640));
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
        if (cycle === 0 && viewport.width === 412) await page.screenshot({ path: `.firebase/navigation-${action}.png` });
      }
      await page.locator('.adventure-screen [data-dock-action="map"]').click();
      await expect(page.locator('.adventure-screen')).toHaveCount(0);
      await expect(page.locator('#menu-container')).toBeVisible();
      expect(await page.locator('.adventure-map-scroll').evaluate(node => node.scrollTop)).toBe(scroll);
      expect(await page.evaluate(async () => (await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
    }
    await page.locator('[data-dock-action="settings"]').click();
    await page.locator('#settings-modal').getByRole('button', { name: 'Hướng dẫn', exact: true }).click();
    await expect(page.locator('#info-modal')).toBeVisible();
    await page.locator('#info-modal .app-modal__close').click();
    await expect(page.locator('#info-modal')).toHaveCount(0);
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page.locator('.adventure-screen .adventure-exit').click();
    await expect(page.locator('.game-selector__choice')).toHaveCount(3);
    expect(errors).toEqual([]);
  });
}

for (const [gameId, trigger] of [['memory-match', '#btn-actions-menu'], ['link-connect', '#link-actions-menu-toggle'], ['triple-connect', '#triple-actions-menu-toggle']]) {
  test(`${gameId} hides navigation during gameplay and returns to the map through exit`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
    await startMapLevel(page);
    await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup', /.+/);
    await expect(page.locator('[data-dock-action], [data-ad-placement]')).toHaveCount(0);
    await page.locator(trigger).click();
    await page.locator('#game-exit-modal').getByRole('button', { name: 'Thoát game', exact: true }).click();
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
    await expect(page.locator('[data-dock-action]')).toHaveText(['Cửa hàng', 'Bộ sưu tập', 'Bản đồ', 'Xếp hạng', 'Cài đặt']);
  });
  test(`${gameId} cannot open settings before startup commits the board`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async id => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      window.pendingDecodes = [];
      window.originalDecode = HTMLImageElement.prototype.decode;
      HTMLImageElement.prototype.decode = function () { return new Promise(resolve => window.pendingDecodes.push(resolve)); };
      if (id === 'memory-match') window.startupPromise = (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
      else if (id === 'link-connect') window.startupPromise = (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', skipIntro: true });
      else window.startupPromise = (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', skipIntro: true });
    }, gameId);
    await page.waitForFunction(() => window.pendingDecodes.length > 0);
    await expect(page.locator(trigger)).toBeDisabled();
    await page.locator(trigger).evaluate(button => button.click());
    await expect(page.locator('#game-exit-modal, #settings-modal')).toHaveCount(0);
    await page.evaluate(() => {
      HTMLImageElement.prototype.decode = window.originalDecode;
      window.pendingDecodes.forEach(resolve => resolve());
    });
    await page.evaluate(() => window.startupPromise);
    await expect(page.locator(trigger)).toBeEnabled();
    await page.locator(trigger).click();
    await expect(page.locator('#game-exit-modal')).toBeVisible();
  });
}
