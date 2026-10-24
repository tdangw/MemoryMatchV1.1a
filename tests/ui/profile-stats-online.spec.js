import { expect, test } from '@playwright/test';
test.skip(process.env.VITE_FIREBASE_USE_EMULATORS !== '1', 'Isolated Firebase emulators only.');
async function ready(page) {
  await expect.poll(() => page.evaluate(async () => (await import('/js/accountService.js')).getAccountService()?.getState().phase), { timeout: 30000 }).toBe('synced');
  await expect.poll(() => page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService()?.getState().onlineAccount)).toBe(true);
  await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().syncNow());
}
async function google(page, email, link = false) {
  await page.evaluate(async ({ email, link }) => {
    const url = performance.getEntriesByType('resource').find(item => item.name.includes('/deps/firebase_auth.js')).name;
    const auth = await import(url); const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const credential = auth.GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true }));
    if (link) await auth.linkWithCredential(backend.auth.currentUser, credential);
    else await (await import('/js/accountService.js')).getAccountService().acceptGoogleCredential(credential);
  }, { email, link });
}
async function addTime(page, milliseconds) {
  await page.evaluate(async milliseconds => {
    const original = performance.now.bind(performance); let now = 0;
    Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
    const scope = (await import('/js/gameShell/gameShellLifecycle.js')).createGameShellLifecycle();
    const metrics = await import('/js/playMetrics.js');
    const record = metrics.beginPlayMetrics(scope, { gameId: 'memory-match', mode: 'easy', level: 1 });
    record.clock.resume('startup'); now = milliseconds; metrics.finishPlayMetrics(); scope.dispose();
    Object.defineProperty(performance, 'now', { configurable: true, value: original });
    await (await import('/js/profileStatsService.js')).getProfileStatsService().flushLocal();
  }, milliseconds);
}
test('offline/reload retry and a second device add once; linking preserves account creation date', async ({ browser, baseURL }) => {
  test.setTimeout(90000);
  const a = await browser.newContext({ baseURL }); const b = await browser.newContext({ baseURL });
  const first = await a.newPage(); const second = await b.newPage();
  const statisticsWarnings = [];
  first.on('console', message => { if (message.text().includes('Invalid linked profile owner')) statisticsWarnings.push(message.text()); });
  await first.goto('/'); await ready(first);
  const created = await first.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().joinedAt);
  await google(first, `profile-${Date.now()}@example.test`, true); await ready(first);
  expect(await first.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().joinedAt)).toBe(created);
  const email = await first.evaluate(async () => (await (await import('/js/firebaseBackend.js')).getFirebaseBackend()).auth.currentUser.email);
  await a.setOffline(true); await addTime(first, 60000);
  expect(await first.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().syncNow())).toBe(false);
  await a.setOffline(false); await first.reload(); await ready(first);
  const total = page => page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs);
  await expect.poll(() => total(first)).toBe(60000);
  await second.goto('/'); await ready(second); await google(second, email); await ready(second);
  await expect.poll(() => total(second)).toBe(60000);
  await addTime(second, 120000); await second.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().syncNow());
  await first.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().syncNow());
  await expect.poll(() => total(first)).toBe(180000); await expect.poll(() => total(second)).toBe(180000);
  await second.evaluate(async () => { const service = (await import('/js/profileStatsService.js')).getProfileStatsService(); await service.syncNow(); await service.syncNow(); });
  expect(await total(second)).toBe(180000);
  expect(statisticsWarnings).toEqual([]);
  await a.close(); await b.close();
});

test('new UID waits for stale sync and an old error cannot replace its private state', async ({ page }) => {
  test.setTimeout(60000);
  await page.route('**/js/profileStatsStore.js*', route => route.fulfill({ contentType: 'text/javascript', body: `export async function publishProfileCounter({ uid, local, isCurrent }) {
    window.statsRequests ||= []; window.statsResolvers ||= [];
    window.statsRequests.push(uid);
    if (window.holdStats) await new Promise((resolve, reject) => window.statsResolvers.push({ resolve, reject }));
    if (!isCurrent()) throw new Error('Old request');
    return { counters: { [local.counterId]: local.totalMs }, totalPlayMs: local.totalMs, trackedSince: local.trackedSince };
  }` }));
  await page.goto('/'); await ready(page);
  const oldUid = await page.evaluate(async () => (await import('/js/accountService.js')).getAccountService().getIdentity().uid);
  await page.evaluate(async () => { window.holdStats = true; window.statsPending = (await import('/js/profileStatsService.js')).getProfileStatsService().syncNow(); });
  await expect.poll(() => page.evaluate(() => window.statsResolvers.length)).toBe(1);
  await google(page, `switch-${Date.now()}@example.test`);
  await expect.poll(() => page.evaluate(async () => (await import('/js/accountService.js')).getAccountService().getState().uid)).not.toBe(oldUid);
  await page.evaluate(() => { window.holdStats = false; for (const item of window.statsResolvers) item.reject(new Error('Old network failure')); });
  await ready(page);
  const newUid = await page.evaluate(async () => (await import('/js/accountService.js')).getAccountService().getIdentity().uid);
  await expect.poll(() => page.evaluate(() => window.statsRequests.at(-1))).toBe(newUid);
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().phase)).toBe('ready');
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBe(0);
});
