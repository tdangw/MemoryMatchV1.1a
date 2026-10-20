const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs/promises');
const sizes = [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }];
for (const viewport of sizes) test(`representative screens ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.locator('#app-loading').waitFor({ state: 'detached' });
  await page.addStyleTag({ url: '/docs/design/advanced-ui/screens/review.css' });
  await page.addStyleTag({ url: '/styles/ui-skin-icons.css' });
  await page.evaluate(() => { document.documentElement.dataset.uxReview = 'woodland'; document.documentElement.dataset.uiSkin = 'woodland'; });
  const proof = [];
  async function shot(name, fixture = false) {
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      panels: [...document.querySelectorAll('.app-modal')].filter(el => el.getBoundingClientRect().width).map(el => {
        const r = el.getBoundingClientRect(); const body = el.querySelector('.app-modal__body');
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, bodyOverflow: body ? body.scrollWidth > body.clientWidth : false };
      }),
    }));
    expect(geometry.overflow, name).toBe(false);
    for (const panel of geometry.panels) {
      expect(panel.left, name).toBeGreaterThanOrEqual(-1);
      expect(panel.right, name).toBeLessThanOrEqual(viewport.width + 1);
      expect(panel.bottom, name).toBeLessThanOrEqual(viewport.height + 1);
      expect(panel.bodyOverflow, name).toBe(false);
    }
    const file = `${name}-${viewport.width}.png`;
    await page.screenshot({ path: path.join(__dirname, 'qa', file), animations: 'disabled' });
    proof.push({ name, file, fixture, geometry });
  }
  await shot('home');
  for (const action of ['missions', 'events', 'profile', 'ranking', 'settings']) {
    await page.locator(`.adventure-page:visible [data-dock-action="${action}"]`).click();
    await expect(page.locator('.adventure-screen')).toBeVisible(); await shot(`home-${action}`);
  }
  await page.locator('.adventure-screen > .adventure-exit').click();
  for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
    await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), game);
    await shot(`${game}-map`);
    await page.locator('[data-chest="1"]').click();
    await expect(page.locator('#adventure-chest-modal .treasure-cards')).toBeVisible();
    await shot(`${game}-treasure`);
    await page.locator('#adventure-chest-modal .app-modal__close').click();
    await page.locator('[data-level="1"]').click();
    await expect(page.locator('#adventure-level-modal')).toBeVisible(); await shot(`${game}-preview`);
    await page.locator('#adventure-level-modal .app-modal__close').click();
    await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
    for (const action of ['shop', 'collection', 'ranking', 'settings']) {
      await page.locator(`.adventure-page:visible [data-dock-action="${action}"]`).click();
      await expect(page.locator('.adventure-screen')).toBeVisible(); await shot(`${game}-${action}`);
      if (action === 'shop' || action === 'collection') {
        const tabs = page.locator('.adventure-screen [role="tablist"] button');
        const count = await tabs.count();
        for (let i = 1; i < count; i++) { await tabs.nth(i).click(); await shot(`${game}-${action}-tab${i + 1}`); }
      }
    }
    await page.locator('.adventure-screen [data-dock-action="map"]').click();
    await page.evaluate(async id => {
      const { gameState } = await import('/js/gameState.js'); gameState.settings.sound = false; gameState.settings.music = false;
      if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
      else if (id === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', level: 1, skipIntro: true });
      else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', level: 1, skipIntro: true });
    }, game);
    await expect(page.locator('.game-shell-root:visible')).toHaveCount(1);
    await expect(page.locator('.progression-wave-notice')).toHaveCount(0, { timeout: 10000 });
    await shot(`${game}-gameplay`);
    const trigger = { 'memory-match': '#btn-actions-menu', 'link-connect': '#link-actions-menu-toggle', 'triple-connect': '#triple-actions-menu-toggle' }[game];
    await page.locator(trigger).click(); await shot(`${game}-pause`);
    await page.locator('#game-exit-modal .app-modal__close').click(); await expect(page.locator('#game-exit-modal')).toHaveCount(0);
    await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ level: 1, stars: 2, score: 194, coinsEarned: 26, remainingTime: 73, moves: 11, misses: 0, timeBonus: 0, settings: {}, onNext: () => {}, onMenu: () => {} }));
    await shot(`${game}-win`, true);
    await page.locator('#level-summary-modal').getByRole('button', { name: 'Menu', exact: true }).click(); await expect(page.locator('#level-summary-modal')).toHaveCount(0);
    await page.evaluate(async () => (await import('/js/ui.js')).openTimeUpModal({ onRestart: () => {}, onMenu: () => {} }));
    await shot(`${game}-loss`, true);
    await page.locator('#time-up-modal .app-modal__close').click(); await expect(page.locator('#time-up-modal')).toHaveCount(0);
    await page.evaluate(async () => (await import('/js/modal.js')).showAppToast('Đã lưu lựa chọn của bạn.', { tone: 'success', duration: 1600 }));
    await shot(`${game}-toast`, true);
    await expect(page.locator('.app-toast')).toHaveCount(0);
  }
  await fs.writeFile(path.join(__dirname, 'qa', `proof-${viewport.width}.json`), JSON.stringify({ viewport, scope: 'G1 injected design CSS on product DOM; fixture outcomes do not prove reward settlement', proof, errors }, null, 2));
  expect(errors).toEqual([]);
});

