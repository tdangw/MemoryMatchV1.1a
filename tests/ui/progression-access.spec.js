import { test, expect } from '@playwright/test';

for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) {
  test(`${gameId} offers Easy first and unlocks Normal from a certified win`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
    await page.locator('[data-level="1"]').click();
    const choices = page.locator('#adventure-level-modal input');
    await expect(choices).toHaveCount(4);
    await expect(choices.nth(0)).toBeEnabled();
    for (let i = 1; i < 4; i++) await expect(choices.nth(i)).toBeDisabled();
    await expect(page.locator('.adventure-level-details')).toContainText('2 đợt');
    await page.locator('#adventure-level-modal .app-modal__close').click();
    await page.evaluate(async id => {
      const { gameState } = await import('/js/gameState.js');
      const { getGameProgressKey } = await import('/js/gameCatalog.js');
      gameState.progress[getGameProgressKey(id)].bestByLevel['easy:1'] = { rulesVersion: 1, completedWaves: 2, cleared: true, score: 120, stars: 2 };
    }, gameId);
    await page.locator('[data-level="1"]').click();
    await expect(choices.nth(1)).toBeEnabled();
    await expect(choices.nth(2)).toBeDisabled();
    await choices.nth(1).check();
    await expect(page.locator('#adventure-level-modal .app-modal__title')).toContainText('Trung bình');
  });
}

