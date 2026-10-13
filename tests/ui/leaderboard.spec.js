import { expect, test } from '@playwright/test';
test.skip(process.env.VITE_FIREBASE_USE_EMULATORS !== '1', 'Isolated Firebase emulator only.');
async function ready(page) {
  await expect.poll(() => page.evaluate(async () => (await import('/js/accountService.js')).getAccountService()?.getState().phase), { timeout: 30000 }).toBe('synced');
  await page.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().ready);
}
async function result(page, durationMs, score = 100) {
  await page.evaluate(async ({ durationMs, score }) => {
    const state = await import('/js/gameState.js');
    state.recordMemoryMatchResult({ mode: 'easy', level: 1, durationMs, score, stars: 3 });
    await (await import('/js/persistence.js')).saveProgress(state.gameState.progress);
    await (await import('/js/leaderboardService.js')).getLeaderboardService().recover();
  }, { durationMs, score });
}
async function own(page) {
  return page.evaluate(async () => {
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const store = await import('/js/leaderboardStore.js'); store.clearLeaderboardCache();
    return (await store.readLeaderboard({ database: backend.database, environment: backend.environment, uid: backend.auth.currentUser.uid, board: { gameId: 'memory-match', mode: 'easy', level: 1, kind: 'time' } })).own;
  });
}
test('durable offline result retries once; slow attempts cannot overwrite best; public names render as text', async ({ page, context }) => {
  test.setTimeout(60000);
  await page.goto('/'); await ready(page);
  await page.evaluate(async () => (await import('/js/accountService.js')).getAccountService().setPlayerName('<img src=x>'));
  await context.setOffline(true);
  await result(page, 1100, 500);
  expect(await page.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().flush())).toBe(false);
  await context.setOffline(false);
  await page.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().flush());
  await expect.poll(async () => (await own(page))?.durationMs).toBe(1100);
  await result(page, 2000, 9999);
  await page.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().flush());
  expect((await own(page)).score).toBe(500);
  await result(page, 1000, 50);
  await page.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().flush());
  expect((await own(page)).score).toBe(50);
  await page.locator('[data-dock-action="ranking"]').click();
  await expect(page.locator('#rankings-modal')).toBeVisible();
  await page.getByLabel('Màn chơi', { exact: true }).fill('1');
  await page.getByLabel('Màn chơi', { exact: true }).dispatchEvent('change');
  await expect(page.locator('.leaderboard-list')).toContainText('<img src=x>');
  await expect(page.locator('.leaderboard-list img')).toHaveCount(0);
  await expect(page.locator('.leaderboard-own')).toContainText('1.00 giây');
  await page.locator('.adventure-screen .adventure-exit').click();
  await expect(page.locator('#rankings-modal')).toHaveCount(0);
  await page.reload(); await ready(page);
  expect((await own(page)).durationMs).toBe(1000);
});

