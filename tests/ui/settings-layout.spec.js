import { expect, test } from '@playwright/test';
test('replacing settings while its previous close is pending keeps the shared controls visible', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 10; i++) {
    await page.evaluate(async () => {
      const { showSettingsPanel } = await import('/js/settings.js');
      const previous = showSettingsPanel(true, () => {}, {}); previous.close();
      window.replacementSettings = showSettingsPanel(true, () => {}, {});
    });
    await expect(page.locator('#settings-container')).toBeVisible();
    await expect(page.locator('#settings-modal')).toHaveCount(1);
    await expect(page.locator('#toggle-sound')).toHaveCount(1);
    await page.locator('#settings-modal .app-modal__close').click();
    await expect(page.locator('#settings-modal')).toHaveCount(0);
    await expect(page.locator('.main-wrapper > #settings-container')).toHaveCount(1);
  }
});
for (const viewport of [{ width: 320, height: 740 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) test(`settings actions scroll with their groups at ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); await page.goto('/'); await page.locator('[data-dock-action="settings"]').click();
  await expect(page.locator('#settings-container .settings-section')).toHaveCount(3);
  expect(await page.locator('#settings-modal').evaluate(el => el.contains(document.activeElement))).toBe(true);
  await expect(page.locator('#settings-modal .app-modal__footer')).toHaveCount(0);
  const reset = page.locator('#settings-reset'); await reset.scrollIntoViewIfNeeded();
  expect(await reset.evaluate(el => !!el.closest('.app-modal__body') && getComputedStyle(el).position === 'static')).toBe(true);
  await reset.click(); await expect(page.locator('#reset-modal')).toBeVisible();
  await page.locator('#reset-modal .app-modal__close').click(); await expect(page.locator('#reset-modal')).toHaveCount(0);
  await expect(page.locator('#settings-modal')).toBeVisible();
  await page.locator('#settings-help').click(); await expect(page.locator('#info-modal')).toBeVisible();
  await page.locator('#info-modal .app-modal__close').click(); await expect(page.locator('#info-modal')).toHaveCount(0);
  await page.locator('#version-info').click(); await expect(page.locator('#version-modal')).toContainText('Memory Match Adventure');
  expect(await page.locator('#settings-container').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
test('audio values persist and settings controls keep one owner over 30 cycles', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-dock-action="settings"]').click();
  await page.locator('#sound-volume').fill('67'); await expect(page.locator('#sound-volume-value')).toHaveText('67%');
  await page.locator('label[for="toggle-sound"]').click(); await expect(page.locator('#sound-volume')).toBeDisabled();
  await page.reload(); await page.locator('[data-dock-action="settings"]').click();
  await expect(page.locator('#sound-volume')).toHaveValue('67'); await expect(page.locator('#toggle-sound')).not.toBeChecked();
  for (let i = 0; i < 30; i++) {
    await page.locator('.adventure-screen [data-dock-action="events"]').click();
    await expect(page.locator('.main-wrapper > #settings-container')).toHaveCount(1);
    await page.locator('.adventure-screen [data-dock-action="settings"]').click();
    await expect(page.locator('#settings-container')).toHaveCount(1);
    await expect(page.locator('#settings-help')).toHaveCount(1);
  }
});
for (const [game, trigger] of [['memory-match', '#btn-actions-menu'], ['link-connect', '#link-actions-menu-toggle'], ['triple-connect', '#triple-actions-menu-toggle']]) test(`${game} settings hands off to help without advancing the active clock`, async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async game => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game);
    const { gameState } = await import('/js/gameState.js'); gameState.settings.sound = gameState.settings.music = false;
    if (game === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
    else if (game === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', skipIntro: true });
    else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', skipIntro: true });
  }, game);
  await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup', /.+/);
  await page.locator(trigger).click();
  await page.locator('#game-exit-modal').getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await expect(page.locator('#settings-modal')).toBeVisible();
  const elapsed = () => page.evaluate(async () => (await import('/js/playMetrics.js')).getActivePlayMetrics().clock.durationMs());
  const before = await elapsed();
  await page.locator('#settings-help').click(); await expect(page.locator('#settings-modal')).toHaveCount(0);
  const help = page.locator(game === 'link-connect' ? '#link-game-info-modal' : '#info-modal');
  await expect(help).toBeVisible();
  await page.waitForTimeout(250); expect((await elapsed()) - before).toBeLessThan(60);
  await help.locator('.app-modal__close').click(); await expect(help).toHaveCount(0);
});
