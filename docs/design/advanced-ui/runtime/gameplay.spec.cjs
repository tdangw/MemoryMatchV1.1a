const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs/promises');
const { ready, homeSkin, geometry, disableRemoteServices, installModuleAccess, freezeDevelopmentReloads, choose, verificationContext } = require('./helpers.cjs');
test.setTimeout(120000);
const controls = {
  'memory-match': { menu: '#btn-actions-menu', tools: '#memory-tools-toggle', root: '#game-container' },
  'link-connect': { menu: '#link-actions-menu-toggle', tools: '#link-tools-toggle', root: '#link-connect-container' },
  'triple-connect': { menu: '#triple-actions-menu-toggle', tools: '#triple-tools-toggle', root: '#triple-connect-container' },
};
for (const skin of ['default', 'woodland']) for (const viewport of [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) test(`gameplay ${skin} ${viewport.width}`, async ({ page }) => {
  await freezeDevelopmentReloads(page); await disableRemoteServices(page); await installModuleAccess(page); await page.setViewportSize(viewport);
  const errors = [], proof = []; page.on('pageerror', error => errors.push(error.message));
  const verification = verificationContext(), variant = `${verification.motion}-dpr${verification.dpr}`;
  await ready(page); await homeSkin(page, skin);
  async function shot(game, state) {
    const metrics = await geometry(page), file = `gameplay-${variant}-${skin}-${viewport.width}-${game}-${state}.png`;
    await page.screenshot({ path: path.join(__dirname, 'qa', file), animations: 'disabled' }); proof.push({ game, state, file, metrics });
  }
  for (const game of Object.keys(controls)) {
    const { menu, tools, root } = controls[game];
    await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
    await page.locator('[data-level="1"]').click(); await page.locator('#adventure-level-modal').getByRole('button', { name: 'Chơi', exact: true }).click();
    await expect(page.locator(`${root}:visible`)).toBeVisible();
    await expect(page.locator('.progression-wave-notice')).toBeVisible({ timeout: 10000 });
    await shot(game, 'wave');
    await expect(page.locator('.progression-wave-notice')).toHaveCount(0, { timeout: 10000 });
    await expect(page.locator(tools)).toBeEnabled();
    if (game === 'memory-match') await expect(page.locator(`${root} .stat-timer`)).not.toHaveClass(/is-previewing/);
    await expect(page.locator('.game-shell-root:visible .game-hud')).toHaveCount(1);
    if (game === 'triple-connect') await expect(page.locator('.triple-connect__tray-slot')).toHaveCount(10);
    await shot(game, 'board');
    await page.locator(tools).click(); await expect(page.locator(tools)).toHaveAttribute('aria-expanded', 'true');
    await shot(game, 'tools'); await page.keyboard.press('Escape'); await expect(page.locator(tools)).toHaveAttribute('aria-expanded', 'false');
    await page.locator(`${root} .shell-fullscreen-button`).click();
    await expect(page.locator(`${root} .shell-fullscreen-button`)).toHaveAttribute('aria-pressed', 'true');
    await shot(game, 'fullscreen'); await page.locator(`${root} .shell-fullscreen-button`).click();
    await expect(page.locator(`${root} .shell-fullscreen-button`)).toHaveAttribute('aria-pressed', 'false');
    await page.locator(menu).click(); await shot(game, 'pause');
    await page.locator('#game-exit-modal').getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page.evaluate(async root => { window.previousBoard = document.querySelector(`${root} [data-shell-region="board"]`); }, root);
    await choose(page, skin === 'default' ? 'woodland' : 'default'); await choose(page, skin);
    expect(await page.evaluate(root => window.previousBoard === document.querySelector(`${root} [data-shell-region="board"]`), root)).toBe(true);
    await page.locator('#settings-modal .app-modal__close').click(); await expect(page.locator('#settings-modal')).toHaveCount(0);
    await page.evaluate(async () => { window.lastScope = (await window.productModule('/js/gameShell/gameShellLifecycle.js')).getActiveGameScope(); });
    await page.locator(menu).click(); await page.locator('#game-exit-modal').getByRole('button', { name: 'Thoát game', exact: true }).click();
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
    const disposed = await page.evaluate(() => window.lastScope.diagnostics());
    expect(disposed.active).toBe(false); for (const [kind, count] of Object.entries(disposed)) if (kind !== 'active') expect(count, kind).toBe(0);
    await page.locator('#menu-container .adventure-exit').click(); await expect(page.locator('.game-selector')).toBeVisible();
  }
  expect(errors).toEqual([]);
  await fs.writeFile(path.join(__dirname, 'qa', `gameplay-${variant}-${skin}-${viewport.width}.json`), JSON.stringify({ skin, viewport, verification, sourceDiffAtEnd: verificationContext().sourceDiffSha256, proof, errors }, null, 2));
});