test('a queued result remains bound to the original UID after switching to another Google account', async ({ browser, baseURL }) => {
  test.setTimeout(60000);
  const a = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  const b = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  const first = await a.newPage(); const second = await b.newPage();
  await first.goto('/'); await ready(first);
  await first.evaluate(async () => {
    const url = performance.getEntriesByType('resource').find(entry => entry.name.includes('/deps/firebase_auth.js')).name;
    const auth = await import(url);
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    await auth.linkWithCredential(backend.auth.currentUser, auth.GoogleAuthProvider.credential(JSON.stringify({ sub: 'ranking-google@example.test', email: 'ranking-google@example.test', email_verified: true })));
  });
  await second.goto('/'); await ready(second);
  await b.setOffline(true); await result(second, 500);
  await second.evaluate(async () => {
    const ranking = await import('/js/rankingRules.js');
    ranking.beginRankedAttempt('memory-match', 'endless', 1);
    ranking.stageRankedAttempt('memory-match', 'endless', 100, true);
    ranking.checkpointRankedRun('memory-match', 'endless');
    await (await import('/js/persistence.js')).saveProgress((await import('/js/gameState.js')).gameState.progress);
    await (await import('/js/leaderboardService.js')).getLeaderboardService().recover();
  });
  await second.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().dispose());
  await b.setOffline(false);
  await second.evaluate(async () => {
    const url = performance.getEntriesByType('resource').find(entry => entry.name.includes('/deps/firebase_auth.js')).name;
    const auth = await import(url);
    await (await import('/js/accountService.js')).getAccountService().acceptGoogleCredential(auth.GoogleAuthProvider.credential(JSON.stringify({ sub: 'ranking-google@example.test', email: 'ranking-google@example.test', email_verified: true })));
  });
  await expect(second.locator('#cloud-conflict-modal')).toHaveCount(0);
  await expect.poll(() => second.evaluate(async () => (await import('/js/accountService.js')).getAccountService().getState().phase), { timeout: 30000 }).toBe('synced');
  await second.evaluate(async () => {
    const service = (await import('/js/leaderboardService.js')).initializeLeaderboardService();
    await service.ready; await service.flush();
  });
  expect(await own(second)).toBeNull();
  expect(await second.evaluate(async () => {
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const store = await import('/js/leaderboardStore.js'); store.clearLeaderboardCache();
    return (await store.readLeaderboard({ database: backend.database, environment: backend.environment, uid: backend.auth.currentUser.uid, board: { gameId: 'memory-match', mode: 'endless', kind: 'run', rulesVersion: 2 } })).own;
  })).toBeNull();
  await result(second, 1000);
  await second.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().flush());
  expect((await own(second)).durationMs).toBe(1000);
  await a.close(); await b.close();
});


test('v2 winning settlement is durable offline, retries after reload once and ignores an unfinished board', async ({ page, context }) => {
  test.setTimeout(60000);
  await page.goto('/'); await ready(page);
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'endless'; gameState.settings.sound = gameState.settings.music = false;
    await (await import('/js/gameController.js')).startNewMemoryRun(1);
  });
  await context.setOffline(true);
  const checkpoint = await page.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js');
    gameState.score = 1234; gameState.matchedPairs = gameState.totalPairs;
    await (await import('/js/logic.js')).checkLevelComplete();
    const service = (await import('/js/leaderboardService.js')).getLeaderboardService();
    await service.recover();
    const persistence = await import('/js/persistence.js');
    const durable = await persistence.loadPersistentGameData();
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const pending = await persistence.loadSyncMetadata(`ranking:${backend.environment}:uid:${backend.auth.currentUser.uid}`);
    return { result: durable.progress.memoryMatch.runBestsV2.endless, queue: Object.values(pending.queue).filter(item => item.rulesVersion === 2) };
  });
  expect(checkpoint.result).toMatchObject({ levelReached: 1, totalScore: 1234, rulesVersion: 2, outcome: 'won' });
  expect(checkpoint.queue).toHaveLength(1);
  await context.setOffline(false); await page.reload(); await ready(page);
  const read = () => page.evaluate(async () => {
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const store = await import('/js/leaderboardStore.js'); store.clearLeaderboardCache();
    return (await store.readLeaderboard({ database: backend.database, environment: backend.environment, uid: backend.auth.currentUser.uid, board: { gameId: 'memory-match', mode: 'endless', kind: 'run', rulesVersion: 2 } })).own;
  });
  await page.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().flush());
  await expect.poll(async () => (await read())?.totalScore).toBe(1234);
  expect((await read()).resultId).toBe(checkpoint.result.id);
  const pendingCount = await page.evaluate(async () => {
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const service = (await import('/js/leaderboardService.js')).getLeaderboardService();
    await service.recover(); await service.flush();
    const pending = await (await import('/js/persistence.js')).loadSyncMetadata(`ranking:${backend.environment}:uid:${backend.auth.currentUser.uid}`);
    return Object.keys(pending.queue).length;
  });
  expect(pendingCount).toBe(0);
});

