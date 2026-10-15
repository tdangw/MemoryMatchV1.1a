import { expect, test } from '@playwright/test';
import { startMapLevel } from './helpers/adventureNavigation.js';

for (const [gameId, trigger] of [['memory-match', '#btn-actions-menu'], ['link-connect', '#link-actions-menu-toggle'], ['triple-connect', '#triple-actions-menu-toggle']]) {
  test(`${gameId} exit dialog supports restart, dismiss and scoped cleanup`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
    await startMapLevel(page);
    await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
    await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup', /.+/);
    if (gameId === 'memory-match') await expect.poll(() => page.evaluate(async () => (await import('/js/gameState.js')).gameState.isLocked), { timeout: 10000 }).toBe(false);
    const diagnostics = () => page.evaluate(async () => (await import('/js/gameShell/gameShellLifecycle.js')).getActiveGameScope().diagnostics());
    const baseline = await diagnostics();
    await expect(page.locator('.game-actions-menu')).toHaveCount(0);
    for (let i = 0; i < 5; i++) {
      await page.locator(trigger).click();
      await expect(page.locator('#game-exit-modal')).toBeVisible();
      await expect(page.locator('#game-exit-modal .app-modal__footer button')).toHaveText(['Tiếp tục', 'Chơi lại', 'Cài đặt', 'Thoát game']);
      await page.keyboard.press('Escape');
      await expect(page.locator('#game-exit-modal')).toHaveCount(0);
      await expect(page.locator(trigger)).toBeFocused();
      const current = await diagnostics();
      for (const [key, value] of Object.entries(baseline)) {
        if (key === 'timeout') expect(current[key]).toBeLessThanOrEqual(value);
        else expect(current[key]).toEqual(value);
      }
      if (gameId === 'memory-match') expect(await page.evaluate(async () => (await import('/js/gameState.js')).gameState.isPaused)).toBe(false);
    }
    await expect(page.locator('[data-dock-action]')).toHaveCount(0);
    await page.locator(trigger).click();
    await page.locator('#game-exit-modal').getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await expect(page.locator('#settings-modal')).toBeVisible();
    await expect(page.locator('#game-exit-modal')).toHaveCount(0);
    await expect(page.locator('.app-modal-overlay')).toHaveCount(1);
    await page.locator('label[for="toggle-music"]').click();
    await expect(page.locator('#music-volume')).toBeDisabled();
    await page.locator('label[for="toggle-sound"]').click();
    await expect(page.locator('#sound-volume')).toBeDisabled();
    await expect.poll(() => page.evaluate(async () => {
      const data = await (await import('/js/persistence.js')).loadPersistentGameData();
      return [data.settings.music, data.settings.sound];
    })).toEqual([false, false]);
    await page.locator('#settings-modal .app-modal__close').click();
    await expect(page.locator('#settings-modal')).toHaveCount(0);
    await page.locator(trigger).click();
    await page.locator('#game-exit-modal').getByRole('button', { name: 'Chơi lại', exact: true }).click();
    await expect(page.locator('#game-exit-modal')).toHaveCount(0);
    await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup', /.+/);
    await expect(page.locator('.level-reward-overlay')).toHaveCount(0, { timeout: 5000 });
    await page.locator(trigger).click();
    await page.locator('#game-exit-modal').getByRole('button', { name: 'Thoát game', exact: true }).click();
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
    await expect(page.locator('#game-exit-modal')).toHaveCount(0);
  });
}

for (const [gameId, trigger, timer] of [['memory-match', '#btn-actions-menu', '#timer-value'], ['link-connect', '#link-actions-menu-toggle', '#link-timer'], ['triple-connect', '#triple-actions-menu-toggle', '[data-triple-timer]']]) {
  test(`${gameId} pauses and resumes countdown through exit dialog`, async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
    await startMapLevel(page);
    await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup', /.+/);
    await expect(page.locator('.tile, .link-tile, [data-tile-id]').first()).toBeVisible();
    await page.clock.runFor(6000);
    if (gameId === 'memory-match') await expect.poll(() => page.evaluate(async () => (await import('/js/gameState.js')).gameState.isLocked)).toBe(false);
    const paths = [
      { open: () => page.locator(trigger).click(), modal: '#game-exit-modal' },
      { open: async () => {
        await page.locator(trigger).click();
        await page.locator('#game-exit-modal').getByRole('button', { name: 'Cài đặt', exact: true }).click();
        await page.clock.fastForward(300);
      }, modal: '#settings-modal' },
    ];
    for (const path of paths) {
      await path.open();
      await expect(page.locator(path.modal)).toBeVisible();
      const before = await page.locator(timer).textContent();
      await page.clock.fastForward(2500);
      await expect(page.locator(timer)).toHaveText(before);
      await page.locator(`${path.modal} .app-modal__close`).click();
      await page.clock.fastForward(300);
      await expect(page.locator(path.modal)).toHaveCount(0);
      await page.clock.fastForward(1500);
      await expect(page.locator(timer)).not.toHaveText(before);
    }
  });
}
