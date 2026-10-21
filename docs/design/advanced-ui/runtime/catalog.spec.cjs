const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs/promises');
const { ready, homeSkin, geometry, disableRemoteServices, installModuleAccess, freezeDevelopmentReloads } = require('./helpers.cjs');
test.setTimeout(120000);
for (const skin of ['default', 'woodland']) for (const viewport of [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
  test(`catalog ${skin} ${viewport.width}`, async ({ page }) => {
    await freezeDevelopmentReloads(page); await disableRemoteServices(page); await installModuleAccess(page); await page.setViewportSize(viewport);
    const errors = [], proof = []; page.on('pageerror', error => errors.push(error.message));
    await ready(page); await homeSkin(page, skin);
    async function shot(game, surface) {
      const metrics = await geometry(page), file = `catalog-${skin}-${viewport.width}-${game}-${surface}.png`;
      await page.screenshot({ path: path.join(__dirname, 'qa', file), animations: 'disabled' }); proof.push({ game, surface, file, metrics });
    }
    for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
      await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();
      await expect(page.locator(`#menu-container.${game}-menu[data-map-ready="true"]`)).toBeVisible();
      if (skin === 'woodland') await expect(page.locator('html')).toHaveAttribute('data-ui-rewards', 'ready');
      await shot(game, 'map');
      await page.locator('[data-level="1"]').click(); await expect(page.locator('#adventure-level-modal')).toBeVisible();
      await shot(game, 'preview');
      const detail = page.locator('#adventure-level-modal .adventure-level-details li').last();
      await detail.scrollIntoViewIfNeeded(); await expect(detail).toBeInViewport();
      await shot(game, 'preview-details');
      await page.locator('#adventure-level-modal .app-modal__close').click(); await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
      for (const mode of ['challenge', 'endless']) {
        await page.locator(`[data-special-mode="${mode}"]`).click();
        await expect(page.locator('#adventure-level-modal input[name="adventure-level-mode"]')).toHaveCount(0);
        await shot(game, mode);
        await page.locator('#adventure-level-modal .app-modal__close').click(); await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
      }
      for (const surface of ['shop', 'collection']) {
        await page.locator(`.adventure-page:visible [data-dock-action="${surface}"]`).click();
        const tabs = page.locator('.adventure-screen [role="tablist"] button');
        await expect(tabs.first()).toBeVisible();
        const count = await tabs.count();
        for (let index = 0; index < count; index++) {
          await tabs.nth(index).click(); await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
          await shot(game, `${surface}-${await tabs.nth(index).getAttribute('id')}`);
          const lastAction = page.locator('.adventure-screen .shop-buy-button').last();
          if (await lastAction.count()) { await lastAction.scrollIntoViewIfNeeded(); await expect(lastAction).toBeInViewport(); }
        }
        const last = await tabs.last().getAttribute('id');
        await page.locator('.adventure-screen [data-dock-action="map"]').click();
        await page.locator(`.adventure-page:visible [data-dock-action="${surface}"]`).click();
        await expect(page.locator(`[id="${last}"]`)).toHaveAttribute('aria-selected', 'true');
        await page.locator('.adventure-screen [data-dock-action="map"]').click();
      }
      for (const surface of ['ranking', 'settings']) {
        await page.locator(`.adventure-page:visible [data-dock-action="${surface}"]`).click();
        await expect(page.locator('.adventure-screen .app-modal')).toBeVisible();
        if (surface === 'ranking') await expect(page.locator('.leaderboard-status')).toHaveText('Chưa có kết nối.');
        await shot(game, surface);
        await page.locator('.adventure-screen [data-dock-action="map"]').click();
      }
      await page.locator('#menu-container .adventure-exit').click(); await expect(page.locator('.game-selector')).toBeVisible();
    }
    expect(errors).toEqual([]);
    await fs.writeFile(path.join(__dirname, 'qa', `catalog-${skin}-${viewport.width}.json`), JSON.stringify({ skin, viewport, remoteServices: 'disabled at backend boundary; real local game and persistence', proof, errors }, null, 2));
  });
}
