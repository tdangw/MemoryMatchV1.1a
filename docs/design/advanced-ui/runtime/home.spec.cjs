const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs/promises');
const { ready, homeSkin, geometry } = require('./helpers.cjs');
const sizes = [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }];
for (const skin of ['default', 'woodland']) for (const viewport of sizes) test(`Home ${skin} ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); const errors = [], proof = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page); await homeSkin(page, skin);
  async function shot(name) {
    const metrics = await geometry(page), file = `home-${skin}-${viewport.width}-${name}.png`;
    await page.screenshot({ path: path.join(__dirname, 'qa', file), animations: 'disabled' }); proof.push({ name, file, metrics });
  }
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  await shot('carousel');
  for (let index = 0; index < 6; index++) await page.locator('.game-selector__arrow').last().click();
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  await expect(page.locator('.game-selector__controls')).toBeVisible();
  const overlap = await page.evaluate(() => {
    const controls = document.querySelector('.game-selector__controls').getBoundingClientRect();
    const dock = document.querySelector('.game-selector .adventure-dock').getBoundingClientRect();
    return controls.bottom > dock.top + 1;
  }); expect(overlap).toBe(false);
  for (const action of ['missions', 'events', 'profile', 'ranking', 'settings']) {
    await page.locator(`.adventure-page:visible [data-dock-action="${action}"]`).click();
    await expect(page.locator('.adventure-screen .app-modal')).toBeVisible();
    if (action === 'missions' || action === 'events') await expect(page.locator('.navigation-coming-soon')).toHaveText('Sắp ra mắt');
    if (action === 'profile') {
      const edit = page.getByRole('button', { name: 'Sửa tên', exact: true });
      if (await edit.isEnabled()) {
        await edit.click();
        await page.locator('.account-name-input').fill('Người chơi Vườn Trăng'); await shot('name-edit');
        await page.getByRole('button', { name: 'Hủy', exact: true }).click();
      } else {
        await expect(edit).toBeDisabled(); await expect(page.locator('.account-name-input')).toBeDisabled();
        await shot('profile-connection-pending');
      }
    }
    if (action === 'ranking') {
      await page.locator('[data-rank-game="memory-match"]').click();
      await expect(page.locator('.leaderboard-family-menu')).toBeVisible(); await shot('ranking-menu');
      await page.keyboard.press('Escape');
    }
    await shot(action);
  }
  await page.locator('.adventure-screen > .adventure-exit').click();
  await expect(page.locator('.game-selector')).toBeVisible();
  await expect(page.locator('#app-loading')).toHaveCount(0);
  expect(errors).toEqual([]);
  await fs.writeFile(path.join(__dirname, 'qa', `home-${skin}-${viewport.width}.json`), JSON.stringify({ skin, viewport, proof, errors }, null, 2));
});