test('a failed real winning settlement rolls checkpoint back and never creates an outbox entry', async ({ page }) => {
  await page.goto('/'); await ready(page);
  const data = await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'endless'; gameState.settings.sound = gameState.settings.music = false;
    await (await import('/js/gameController.js')).startNewMemoryRun(1);
    const persistence = await import('/js/persistence.js');
    let commits = 0; const unsubscribe = persistence.subscribeToLocalCommit(() => commits++);
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value, ...args) {
      if (this.name === 'profile' && value.data?.progress.memoryMatch.runBestsV2?.endless) throw new DOMException('Fixture quota failure', 'QuotaExceededError');
      return original.call(this, value, ...args);
    };
    gameState.score = 2000; gameState.matchedPairs = gameState.totalPairs;
    try { await (await import('/js/logic.js')).checkLevelComplete(); } finally { IDBObjectStore.prototype.put = original; unsubscribe(); }
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const pending = await persistence.loadSyncMetadata(`ranking:${backend.environment}:uid:${backend.auth.currentUser.uid}`);
    return { commits, checkpoint: gameState.progress.memoryMatch.runBestsV2?.endless || null, queued: Object.values(pending?.queue || {}).filter(result => result.rulesVersion === 2).length };
  });
  expect(data).toEqual({ commits: 0, checkpoint: null, queued: 0 });
});

for (const game of [{ id: 'memory-match', key: 'memoryMatch' }, { id: 'link-connect', key: 'linkConnect' }, { id: 'triple-connect', key: 'tripleConnect' }]) for (const mode of ['challenge', 'endless']) {
  test(`${game.id} ${mode} winning controller commits a nonfinal checkpoint`, async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/'); await ready(page);
    await page.evaluate(async ({ id, mode }) => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      const { gameState } = await import('/js/gameState.js');
      gameState.settings.mode = mode; gameState.settings.sound = gameState.settings.music = false;
      if (id === 'memory-match') {
        await (await import('/js/gameController.js')).startNewMemoryRun(1);
        gameState.score = 100; gameState.matchedPairs = gameState.totalPairs;
        await (await import('/js/logic.js')).checkLevelComplete();
      } else if (id === 'link-connect') {
        await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode, level: 1 });
        const { linkGameState } = await import('/js/linkConnect/linkState.js');
        linkGameState.totalPairs = 1; linkGameState.isLocked = false;
        window.rankConnection = (await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(linkGameState.board.grid)[0];
      } else window.rankTriple = await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode, level: 1, skipIntro: true });
    }, { id: game.id, mode });
    if (game.id === 'link-connect') {
      const connection = await page.evaluate(() => window.rankConnection);
      for (const position of [connection.start, connection.end]) await page.locator(`.link-board__cell[data-row="${position.row}"][data-column="${position.column}"] .link-tile`).evaluate(tile => tile.click());
    }
    if (game.id === 'triple-connect') {
      for (const command of await page.evaluate(() => window.rankTriple.generated.witness)) {
        await page.locator(`[data-tile-id="${command.tileId}"]`).click();
        await page.waitForFunction(() => !document.querySelector('.triple-connect__tray-flight, .triple-connect__ghost'));
      }
    }
    await expect.poll(() => page.evaluate(async ({ key, mode }) => (await (await import('/js/persistence.js')).loadPersistentGameData()).progress[key].runBestsV2[mode]?.levelReached, { key: game.key, mode })).toBe(1);
    const data = await page.evaluate(async ({ key, mode }) => {
      const durable = await (await import('/js/persistence.js')).loadPersistentGameData();
      return { checkpoint: durable.progress[key].runBestsV2[mode], run: durable.progress[key].activeRankedRuns[mode] };
    }, { key: game.key, mode });
    expect(data.checkpoint).toMatchObject({ rulesVersion: 2, outcome: 'won', levelReached: 1, gameId: game.id, mode });
    expect(data.run.finalized).toBe(false);
  });
}
