import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

mkdirSync('docs/design/ui-image-upgrade/qa', { recursive: true });
const sizes = [{ width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }];
const games = ['memory-match', 'link-connect', 'triple-connect'];

async function start(page, game) {
  await page.evaluate(async game => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game);
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.sound = gameState.settings.music = false;
    if (game === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
    else if (game === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', level: 1, skipIntro: true });
    else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', level: 1, skipIntro: true });
  }, game);
  await expect(page.locator('.gameplay-ad-slot .menu-ad-preview')).toBeVisible();
}

for (const size of sizes) {
  test(`five cards and three flowers fill the banner at ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    for (const [scene, selector, count] of [['cards', '.ad-art-card', 5], ['garden', '.ad-art-flower', 3]]) {
      await expect(page.locator('.ad-art-scene')).toHaveAttribute('data-ad-scene', scene);
      const pieces = page.locator(selector);
      await expect(pieces).toHaveCount(count);
      await page.locator('.menu-ad-preview').evaluate(node => {
        for (const animation of node.getAnimations({ subtree: true })) { animation.currentTime = 2000; animation.pause(); }
      });
      const bounds = await page.locator('.ad-art-scene').boundingBox();
      const first = await pieces.first().boundingBox(), last = await pieces.last().boundingBox();
      expect(first.x).toBeGreaterThanOrEqual(bounds.x);
      expect(last.x + last.width).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(last.x - first.x).toBeGreaterThan(bounds.width * .6);
      await page.screenshot({ path: `docs/design/ui-image-upgrade/qa/${scene}-${size.width}.png` });
      await page.locator('.ad-art-scene').evaluate(node => node.getAnimations().find(a => a.animationName === 'ad-art-scene-cycle').finish());
    }
  });

  test(`all games keep their banner and board through results at ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    for (const game of games) {
      await start(page, game);
      await page.evaluate(() => { window.savedBanner = document.querySelector('.menu-ad-preview'); });
      const board = await page.locator('.game-shell-root:visible [data-shell-region="board"]').boundingBox();
      await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ level: 1, score: 275, stars: 3, coinsEarned: 18, moves: 8, misses: 1, remainingTime: 77, settings: {} }));
      await expect(page.locator('#level-summary-modal')).toBeVisible();
      const panel = await page.locator('#level-summary-modal .app-modal').boundingBox();
      const slot = await page.locator('.gameplay-ad-slot').boundingBox();
      expect(panel.y + panel.height).toBeLessThanOrEqual(slot.y);
      expect(await page.locator('.game-shell-root:visible [data-shell-region="board"]').boundingBox()).toEqual(board);
      expect(await page.evaluate(() => window.savedBanner === document.querySelector('.menu-ad-preview'))).toBe(true);
      await expect(page.locator('#level-summary-modal .app-modal__footer button').last()).toBeInViewport();
      await page.screenshot({ path: `docs/design/ui-image-upgrade/qa/win-${game}-${size.width}.png` });
      await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
      await expect(page.locator('#level-summary-modal')).toHaveCount(0);
    }
  });

  test(`chapter celebration clears the banner and releases its observer at ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    await start(page, 'triple-connect');
    const result = await page.evaluate(async () => {
      const owner = (await import('/js/gameShell/gameShellLifecycle.js')).getActiveGameScope();
      window.chapterBefore = owner.diagnostics();
      window.chapterBanner = document.querySelector('.menu-ad-preview');
      window.chapterScene = (await import('/js/victoryCelebration.js')).showVictoryCelebration({ level: 100, settings: {} });
      return { active: window.chapterScene.active };
    });
    expect(result.active).toBe(true);
    const slot = await page.locator('.gameplay-ad-slot').boundingBox();
    const scene = await page.locator('#victory-celebration').boundingBox();
    expect(scene.y + scene.height).toBe(slot.y);
    for (const button of await page.locator('.victory-action').all()) {
      const box = await button.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(slot.y);
      await expect(button).toBeInViewport();
    }
    await page.screenshot({ path: `docs/design/ui-image-upgrade/qa/chapter-${size.width}.png` });
    await page.setViewportSize({ width: size.height, height: size.width });
    const rotatedSlot = await page.locator('.gameplay-ad-slot').boundingBox();
    const rotatedScene = await page.locator('#victory-celebration').boundingBox();
    expect(rotatedScene.y + rotatedScene.height).toBe(rotatedSlot.y);
    const after = await page.evaluate(async () => {
      window.chapterScene.dispose(); window.chapterScene.dispose();
      const owner = (await import('/js/gameShell/gameShellLifecycle.js')).getActiveGameScope();
      return { before: window.chapterBefore, after: owner.diagnostics(), same: window.chapterBanner === document.querySelector('.menu-ad-preview'), scene: window.chapterScene.diagnostics() };
    });
    expect(after.same).toBe(true);
    expect(after.after).toEqual(after.before);
    for (const [key, value] of Object.entries(after.scene)) expect(value).toBe(key === 'active' ? false : 0);
    await expect(page.locator('#victory-celebration')).toHaveCount(0);
  });
}

test('ordinary nested dialogs retain the native banner; sensitive dialogs still block it', async ({ page }) => {
  const adapter = readFileSync(new URL('./fixtures/adsAdapter.js', import.meta.url), 'utf8');
  await page.route('**/js/ads/platform.js', route => route.fulfill({ contentType: 'text/javascript', body: 'export const isAndroidAdsPlatform = true;' }));
  await page.route('**/js/ads/nativeAdapter.js', route => route.fulfill({ contentType: 'text/javascript', body: adapter }));
  await page.goto('/');
  await expect(page.locator('[data-fake-native-banner]')).toHaveCount(1);
  const result = await page.evaluate(async () => {
    const { openAppModal } = await import('/js/modal.js');
    const runtime = await (await import('/js/ads/menuAds.js')).initializeMenuAds();
    const node = document.querySelector('[data-fake-native-banner]'), calls = window.__adsTest.calls.length;
    for (let i = 0; i < 30; i++) {
      const parent = openAppModal({ id: 'banner-parent', title: 'Thông tin' });
      const child = openAppModal({ id: 'banner-child', title: 'Phần thưởng' });
      child.destroy(); parent.destroy();
    }
    await runtime.controller.idle();
    return { same: node === document.querySelector('[data-fake-native-banner]'), calls, after: window.__adsTest.calls.length };
  });
  expect(result.same).toBe(true); expect(result.after).toBe(result.calls);
  await page.locator('[data-dock-action="settings"]').click();
  await page.locator('#settings-privacy-policy').click();
  await expect(page.locator('[data-fake-native-banner]')).toHaveCount(0);
  await page.evaluate(async () => { window.nested = (await import('/js/modal.js')).openAppModal({ id: 'banner-child', title: 'Thông tin' }); });
  await page.evaluate(() => window.nested.destroy());
  await expect(page.locator('[data-fake-native-banner]')).toHaveCount(0);
  await page.locator('#privacy-policy-modal .app-modal__close').click();
  await expect(page.locator('[data-fake-native-banner]')).toHaveCount(1);
  expect(await page.evaluate(() => window.__adsTest.maximum)).toBe(1);
});
