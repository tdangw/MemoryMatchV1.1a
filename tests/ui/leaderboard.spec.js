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
  await expect(page.locator('.leaderboard-list')).toContainText('<img src=x>');
  await expect(page.locator('.leaderboard-list img')).toHaveCount(0);
  await expect(page.locator('.leaderboard-own')).toContainText('1.00 giây');
  await page.locator('#rankings-modal .app-modal__close').click();
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
  await second.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().dispose());
  await b.setOffline(false);
  await second.evaluate(async () => {
    const url = performance.getEntriesByType('resource').find(entry => entry.name.includes('/deps/firebase_auth.js')).name;
    const auth = await import(url);
    await (await import('/js/accountService.js')).getAccountService().acceptGoogleCredential(auth.GoogleAuthProvider.credential(JSON.stringify({ sub: 'ranking-google@example.test', email: 'ranking-google@example.test', email_verified: true })));
  });
  await expect(second.locator('#cloud-conflict-modal')).toBeVisible();
  await second.getByRole('button', { name: 'Dùng bản máy', exact: true }).click();
  await expect.poll(() => second.evaluate(async () => (await import('/js/accountService.js')).getAccountService().getState().phase), { timeout: 30000 }).toBe('synced');
  await second.evaluate(async () => {
    const service = (await import('/js/leaderboardService.js')).initializeLeaderboardService();
    await service.ready; await service.flush();
  });
  expect(await own(second)).toBeNull();
  await result(second, 1000);
  await second.evaluate(async () => (await import('/js/leaderboardService.js')).getLeaderboardService().flush());
  expect((await own(second)).durationMs).toBe(1000);
  await a.close(); await b.close();
});
