import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('docs/design/app-tabs/qa', { recursive: true });

test('functional tab backgrounds load on demand and never appear on Home', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-dock-action="profile"]')).toBeVisible();
  const paths = ['missions-garden', 'friends-courtyard', 'profile-keepsake', 'settings-retreat'];
  expect(await page.evaluate(paths => performance.getEntriesByType('resource').filter(entry => paths.some(path => entry.name.includes(`${path}.webp`))).length, paths)).toBe(0);
  for (const [index, action] of ['missions', 'friends', 'profile', 'settings'].entries()) {
    await page.locator(`.adventure-page:not([hidden]) [data-dock-action="${action}"]`).click();
    const screen = page.locator(`.adventure-screen[data-screen="${action}"]`);
    await expect(screen).toBeVisible();
    expect(await screen.evaluate(el => getComputedStyle(el).backgroundImage)).toContain(`${paths[index]}.webp`);
    await expect.poll(() => page.evaluate(path => performance.getEntriesByType('resource').some(entry => entry.name.includes(`${path}.webp`)), paths[index])).toBe(true);
    await expect(page.locator('.adventure-screen')).toHaveCount(1);
  }
  await page.locator('.adventure-screen .adventure-exit').click();
  await expect(page.locator('.adventure-screen')).toHaveCount(0);
  expect(await page.locator('.adventure-page:visible').evaluate(el => getComputedStyle(el).backgroundImage)).not.toContain('.webp');
});

for (const viewport of [{ width: 320, height: 740 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) test(`functional screens remain readable and bounded at ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); await page.goto('/');
  for (const action of ['profile', 'settings']) {
    await page.locator(`.adventure-page:not([hidden]) [data-dock-action="${action}"]`).click();
    const screen = page.locator('.adventure-screen'); await expect(screen).toBeVisible();
    expect(await screen.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const body = page.locator('.adventure-screen .app-modal__body');
    expect(await body.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.screenshot({ path: `docs/design/app-tabs/qa/${action}-${viewport.width}.png`, animations: 'disabled' });
    if (action === 'settings') {
      await expect(page.locator('#sound-volume')).toHaveCSS('height', '44px');
      await page.locator('#settings-reset').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `docs/design/app-tabs/qa/settings-actions-${viewport.width}.png`, animations: 'disabled' });
    }
  }
});
