const { test, expect } = require('@playwright/test');
const path = require('node:path');
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Reuse the exact module URL Vite supplied to the product after HMR edits.
    window.productModule = path => import(performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === path)?.name || path);
  });
});
async function ready(page) { await page.goto('/'); await page.locator('#app-loading').waitFor({ state: 'detached' }); }
async function settings(page) { await page.locator('.adventure-page:visible [data-dock-action="settings"]').click(); await expect(page.locator('#settings-modal')).toBeVisible(); }
async function choose(page, skin) { await page.locator(`[data-ui-skin-choice="${skin}"]`).click(); await expect(page.locator('html')).toHaveAttribute('data-ui-skin', skin); await expect(page.locator('.skin-choices')).not.toHaveAttribute('aria-busy', 'true'); }
for (const viewport of [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
  test(`choose and reload ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport); const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('/assets/ui/woodland/')) requests.push(request.url()); });
    await ready(page); expect(requests).toEqual([]);
    await settings(page); await choose(page, 'woodland');
    expect(requests.length).toBeGreaterThan(0);
    const state = await page.evaluate(async () => {
      const { gameState } = await window.productModule('/js/gameState.js');
      const { loadPersistentGameData } = await window.productModule('/js/persistence.js');
      const { getUiSkinDiagnostics } = await window.productModule('/js/uiSkin.js');
      return { ram: gameState.settings.uiSkin, saved: (await loadPersistentGameData()).settings.uiSkin, diagnostics: getUiSkinDiagnostics(), overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(state.ram).toBe('woodland'); expect(state.saved).toBe('woodland'); expect(state.overflow).toBe(false);
    expect(state.diagnostics.decodedImages).toBe(37);
    await page.screenshot({ path: path.join(__dirname, 'qa', `settings-woodland-${viewport.width}.png`) });
    await page.reload(); await page.locator('#app-loading').waitFor({ state: 'detached' });
    await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'woodland');
    await settings(page); await choose(page, 'default');
    const count = await page.evaluate(async () => (await window.productModule('/js/uiSkin.js')).getUiSkinDiagnostics().decodedImages);
    expect(count).toBe(0); expect(errors).toEqual([]);
  });
}
test('missing and corrupt artwork keep the complete default skin', async ({ page }) => {
  await ready(page); await settings(page);
  await page.route('**/assets/ui/woodland/nameplate.webp', route => route.fulfill({ status: 200, contentType: 'image/webp', body: 'corrupt' }));
  await page.locator('[data-ui-skin-choice="woodland"]').click();
  await expect(page.locator('#skin-status')).toHaveText('Chưa đổi được giao diện. Hãy thử lại.');
  await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'default');
  const saved = await page.evaluate(async () => (await window.productModule('/js/persistence.js')).loadPersistentGameData());
  expect(saved.settings.uiSkin).not.toBe('woodland');
  await page.unroute('**/assets/ui/woodland/nameplate.webp'); await choose(page, 'woodland');
});
test('twenty rapid choices settle on the last durable selection', async ({ page }) => {
  await ready(page); await settings(page);
  await page.evaluate(() => { for (let i = 0; i < 20; i++) document.querySelector(`[data-ui-skin-choice="${i % 2 ? 'default' : 'woodland'}"]`).click(); });
  await expect(page.locator('.skin-choices')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'default');
  const saved = await page.evaluate(async () => (await window.productModule('/js/persistence.js')).loadPersistentGameData());
  expect(saved.settings.uiSkin || 'default').toBe('default');
});
test('unavailable saved artwork falls back without overwriting the preference', async ({ page }) => {
  await ready(page); await settings(page); await choose(page, 'woodland');
  await page.route('**/assets/ui/woodland/**', route => route.abort('internetdisconnected'));
  await page.reload(); await page.locator('#app-loading').waitFor({ state: 'detached' });
  await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'default');
  await settings(page); await expect(page.locator('#skin-status')).toContainText('Chọn Nâng cao để thử lại');
  const saved = await page.evaluate(async () => (await window.productModule('/js/persistence.js')).loadPersistentGameData());
  expect(saved.settings.uiSkin).toBe('woodland');
  await page.unroute('**/assets/ui/woodland/**'); await choose(page, 'woodland');
});
test('rejected durable save never changes RAM or visual selection', async ({ page }) => {
  await ready(page); await settings(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value, ...args) {
      if (value?.data?.settings?.uiSkin === 'woodland') throw new DOMException('Injected quota failure', 'QuotaExceededError');
      return put.call(this, value, ...args);
    };
  });
  await page.locator('[data-ui-skin-choice="woodland"]').click();
  await expect(page.locator('#skin-status')).toHaveText('Chưa đổi được giao diện. Hãy thử lại.');
  await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'default');
  expect(await page.evaluate(async () => (await window.productModule('/js/gameState.js')).gameState.settings.uiSkin)).toBe('default');
  await expect(page.locator('#persistence-recovery-modal')).toBeVisible();
});
test('profile hydration cancels an old asset load', async ({ page }) => {
  await ready(page); await settings(page);
  let release; const gate = new Promise(resolve => { release = resolve; }); let requested;
  const entered = new Promise(resolve => { requested = resolve; });
  await page.route('**/assets/ui/woodland/nameplate.webp', async route => { requested(); await gate; await route.continue(); });
  await page.locator('[data-ui-skin-choice="woodland"]').click(); await entered;
  await page.evaluate(async () => {
    const { hydrateGameState } = await window.productModule('/js/gameState.js'); hydrateGameState({ settings: { uiSkin: 'default' } });
    await (await window.productModule('/js/uiSkin.js')).restoreUiSkin();
  });
  release(); await expect(page.locator('.skin-choices')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'default');
});
test('changing skins preserves the mounted board, round and pause contract', async ({ page }) => {
  await ready(page);
  await page.locator('.game-selector__choice[data-game-id="memory-match"]').click();
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  await page.locator('[data-level="1"]').click();
  await page.locator('#adventure-level-modal').getByRole('button', { name: 'Chơi', exact: true }).click();
  await expect(page.locator('.progression-wave-notice')).toHaveCount(0, { timeout: 10000 });
  await page.locator('#btn-actions-menu').click();
  await page.locator('#game-exit-modal').getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await expect(page.locator('#settings-modal')).toBeVisible();
  const before = await page.evaluate(async () => {
    const { gameState } = await window.productModule('/js/gameState.js');
    window.skinBoard = document.querySelector('#game-container [data-shell-region="board"]');
    return { round: gameState.roundId, moves: gameState.moves, coins: gameState.coins, time: gameState.remainingTime, paused: gameState.isPaused };
  });
  await choose(page, 'woodland'); await choose(page, 'default');
  const after = await page.evaluate(async () => {
    const { gameState } = await window.productModule('/js/gameState.js');
    return { same: window.skinBoard === document.querySelector('#game-container [data-shell-region="board"]'), round: gameState.roundId, moves: gameState.moves, coins: gameState.coins, time: gameState.remainingTime, paused: gameState.isPaused };
  });
  expect(after).toEqual({ same: true, ...before }); expect(before.paused).toBe(true);
  await page.locator('#settings-modal .app-modal__close').click();
  await expect(page.locator('#settings-modal')).toHaveCount(0);
  expect(await page.evaluate(async () => (await window.productModule('/js/gameState.js')).gameState.isPaused)).toBe(false);
});
