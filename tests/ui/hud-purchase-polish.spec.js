import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const sizes = [{ width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }];
const adapter = readFileSync(new URL('./fixtures/adsAdapter.js', import.meta.url), 'utf8');
async function shop(page, game = 'memory-match') {
  await page.evaluate(async game => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game), game);
  await page.evaluate(async () => { (await import('/js/gameState.js')).gameState.coins = 10000; });
  await page.locator('[data-dock-action="shop"]:visible').click();
  await expect(page.locator('.adventure-screen #shop-modal')).toBeVisible();
}

async function startGame(page, game) {
  await page.evaluate(async game => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game);
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'easy'; gameState.settings.music = gameState.settings.sound = false;
    if (game === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
    else if (game === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', level: 1, skipIntro: true });
    else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', level: 1, skipIntro: true });
  }, game);
}

for (const native of [false, true]) for (const size of sizes) {
  test(`purchase stays centered without moving the banner: ${native ? 'native' : 'web'} ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    if (native) {
      await page.route('**/js/ads/platform.js', route => route.fulfill({ contentType: 'text/javascript', body: 'export const isAndroidAdsPlatform = true;' }));
      await page.route('**/js/ads/nativeAdapter.js', route => route.fulfill({ contentType: 'text/javascript', body: adapter }));
    }
    await page.goto('/');
    await shop(page);
    const banner = page.locator(native ? '[data-fake-native-banner]' : '.menu-ad-preview');
    await expect(banner).toHaveCount(1);
    const baseline = await page.locator('.adventure-screen .adventure-footer').boundingBox();
    await page.evaluate(() => { window.purchaseBanner = document.querySelector('.menu-ad-preview, [data-fake-native-banner]'); window.purchaseCalls = window.__adsTest?.calls.length; });
    for (let i = 0; i < 5; i++) {
      await page.locator('#shop-modal .shop-buy-button').first().click();
      const confirmation = page.locator('#shop-confirm-modal .app-modal');
      await expect(confirmation).toBeVisible();
      await expect(banner).toHaveCount(1);
      expect(await page.locator('.adventure-screen .adventure-footer').boundingBox()).toEqual(baseline);
      const box = await confirmation.boundingBox();
      const ad = await banner.boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(15);
      expect(box.y + box.height).toBeLessThanOrEqual(ad.y);
      const usable = await page.locator('#shop-confirm-modal').boundingBox();
      expect(Math.abs(box.y + box.height / 2 - usable.height / 2)).toBeLessThanOrEqual(2);
      expect(await page.evaluate(() => window.purchaseBanner === document.querySelector('.menu-ad-preview, [data-fake-native-banner]'))).toBe(true);
      if (native) expect(await page.evaluate(() => window.__adsTest.calls.length)).toBe(await page.evaluate(() => window.purchaseCalls));
      if (i === 0 && !native) await page.screenshot({ path: `docs/design/hud-purchase/qa/purchase-${size.width}.png` });
      await page.getByRole('button', { name: 'Hủy', exact: true }).click();
      await expect(page.locator('#shop-confirm-modal')).toHaveCount(0);
    }
    await page.locator('#shop-modal .shop-buy-button').first().click();
    await page.getByRole('button', { name: 'Mua ngay', exact: true }).click();
    await expect(page.locator('#shop-confirm-modal')).toHaveCount(0);
    await expect(banner).toHaveCount(1);
    expect(await page.evaluate(() => window.purchaseBanner === document.querySelector('.menu-ad-preview, [data-fake-native-banner]'))).toBe(true);
    if (native) expect(await page.evaluate(() => window.__adsTest.calls.length)).toBe(await page.evaluate(() => window.purchaseCalls));
    expect(await page.locator('.adventure-screen .adventure-footer').boundingBox()).toEqual(baseline);
  });
}

for (const size of sizes) test(`tools use the raised menu frame at ${size.width}`, async ({ page }) => {
  await page.setViewportSize(size);
  await page.goto('/');
  for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
    await startGame(page, game);
    const toggle = page.locator('.game-shell-root:visible [aria-controls$="tools-menu"]');
    await toggle.click();
    const panel = page.locator('.game-shell-root:visible .hud-tool-list').locator('..');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS('border-top-color', 'rgb(198, 172, 107)');
    expect(await panel.evaluate(node => getComputedStyle(node).boxShadow)).toContain('inset');
    await page.mouse.move(2, 2);
    await page.screenshot({ path: `docs/design/hud-purchase/qa/tools-${game}-${size.width}.png` });
  }
});

for (const reducedMotion of ['no-preference', 'reduce']) test(`frozen pair unlock keeps its cleanup with ${reducedMotion}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion });
  await page.goto('/');
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', skipIntro: true });
  });
  for (let i = 0; i < 10; i++) {
    const result = await page.evaluate(async () => {
      const tile = document.querySelector('.link-tile');
      tile.classList.add('is-frozen'); tile.disabled = true;
      (await import('/js/linkConnect/linkRenderer.js')).playLinkFrozenPairUnlock([tile.dataset.tileKey]);
      return { duration: getComputedStyle(tile.querySelector('.link-tile__frost-wipe-line') || tile).animationDuration, reduced: !tile.disabled };
    });
    if (reducedMotion === 'no-preference') {
      expect(result.duration).toBe('0.6s');
      await page.evaluate(() => document.querySelectorAll('.link-tile__frost-wipe *').forEach(node => node.getAnimations().forEach(animation => animation.finish())));
    } else expect(result.reduced).toBe(true);
    await expect(page.locator('.link-tile__frost-wipe')).toHaveCount(0);
    await expect(page.locator('.link-tile').first()).toBeEnabled();
  }
});

