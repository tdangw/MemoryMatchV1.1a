import { test, expect } from '@playwright/test';

test('Memory advances to a fresh wave without a win, then settles the whole level once', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'easy';
    gameState.settings.sound = gameState.settings.music = false;
    await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
  });
  for (let waveIndex = 1; waveIndex <= 2; waveIndex++) {
    await expect.poll(() => page.evaluate(async () => {
      const { gameState } = await import('/js/gameState.js');
      return !gameState.isLocked && gameState.wave.index;
    }), { timeout: 15000 }).toBe(waveIndex);
    for (let pair = 0; pair < 6; pair++) {
      await page.evaluate(async () => {
        const { memoryBoard } = await import('/js/memoryMatch/memoryBoard.js');
        const { handleTileClick } = await import('/js/logic.js');
        const tiles = [...memoryBoard.tiles.entries()].filter(([, tile]) => !tile.matched);
        const [firstId, first] = tiles[0];
        const [secondId] = tiles.find(([id, tile]) => id !== firstId && tile.imageId === first.imageId);
        await handleTileClick(document.getElementById(firstId));
        await handleTileClick(document.getElementById(secondId));
      });
    }
    if (waveIndex === 1) {
      const state = await page.evaluate(async () => {
        const { gameState } = await import('/js/gameState.js');
        return { index: gameState.wave.index, best: gameState.progress.memoryMatch.bestByLevel['easy:1'],
          allocatedSeconds: gameState.wave.allocatedSeconds };
      });
      expect(state.index).toBe(2);
      expect(state.best).toBeUndefined();
      expect(state.allocatedSeconds).toBe(130);
      await page.reload();
      const resumed = await page.evaluate(async () => {
        await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
        const session = (await import('/js/sessionProgress.js')).getActiveSession('memory-match', 'easy');
        if (!session) throw new Error('Missing durable wave session.');
        await (await import('/js/gameController.js')).continueMemorySession(session);
        const { gameState } = await import('/js/gameState.js');
        return { index: gameState.wave.index, allocatedSeconds: gameState.wave.allocatedSeconds, score: gameState.score };
      });
      expect(resumed.index).toBe(2);
      expect(resumed.allocatedSeconds).toBe(130);
      expect(resumed.score).toBeGreaterThanOrEqual(60);
    }
  }
  await expect.poll(() => page.evaluate(async () => (await import('/js/gameState.js')).gameState.progress.memoryMatch.bestByLevel['easy:1']?.completedWaves)).toBe(2);
  const settled = await page.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js');
    const before = gameState.coins;
    await (await import('/js/logic.js')).checkLevelComplete();
    return { before, after: gameState.coins, phase: gameState.wave.phase,
      session: gameState.progress.memoryMatch.sessionsByMode.easy,
      best: gameState.progress.memoryMatch.bestByLevel['easy:1'] };
  });
  expect(settled.phase).toBe('won');
  expect(settled.after).toBe(settled.before);
  expect(settled.session).toBeUndefined();
  expect(settled.best.rulesVersion).toBe(1);
});
