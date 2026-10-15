import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const source = readFileSync('js/leaderboardService.js', 'utf8')
  .replace("import { getFirebaseBackend } from './firebaseBackend.js';", "const getFirebaseBackend = async () => window.rankingBackend;")
  .replace("import { getAccountService } from './accountService.js';", "const getAccountService = () => ({ getIdentity: () => window.rankingIdentity, getState: () => ({ conflict: false }), subscribe: listener => { window.rankingAccountListener = listener; listener({ bound: true }); return () => {}; } });")
  .replace("import { submitRankingResult } from './leaderboardStore.js';", "const submitRankingResult = async ({ uid, result }) => { window.rankingSubmitted.push(uid); window.rankingValues.push(result.levelReached); if (window.rankingSubmitted.length === 1) await new Promise(resolve => { window.rankingRelease = resolve; }); return { reads: 1, writes: 1 }; };");
test('a new account flushes automatically after the old account pending request ends', async ({ page }) => {
  await page.addInitScript(() => {
    window.rankingIdentity = { uid: 'a', profileId: 'fixture', firstUid: 'a', playerName: 'A' };
    window.rankingBackend = { environment: 'test', database: null, auth: { currentUser: { uid: 'a' } } };
    window.rankingSubmitted = [];
    window.rankingValues = [];
  });
  await page.route('**/js/leaderboardService.js*', route => route.fulfill({ contentType: 'text/javascript', body: source }));
  await page.goto('/');
  await page.evaluate(async () => {
    const { getLeaderboardService, initializeLeaderboardService } = await import('/js/leaderboardService.js');
    initializeLeaderboardService();
    await getLeaderboardService().ready;
    const { createProgressResult } = await import('/js/progressRankingModel.js');
    const { updateSyncMetadata } = await import('/js/persistence.js');
    for (const uid of ['a', 'b']) {
      const result = createProgressResult('memory-match', 'adventure', 10, { profileId: 'fixture', uid });
      await updateSyncMetadata(`ranking:v3:test:uid:${uid}`, () => ({ queue: { [`${uid}:v3_memory-match_adventure`]: result } }));
    }
    void getLeaderboardService().flush();
  });
  await expect.poll(() => page.evaluate(() => window.rankingSubmitted)).toEqual(['a']);
  await page.evaluate(() => {
    window.rankingIdentity = { ...window.rankingIdentity, uid: 'b', firstUid: 'a' };
    window.rankingBackend.auth.currentUser = { uid: 'b' };
    window.rankingAccountListener({ bound: true });
  });
  // Let the new owner's scheduled attempt meet the still-pending old task.
  await page.waitForTimeout(50);
  await page.evaluate(() => window.rankingRelease());
  await expect.poll(() => page.evaluate(() => window.rankingSubmitted)).toEqual(['a', 'b']);
  await expect.poll(() => page.evaluate(async () => Object.keys((await (await import('/js/persistence.js')).loadSyncMetadata('ranking:v3:test:uid:b')).queue).length)).toBe(0);
});
test('a higher best committed during a pending send is sent automatically afterwards', async ({ page }) => {
  await page.addInitScript(() => {
    window.rankingIdentity = { uid: 'a', profileId: 'fixture', firstUid: 'a', playerName: 'A' };
    window.rankingBackend = { environment: 'test', database: null, auth: { currentUser: { uid: 'a' } } };
    window.rankingSubmitted = []; window.rankingValues = [];
  });
  await page.route('**/js/leaderboardService.js*', route => route.fulfill({ contentType: 'text/javascript', body: source }));
  await page.goto('/');
  await page.evaluate(async () => {
    const service = (await import('/js/leaderboardService.js')).initializeLeaderboardService(); await service.ready;
    const { createProgressResult } = await import('/js/progressRankingModel.js');
    const result = createProgressResult('memory-match', 'adventure', 10, { profileId: 'fixture', uid: 'a' });
    await (await import('/js/persistence.js')).updateSyncMetadata('ranking:v3:test:uid:a', () => ({ queue: { 'a:v3_memory-match_adventure': result } }));
    void service.flush();
  });
  await expect.poll(() => page.evaluate(() => window.rankingValues)).toEqual([10]);
  await page.evaluate(async () => {
    const { createProgressResult } = await import('/js/progressRankingModel.js');
    const { gameState } = await import('/js/gameState.js');
    gameState.progress.memoryMatch.levelBestsV3 = { adventure: createProgressResult('memory-match', 'adventure', 20, { profileId: 'fixture', uid: 'a' }) };
    await (await import('/js/persistence.js')).saveProgress(gameState.progress);
    await (await import('/js/leaderboardService.js')).getLeaderboardService().recover(gameState.progress);
  });
  await page.waitForTimeout(50);
  await page.evaluate(() => window.rankingRelease());
  await expect.poll(() => page.evaluate(() => window.rankingValues)).toEqual([10, 20]);
  await expect.poll(() => page.evaluate(async () => Object.keys((await (await import('/js/persistence.js')).loadSyncMetadata('ranking:v3:test:uid:a')).queue).length)).toBe(0);
});