test('freeze bar remains distinct on the bright ice surface', async ({ page }) => {
  await page.setViewportSize(sizes[0]);
  await page.goto('/');
  await startGame(page, 'link-connect');
  await page.evaluate(async () => (await import('/js/linkConnect/linkItems.js')).grantLinkItem('freeze', 1));
  await expect.poll(() => page.evaluate(async () => (await import('/js/linkConnect/linkState.js')).linkGameState.isLocked)).toBe(false);
  await page.locator('#link-tools-toggle').click();
  await page.locator('[data-item="freeze"]').click();
  const bar = page.locator('.link-freeze-progress');
  await expect(bar).toHaveCSS('opacity', '1');
  await expect(bar).toHaveCSS('height', '2px');
  expect(await bar.evaluate(node => getComputedStyle(node).backgroundImage)).toContain('rgb(255, 191, 36)');
  await expect(bar).toHaveCSS('left', '0px');
  await expect(bar).toHaveCSS('right', '0px');
  await page.mouse.move(2, 2);
  await page.screenshot({ path: 'docs/design/ui-image-upgrade/qa/freeze-412.png' });
});

test('purchase from gameplay uses the available landscape height', async ({ page }) => {
  await page.setViewportSize(sizes[1]);
  await page.goto('/');
  for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
    await startGame(page, game);
    if (game === 'memory-match') await expect.poll(() => page.evaluate(async () => (await import('/js/gameState.js')).gameState.isLocked), { timeout: 10000 }).toBe(false);
    if (game === 'triple-connect') await page.evaluate(async () => (await import('/js/shop.js')).openTripleTrayExpansionPurchase());
    else {
      await page.evaluate(async game => (await import('/js/shop.js')).openShopOverlay({ gameId: game, fromMenu: false, linkConnect: game === 'link-connect' }), game);
      await page.locator('#shop-modal .shop-buy-button').first().click();
    }
    const panel = page.locator('#shop-confirm-modal .app-modal');
    await expect(panel).toBeVisible();
    const available = sizes[1].height - 58;
    await expect(panel).toHaveCSS('max-height', `${available - 32}px`);
    const bounds = await panel.boundingBox();
    expect(Math.abs(bounds.y + bounds.height / 2 - available / 2)).toBeLessThanOrEqual(2);
    expect(bounds.y).toBeGreaterThanOrEqual(16);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(available - 16);
    await expect(page.getByRole('button', { name: 'Mua ngay', exact: true })).toBeInViewport();
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(page.locator('#shop-confirm-modal')).toHaveCount(0);
    if (game !== 'triple-connect') {
      await page.locator('#shop-modal .app-modal__close').click();
      await expect(page.locator('#shop-modal')).toHaveCount(0);
    }
  }
});
