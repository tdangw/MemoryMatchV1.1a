const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { startNatural } = require('../../docs/design/advanced-ui/runtime/natural-play.cjs');
const sizes = { reference: [412, 915], narrow: [320, 740], landscape: [844, 390], desktop: [1024, 768] };
for (const [profile, [width, height]] of Object.entries(sizes)) for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
  test(`S2 ${profile} ${game} chrome and real modal owners`, async ({ page }) => {
    test.setTimeout(60000); await page.setViewportSize({ width, height }); await page.goto('/');
    await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 });
    await page.evaluate(async () => { await (await import('/js/uiSkin.js')).selectUiSkin('storybook'); });
    await startNatural(page, game);
    await expect(page.locator('.game-shell-root:visible')).toHaveCount(1);
    const before = await page.locator('.game-shell-root:visible [data-shell-region="board"]').evaluate(node => {
      window.storybookBoard = node; const r = node.getBoundingClientRect(); return [r.width, r.height];
    });
    const menu = { 'memory-match': '#btn-actions-menu', 'link-connect': '#link-actions-menu-toggle', 'triple-connect': '#triple-actions-menu-toggle' }[game];
    const guide = page.locator('.tutorial-guide button'); if (await guide.isVisible()) await guide.click();
    await page.locator(menu).click(); await expect(page.locator('#game-exit-modal .storybook-surface')).toBeVisible();
    await page.locator('#game-exit-modal').getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await expect(page.locator('#settings-modal .storybook-surface')).toBeVisible();
    for (const skin of ['default', 'woodland', 'papercut', 'starship', 'storybook']) {
      await page.evaluate(async skin => { await (await import('/js/uiSkin.js')).selectUiSkin(skin); }, skin);
      expect(await page.locator('#settings-modal .app-modal').evaluate(panel => panel.classList.contains('storybook-surface'))).toBe(skin === 'storybook');
      const result = await page.locator('.game-shell-root:visible [data-shell-region="board"]').evaluate(node => {
        const rect = node.getBoundingClientRect(); return { same: node === window.storybookBoard, size: [rect.width, rect.height] };
      });
      expect(result.same).toBe(true); expect(result.size).toEqual(before);
    }
    const boxes = await page.locator('#settings-modal .app-modal, #settings-modal .app-modal__close').evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom];
    }));
    for (const [left, top, right, bottom] of boxes) { expect(left).toBeGreaterThanOrEqual(0); expect(top).toBeGreaterThanOrEqual(0); expect(right).toBeLessThanOrEqual(width); expect(bottom).toBeLessThanOrEqual(height); }
    await page.screenshot({ path: path.resolve(__dirname, `../../docs/design/achievements/runtime/qa/S2-${profile}-${game}.png`) });
  });
}
test('S2 map five tabs, icon fallback and surface decoration are idempotent', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await page.goto('/');
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    await (await import('/js/uiSkin.js')).selectUiSkin('storybook');
  });
  for (const surface of ['shop', 'collection', 'settings', 'account']) {
    await page.evaluate(async surface => {
      const open = { shop: async () => (await import('/js/shop.js')).openShopOverlay({ gameId: 'link-connect', fromMenu: true }),
        collection: async () => (await import('/js/mainmenu.js')).showCollectionModal({ gameId: 'link-connect' }),
        settings: async () => (await import('/js/settings.js')).showSettingsPanel(false),
        account: async () => (await import('/js/accountPanel.js')).showAccountPanel() };
      await open[surface]();
    }, surface);
    await expect(page.locator('.storybook-surface')).toHaveCount(1);
    await expect(page.locator('.storybook-surface > .storybook-corner-leaves')).toHaveCount(1);
    await page.locator('.storybook-surface .app-modal__close').click(); await expect(page.locator('.storybook-surface')).toHaveCount(0);
  }
  await page.route('**/assets/images/ui/v1/icon-shop.webp', route => route.abort());
  const fallback = await page.evaluate(async () => {
    const { createIcon } = await import('/js/icons.js'); const icon = createIcon('shop'); document.body.append(icon);
    await new Promise(resolve => { const image = icon.querySelector('image'); if (!image) resolve(); else image.addEventListener('error', resolve, { once: true }); });
    const result = icon.querySelector('path') !== null; icon.remove(); return result;
  });
  expect(fallback).toBe(true);
});
