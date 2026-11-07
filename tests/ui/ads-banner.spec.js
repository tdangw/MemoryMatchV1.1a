import { expect, test } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { startMapLevel, previewMapLevel, closeLevelPreview } from './helpers/adventureNavigation.js';

const adapter = readFileSync(new URL('./fixtures/adsAdapter.js', import.meta.url), 'utf8');
mkdirSync('docs/ads/qa', { recursive: true });
async function mockNative(page, scenario = 'success') {
  await page.addInitScript(value => { window.__adsScenario = value; }, scenario);
  await page.route('**/js/ads/platform.js', route => route.fulfill({ contentType: 'text/javascript', body: 'export const isAndroidAdsPlatform = true;' }));
  await page.route('**/js/ads/nativeAdapter.js', route => route.fulfill({ contentType: 'text/javascript', body: adapter }));
}
async function settled(page) {
  await page.evaluate(async () => { const m = await import('/js/ads/menuAds.js'); const r = await m.initializeMenuAds(); await r.controller.idle(); });
}
async function visible(page) { await expect(page.locator('[data-fake-native-banner]')).toHaveCount(1); }
async function absent(page) { await expect(page.locator('[data-fake-native-banner]')).toHaveCount(0); }
async function openGameMap(page, game) {
  const titles = { 'memory-match': 'Memory Match', 'link-connect': 'Link Connect', 'triple-connect': 'Triple Connect' };
  await page.getByRole('button', { name: `Chọn ${titles[game]}`, exact: true }).click();
  const card = page.locator(`.game-selector__choice[data-game-id="${game}"]`);
  await expect(card).toHaveClass(/is-selected/);
  await card.click();
}

