import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

mkdirSync('docs/design/special-mode-preview/qa', { recursive: true });
const games = ['memory-match', 'link-connect', 'triple-connect'];
const modes = [['endless', 'Vô tận'], ['challenge', 'Thử thách']];

for (const gameId of games) {
  for (const viewport of [{ width: 320, height: 740 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
    test(`${gameId} special previews are read-only, aligned and bounded at ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
      const snapshot = () => page.evaluate(async () => {
        const { flushPersistentWrites, loadPersistentGameData } = await import('/js/persistence.js');
        await flushPersistentWrites();
        return JSON.stringify(await loadPersistentGameData());
      });
      const before = await snapshot();
      const diagnostics = () => page.evaluate(async () => (await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics());
      const baseline = await diagnostics();
      await page.locator('[data-level="1"]').click();
      const normal = page.locator('#adventure-level-modal .app-modal');
      await expect(normal).toBeVisible();
      const normalBounds = await normal.boundingBox();
      const normalCenter = normalBounds.y + normalBounds.height / 2;
      await page.keyboard.press('Escape');
      await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
      for (let cycle = 0; cycle < 3; cycle++) for (const [mode, label] of modes) {
        const trigger = page.locator(`[data-special-mode="${mode}"]`);
        await trigger.click();
        const dialog = page.locator('#adventure-level-modal');
        const panel = dialog.locator('.app-modal');
        await expect(panel).toHaveAttribute('aria-label', new RegExp(`${label}$`));
        await expect(dialog.locator('input[type="radio"]')).toHaveCount(0);
        const seconds = await page.evaluate(async ({gameId,mode}) => {
          const previews = await import('/js/adventurePreview.js');
          const {gameState} = await import('/js/gameState.js');
          const {getGameDefinition} = await import('/js/gameCatalog.js');
          const read = {'memory-match':previews.previewMemoryLevel,'link-connect':previews.previewLinkLevel,'triple-connect':previews.previewTripleLevel}[gameId];
          return read(mode,1,gameState.progress[getGameDefinition(gameId).progressKey]).timeSeconds;
        }, {gameId,mode});
        await expect(dialog.locator('.adventure-level-details')).toContainText(seconds === 0 ? 'Không giới hạn' : `${seconds}s`);
        await expect(dialog).toContainText('để lập kỷ lục.');
        await expect(page.locator('.game-shell-root:visible')).toHaveCount(0);
        await expect.poll(async () => panel.boundingBox().then(bounds => Math.abs(bounds.y + bounds.height / 2 - normalCenter))).toBeLessThan(2);
        const bounds = await panel.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - 15);
        await expect(dialog.getByRole('button', { name: 'Chơi', exact: true })).toBeInViewport({ ratio: 1 });
        if (cycle === 0 && viewport.width === 412) await page.screenshot({ path: `docs/design/special-mode-preview/qa/${gameId}-${mode}.png`, animations: 'disabled' });
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
        expect(await diagnostics()).toEqual(baseline);
        expect(await snapshot()).toBe(before);
      }
      // Returning to a normal level preserves the last selected normal difficulty.
      await page.locator('[data-level="1"]').click();
      await expect(page.getByRole('radio', { name: 'Dễ', exact: true })).toBeChecked();
    });
  }
}

test('special preview blocks repeated launch and remains retryable after a failed start', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    window.launches = [];
    (await import('/js/adventureMap.js')).configureAdventureMap({ adapters: { 'memory-match': {
      goal: 'Ghép hết các cặp thẻ.',
      preview: () => ({ timeSeconds: 0, target: '30 cặp · 60 thẻ', hints: 3 }),
      launch: options => { window.launches.push(options); return new Promise(resolve => { window.finishLaunch = resolve; }); },
    } } });
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
  });
  await page.locator('[data-special-mode="endless"]').click();
  const dialog = page.locator('#adventure-level-modal');
  const play = dialog.getByRole('button', { name: 'Chơi', exact: true });
  await play.click();
  await expect(play).toBeDisabled();
  await expect(page.locator('[data-special-mode="challenge"]')).toBeDisabled();
  await play.evaluate(button => { button.click(); button.click(); });
  expect(await page.evaluate(() => window.launches)).toEqual([{ mode: 'endless', level: 1, skipIntro: true }]);
  await page.evaluate(() => window.finishLaunch(false));
  await expect(play).toBeEnabled();
  await expect(page.locator('[data-special-mode="challenge"]')).toBeEnabled();
  await play.click();
  expect(await page.evaluate(() => window.launches.length)).toBe(2);
  await page.evaluate(() => window.finishLaunch(false));
  await expect(play).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
