import { expect, test } from '@playwright/test';
for (const id of ['memory-match', 'link-connect', 'triple-connect']) for (const mode of ['challenge', 'endless']) {
  test(`${id} ${mode} replay starts at one and retains the best level`, async ({ page }) => {
    await page.goto('/');
    const outcome = await page.evaluate(async ({ id, mode }) => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      const { gameState } = await import('/js/gameState.js');
      const key = (await import('/js/gameCatalog.js')).getGameProgressKey(id);
      const owner = (await import('/js/rankingOwner.js')).getRankingOwner();
      const { createProgressResult } = await import('/js/progressRankingModel.js');
      gameState.settings.mode = mode; gameState.settings.sound = gameState.settings.music = false;
      gameState.progress[key].levelBestsV3 = { [mode]: createProgressResult(id, mode, 100000, owner) };
      let restart;
      if (id === 'memory-match') {
        const controller = await import('/js/gameController.js'); await controller.startNewMemoryRun(8, { skipIntro: true }); restart = () => controller.restartMemoryLevel();
      } else if (id === 'link-connect') {
        const controller = await import('/js/linkConnect/linkController.js'); await controller.startLinkLevel({ mode, level: 8, skipIntro: true }); restart = () => controller.startLinkLevel({ mode, level: 8, restart: true, skipIntro: true });
      } else {
        const controller = await import('/js/tripleConnect/tripleController.js'); await controller.startTripleConnectRound({ mode, level: 8, skipIntro: true }); restart = () => controller.startTripleConnectRound({ mode, level: 8, reason: 'restart', skipIntro: true });
      }
      await restart();
      const save = await (await import('/js/persistence.js')).loadPersistentGameData();
      return { run: save.progress[key].activeRankedRuns[mode], best: save.progress[key].levelBestsV3[mode], session: save.progress[key].sessionsByMode[mode] };
    }, { id, mode });
    expect(outcome.run).toMatchObject({ version: 3, level: 1, clearedLevels: 0, rankable: true });
    expect(outcome.best.levelReached).toBe(100000); expect(outcome.session.level).toBe(1);
  });
}
for (const id of ['memory-match', 'link-connect']) test(`${id} restores the same pair board and score`, async ({ page }) => {
  await page.goto('/');
  const saved = await page.evaluate(async id => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const { gameState } = await import('/js/gameState.js'); gameState.settings.mode = 'challenge';
    gameState.settings.sound = gameState.settings.music = false;
    if (id === 'memory-match') {
      await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
      gameState.score = 37; gameState.moves = 4;
      const previous = (await import('/js/sessionProgress.js')).getActiveSession(id, 'challenge');
      await (await import('/js/memorySession.js')).saveMemorySession({ assetPaths: previous.assetPaths });
    } else {
      await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'challenge', level: 1, skipIntro: true });
      const { linkGameState } = await import('/js/linkConnect/linkState.js'); linkGameState.score = 37; linkGameState.moves = 4;
      // The page owner flushes the canonical session when leaving gameplay.
      await (await import('/js/linkConnect/linkController.js')).runLinkGameAction('menu');
    }
    const session = structuredClone((await import('/js/sessionProgress.js')).getActiveSession(id, 'challenge'));
    const snapshot = session.pairSnapshot;
    snapshot.matchedPairs = 1; snapshot.combo = 3; snapshot.comboRemainingMs = 15000; snapshot.capturedAt = Date.now();
    snapshot.luckyAwards = [{ type: 'coins', value: 10 }];
    if (id === 'memory-match') {
      const pairId = snapshot.tiles[0].id;
      snapshot.tiles.filter(tile => tile.id === pairId).forEach(tile => { tile.matched = true; });
      snapshot.luckyRewards = snapshot.luckyRewards.filter(([key]) => key !== pairId);
    } else {
      const pairId = snapshot.board.grid.flat().find(Boolean).id;
      for (const row of snapshot.board.grid) for (let c = 0; c < row.length; c++) if (row[c]?.id === pairId) row[c] = null;
      snapshot.freezeSeconds = 4;
    }
    await (await import('/js/sessionProgress.js')).saveActiveSession(id, session);
    return structuredClone(session);
  }, id);
  expect(saved.pairSnapshot.score).toBe(37);
  await page.reload();
  const restored = await page.evaluate(async ({ id, session }) => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    if (id === 'memory-match') {
      await (await import('/js/gameController.js')).continueMemorySession(session);
      const { gameState } = await import('/js/gameState.js');
      return { score: gameState.score, combo: gameState.combo, matchedPairs: gameState.matchedPairs, luckyAwards: gameState.luckyAwards, tiles: [...document.querySelectorAll('#grid-container .tile')].map(tile => tile.dataset.imageId) };
    }
    await (await import('/js/linkConnect/linkController.js')).continueLinkSession(session);
    const { linkGameState } = await import('/js/linkConnect/linkState.js');
    return { score: linkGameState.score, combo: linkGameState.combo, matchedPairs: linkGameState.matchedPairs, luckyAwards: linkGameState.luckyAwards, board: linkGameState.board };
  }, { id, session: saved });
  expect(restored.score).toBe(37);
  expect(restored.combo).toBe(3);
  expect(restored.matchedPairs).toBe(1);
  expect(restored.luckyAwards).toEqual(saved.pairSnapshot.luckyAwards);
  if (id === 'memory-match') expect(restored.tiles).toEqual(saved.pairSnapshot.tiles.map(tile => tile.id));
  else expect(restored.board).toEqual(saved.pairSnapshot.board);
});
for (const id of ['memory-match', 'link-connect']) test(`${id} preserves a damaged pair snapshot and refuses to replace its board on resume`, async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async id => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const { gameState, hydrateGameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'challenge';
    if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
    else await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'challenge', level: 1, skipIntro: true });
    const persistence = await import('/js/persistence.js');
    const payload = await persistence.loadPersistentGameData();
    const key = (await import('/js/gameCatalog.js')).getGameProgressKey(id);
    const source = payload.progress[key].sessionsByMode.challenge;
    if (id === 'memory-match') source.pairSnapshot.luckyRewards = [null];
    else source.pairSnapshot.board.grid[0][0] = { id: 'corrupt' };
    hydrateGameState(payload);
    const session = (await import('/js/sessionProgress.js')).getActiveSession(id, 'challenge');
    const retained = structuredClone(session.pairSnapshotSource);
    const continued = id === 'memory-match' ? await (await import('/js/gameController.js')).continueMemorySession(session) : await (await import('/js/linkConnect/linkController.js')).continueLinkSession(session);
    await persistence.saveProgress(gameState.progress);
    const durable = await persistence.loadPersistentGameData();
    return { refused: continued === null, invalid: session.pairSnapshotInvalid, retained, stored: durable.progress[key].sessionsByMode.challenge.pairSnapshotSource };
  }, id);
  expect(result.refused).toBe(true); expect(result.invalid).toBe(true); expect(result.stored).toEqual(result.retained);
});