for (const viewport of [{ width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
  test(`banner preserves dock clearance and home/map layout at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport); await mockNative(page); await page.goto('/'); await visible(page);
    const slot = page.locator('.adventure-ad-slot');
    await expect(slot).toHaveAttribute('data-native-ad', 'visible');
    expect((await slot.boundingBox()).height).toBe(68);
    const dock = await page.locator('.adventure-dock').boundingBox();
    expect(dock.y + dock.height).toBeLessThanOrEqual(viewport.height - 68 + 1);
    const selected = await page.locator('.game-selector__choice.is-selected').boundingBox();
    expect(selected.y + selected.height).toBeLessThanOrEqual(dock.y + 1);
    const controls = await page.locator('.game-selector__controls').boundingBox();
    expect(controls.y + controls.height).toBeLessThanOrEqual(dock.y + 1);
    await page.screenshot({ path: `docs/ads/qa/banner-mock-${viewport.width}.png` });
    for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
      await openGameMap(page, game);
      await expect(page.locator('[data-map-ready="true"]')).toBeVisible(); await visible(page);
      await page.locator('.adventure-map-page .adventure-exit').click(); await visible(page);
    }
    expect(await page.evaluate(() => window.__adsTest.maximum)).toBe(1);
  });
}

test('functional placements and privacy options keep the correct banner owner', async ({ page }) => {
  await mockNative(page); await page.goto('/'); await visible(page);
  for (const tab of ['missions', 'events', 'profile', 'ranking', 'settings']) {
    await page.locator(`[data-dock-action="${tab}"]`).click(); await visible(page);
    if (tab === 'settings') {
      await expect(page.locator('#settings-ad-privacy')).toBeVisible();
      await page.locator('#settings-ad-privacy').click();
      await expect.poll(() => page.evaluate(() => window.__adsTest.calls.filter(([name]) => name === 'privacy').length)).toBe(1);
      await page.locator('#settings-privacy-policy').click();
      await expect(page.locator('#privacy-policy-modal')).toBeVisible();
      await absent(page);
      await expect(page.locator('#privacy-policy-modal')).not.toContainText(/UID|API|schema|nội bộ|SDK/);
      await page.locator('#privacy-policy-modal .app-modal__close').click();
    }
    await page.locator('.adventure-screen > .adventure-exit').click(); await visible(page);
  }
  await page.locator('.game-selector__choice[data-game-id="memory-match"]').click(); await visible(page);
  for (const tab of ['shop', 'collection', 'ranking', 'settings']) {
    await page.locator(`[data-dock-action="${tab}"]`).click();
    await visible(page);
    await page.locator('.adventure-screen [data-dock-action="map"]').click(); await visible(page);
  }
});

test('preview, gameplay and restart retain one banner for all three games', async ({ page }) => {
  await mockNative(page); await page.goto('/'); await visible(page);
  for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
    await openGameMap(page, game); await visible(page);
    await previewMapLevel(page); await visible(page);
    await closeLevelPreview(page); await visible(page);
    await startMapLevel(page);
    await page.getByRole('button', { name: 'Bỏ qua', exact: true }).click();
    await visible(page);
    const trigger = game === 'memory-match' ? '#btn-actions-menu' : game === 'link-connect' ? '#link-actions-menu-toggle' : '#triple-actions-menu-toggle';
    await expect(page.locator(trigger)).toBeVisible();
    await page.locator(trigger).click();
    await page.locator('#game-exit-modal').getByRole('button', { name: 'Chơi lại', exact: true }).click();
    await expect(page.locator('#game-exit-modal')).toHaveCount(0); await visible(page);
    // Starting a round disposes the old menu owner; returning does not create two.
    await page.evaluate(async () => { (await import('/js/gameSelector.js')).showGameSelector(); });
    await visible(page);
  }
  expect(await page.evaluate(() => window.__adsTest.maximum)).toBe(1);
});

test('foreground, keyboard, resize and page restoration reconcile one banner', async ({ page }) => {
  await mockNative(page); await page.goto('/'); await visible(page);
  await page.evaluate(() => window.__adsTest.foreground(false)); await absent(page);
  await page.evaluate(() => window.__adsTest.foreground(true)); await visible(page);
  await page.evaluate(() => { const input = document.createElement('input'); input.id = 'ads-keyboard-test'; document.body.append(input); input.focus(); });
  await absent(page);
  await page.evaluate(() => document.getElementById('ads-keyboard-test').remove());
  await page.locator('.game-selector__choice.is-selected').focus(); await visible(page);
  await page.setViewportSize({ width: 844, height: 390 }); await settled(page); await visible(page);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await absent(page);
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow'))); await visible(page);
  expect(await page.evaluate(() => window.__adsTest.maximum)).toBe(1);
});

test('30 fast page cycles and final disposal release native listeners', async ({ page }) => {
  await mockNative(page); await page.goto('/'); await visible(page);
  await page.evaluate(async () => {
    const menus = await import('/js/gameSelector.js'), ads = await import('/js/ads/menuAds.js');
    for (let i = 0; i < 30; i++) {
      menus.openGameMenu('memory-match'); menus.showGameSelector();
      const runtime = await ads.initializeMenuAds(); await runtime.controller.idle();
    }
  });
  await visible(page);
  expect(await page.evaluate(() => window.__adsTest.listenerCount())).toBe(2);
  await page.evaluate(async () => { const r = await (await import('/js/ads/menuAds.js')).initializeMenuAds(); await r.dispose(); });
  await absent(page);
  expect(await page.evaluate(() => window.__adsTest.listenerCount())).toBe(0);
  expect(await page.evaluate(() => window.__adsTest.maximum)).toBe(1);
});

test('no-fill releases the reservation without automatic retry and gameplay stays available', async ({ page }) => {
  await mockNative(page, 'no-fill'); await page.goto('/');
  await expect(page.locator('.adventure-ad-slot')).toHaveAttribute('data-native-ad', 'empty');
  await settled(page);
  expect((await page.locator('.adventure-ad-slot').boundingBox()).height).toBe(0);
  expect(await page.evaluate(() => window.__adsTest.listenerCount())).toBe(0);
  expect(await page.evaluate(() => window.__adsTest.calls.filter(([name]) => name === 'show').length)).toBe(1);
  await page.locator('.game-selector__choice[data-game-id="memory-match"]').click();
  await startMapLevel(page); await absent(page);
});

test('web never imports native ads and public privacy page matches the in-game policy', async ({ page, request }) => {
  const imports = [];
  page.on('request', req => { if (req.url().includes('/js/ads/nativeAdapter.js')) imports.push(req.url()); });
  await page.goto('/'); await expect(page.locator('.game-selector')).toBeVisible();
  await page.locator('[data-dock-action="settings"]').click();
  await expect(page.locator('#settings-ad-privacy')).toBeHidden();
  await page.locator('#settings-privacy-policy').click();
  await page.setViewportSize({ width: 412, height: 915 });
  await page.screenshot({ path: 'docs/ads/qa/privacy-settings-412.png' });
  const content = await page.locator('#privacy-policy-modal .app-modal__body').innerHTML();
  expect(imports).toEqual([]);
  const policy = await request.get('/legal/privacy.html'); expect(policy.ok()).toBe(true);
  expect(await policy.text()).toContain(content.trim());
  expect(await (await request.get('/app-ads.txt')).text()).toBe('google.com, pub-2780380420199964, DIRECT, f08c47fec0942fa0\n');
  await page.setViewportSize({ width: 412, height: 915 }); await page.goto('/legal/privacy.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/ads/qa/privacy-412.png', fullPage: true });
});
