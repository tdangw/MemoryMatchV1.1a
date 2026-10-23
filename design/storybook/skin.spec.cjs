const { test, expect } = require('@playwright/test');
async function ready(page) { await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 }); }
const choose = (page, skin) => page.evaluate(async skin => (await import('/js/uiSkin.js')).selectUiSkin(skin), skin);
test('S1 five selections, durable reload, default release', async ({ page }) => {
  await ready(page);
  await page.evaluate(async () => { (await import('/js/settings.js')).showSettingsPanel(false); });
  await expect(page.locator('[data-ui-skin-choice]')).toHaveCount(5);
  await page.locator('[data-ui-skin-choice="storybook"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'storybook');
  await page.locator('#settings-modal .app-modal__close').click();
  await expect(page.locator('#settings-modal')).toHaveCount(0);
  for (const skin of ['woodland', 'papercut', 'starship', 'storybook', 'default', 'storybook']) {
    expect((await choose(page, skin)).status).toBe('applied'); await expect(page.locator('html')).toHaveAttribute('data-ui-skin', skin);
  }
  await page.reload(); await expect(page.locator('#app-loading')).toHaveCount(0, { timeout: 20000 });
  await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'storybook');
  expect(await page.evaluate(async () => (await (await import('/js/persistence.js')).loadPersistentGameData()).settings.uiSkin)).toBe('storybook');
  await choose(page, 'default');
  expect((await page.evaluate(async () => (await import('/js/uiSkin.js')).getUiSkinDiagnostics())).decodedImages).toBe(0);
});
test('S1 unavailable core retains saved preference and restores complete fallback', async ({ page }) => {
  await ready(page); await choose(page, 'storybook');
  await page.route('**/assets/ui/storybook/panel.webp', route => route.abort());
  await page.reload(); await expect(page.locator('#app-loading')).toHaveCount(0, { timeout: 20000 });
  await expect(page.locator('html')).toHaveAttribute('data-ui-skin', 'default');
  expect(await page.evaluate(async () => (await (await import('/js/persistence.js')).loadPersistentGameData()).settings.uiSkin)).toBe('storybook');
  await page.unroute('**/assets/ui/storybook/panel.webp'); expect((await choose(page, 'storybook')).status).toBe('applied');
});
test('S1 twenty fast switches keep one bounded cache and reject superseded requests', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const skin = await import('/js/uiSkin.js');
    const results = await Promise.all(Array.from({ length: 20 }, (_, index) => skin.selectUiSkin(index === 19 ? 'storybook' : index % 2 ? 'default' : 'woodland')));
    return { statuses: results.map(result => result.status), diagnostics: skin.getUiSkinDiagnostics() };
  });
  expect(result.statuses.at(-1)).toBe('applied'); expect(result.statuses.slice(0, -1)).not.toContain('error');
  expect(result.diagnostics.retainedSkins).toEqual(['storybook']); expect(result.diagnostics.decodedBytes).toBeLessThan(24 * 1024 * 1024);
});
