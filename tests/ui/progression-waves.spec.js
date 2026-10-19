import { test, expect } from '@playwright/test';

test('Triple plays two generated silhouettes and only settles after the second wave', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect');
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.sound = gameState.settings.music = false;
    window.tripleWaveRun = await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', skipIntro: true });
  });
  const layouts = [];
  await expect(page.locator('.progression-wave-notice')).toHaveText('Wave 1');
  for (let waveIndex = 1; waveIndex <= 2; waveIndex++) {
    await expect.poll(() => page.evaluate(async () => {
      const session = (await import('/js/sessionProgress.js')).getActiveSession('triple-connect','easy');
      return session?.wave?.phase === 'playing' && window.tripleWaveRun.getState().status === 'playing' && session.wave.index;
    }), { timeout: 15000 }).toBe(waveIndex);
    const solution = await page.evaluate(async () => {
      const state = window.tripleWaveRun.getState();
      const solved = (await import('/js/tripleConnect/tripleSolver.js')).solveTripleState({ initialState: state, maxNodes: 10000, maxMemo: 5000, deadlineMs: 500 });
      if (solved.status !== 'solved') throw new Error('Rendered board cannot be solved: '+solved.status);
      const session = (await import('/js/sessionProgress.js')).getActiveSession('triple-connect','easy');
      return { witness: solved.witness, layoutId: session.layoutId };
    });
    layouts.push(solution.layoutId);
    for (const command of solution.witness) {
      const previous = await page.evaluate(() => window.tripleWaveRun.getState().moves);
      await page.locator(`.triple-connect__board [data-tile-id="${command.tileId}"]`).click();
      await expect.poll(() => page.evaluate(() => window.tripleWaveRun.getState().moves)).toBeGreaterThan(previous);
      await page.waitForFunction(() => !document.querySelector('.triple-connect__tray-flight, .triple-connect__ghost'));
    }
    if (waveIndex === 1) {
      await expect(page.locator('.progression-wave-notice')).toHaveText('Wave 2');
      expect(await page.evaluate(async () => (await import('/js/gameState.js')).gameState.progress.tripleConnect.bestByLevel['easy:1'])).toBeUndefined();
      await expect.poll(() => page.evaluate(async () => (await import('/js/sessionProgress.js')).getActiveSession('triple-connect','easy')?.wave?.index)).toBe(2);
    }
  }
  expect(layouts[0]).not.toBe(layouts[1]);
  await expect(page.locator('#level-summary-modal')).toBeVisible({ timeout: 10000 });
  const best = await page.evaluate(async () => (await import('/js/gameState.js')).gameState.progress.tripleConnect.bestByLevel['easy:1']);
  expect(best.completedWaves).toBe(2);
  expect(best.rulesVersion).toBe(1);
});

test('Link advances waves with shared time, survives reload, and records only a complete level', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.sound = gameState.settings.music = false;
    await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', level: 1, skipIntro: true });
  });
  for (let attempt = 0; attempt < 16; attempt++) {
    await expect.poll(() => page.evaluate(async () => {
      const { linkGameState: s } = await import('/js/linkConnect/linkState.js');
      return s.wave?.phase === 'won' || !s.isLocked;
    }), { timeout: 15000 }).toBe(true);
    const result = await page.evaluate(async () => {
      const { linkGameState: s } = await import('/js/linkConnect/linkState.js');
      const { gameState } = await import('/js/gameState.js');
      if (s.wave.phase === 'won') return { won: true, certified: gameState.progress.linkConnect.bestByLevel['easy:1'] };
      const connections = (await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(s.board.grid);
      const pair = connections.find(({ start, end }) => !s.board.grid[start.row][start.column].frozen && !s.board.grid[end.row][end.column].frozen);
      if (!pair) throw new Error('No playable pair after recovery.');
      const index = s.wave.index;
      for (const p of [pair.start, pair.end]) document.querySelector(`.link-board__cell[data-row="${p.row}"][data-column="${p.column}"] .link-tile`).click();
      return { index, won: false };
    });
    if (result.won) { expect(result.certified.completedWaves).toBe(2); return; }
    await expect.poll(() => page.evaluate(async () => {
      const { linkGameState: s } = await import('/js/linkConnect/linkState.js');
      return s.wave.phase === 'won' || !s.isLocked;
    }), { timeout: 15000 }).toBe(true);
    const checkpoint = await page.evaluate(async () => {
      const { linkGameState: s } = await import('/js/linkConnect/linkState.js');
      return { index: s.wave.index, won: s.wave.phase === 'won', allocatedSeconds: s.wave.allocatedSeconds,
        best: (await import('/js/gameState.js')).gameState.progress.linkConnect.bestByLevel['easy:1'] };
    });
    if (checkpoint.index === 2 && !checkpoint.won && result.index === 1) {
      expect(checkpoint.best).toBeUndefined();
      expect(checkpoint.allocatedSeconds).toBe(100);
      await page.reload();
      await page.evaluate(async () => {
        await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
        const saved = (await import('/js/sessionProgress.js')).getActiveSession('link-connect', 'easy');
        await (await import('/js/linkConnect/linkController.js')).continueLinkSession(saved);
      });
    }
  }
  throw new Error('Link failed to settle within its finite pair budget.');
});

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
