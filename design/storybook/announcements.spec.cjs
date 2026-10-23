const { test, expect } = require('@playwright/test');
const { startNatural, solveNatural } = require('../../docs/design/advanced-ui/runtime/natural-play.cjs');
const keys = { 'memory-match': 'memoryMatch', 'link-connect': 'linkConnect', 'triple-connect': 'tripleConnect' };
async function boot(page) {
  await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => { window.productModule = path => import(path); });
}
async function certify(page, game, modes, level = 1) {
  await page.evaluate(async ({ key, modes, level }) => {
    const { gameState: state } = await import('/js/gameState.js'); const { savePersistentGameData } = await import('/js/persistence.js');
    for (const mode of modes) state.progress[key].bestByLevel[`${mode}:${level}`] = { score: 0, stars: 0, cleared: true, rulesVersion: 1, completedWaves: 2 };
    if (!await savePersistentGameData({ progress: state.progress })) throw Error('Certification save failed');
  }, { key: keys[game], modes, level });
}
for (const game of Object.keys(keys)) for (const destination of ['Bản đồ', 'Chơi tiếp']) test(`F2 natural ${game} summary reward ${destination}`, async ({ page }) => {
  test.setTimeout(100000); await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: destination === 'Bản đồ' ? 'reduce' : 'no-preference' });
  await boot(page); await certify(page, game, ['normal', 'hard', 'superHard']);
  await page.evaluate(async () => { await (await import('/js/uiSkin.js')).selectUiSkin('storybook'); });
  await startNatural(page, game); await solveNatural(page, game);
  await expect(page.locator('#achievement-notice-modal')).toHaveCount(0);
  const durable = await page.evaluate(async game => {
    const data = await (await import('/js/persistence.js')).loadPersistentGameData();
    return data.appearance.achievements.grants[`${game}:1`];
  }, game);
  expect(durable.announced).toBe(false);
  await page.locator('#level-summary-modal').getByRole('button', { name: destination, exact: true }).click();
  await expect(page.locator('#achievement-notice-modal')).toBeVisible();
  await expect(page.locator('#level-summary-modal')).toHaveCount(0);
  await expect(page.locator('#achievement-notice-modal button')).toHaveText(['Tiếp tục']);
  await expect(page.locator('#achievement-notice-modal')).toContainText('Đã thêm vào Hồ sơ');
  await expect(page.locator('#achievement-notice-modal')).toContainText('Chạm ảnh đại diện trong Hồ sơ');
  expect(await page.evaluate(game => window.productModule('/js/sessionProgress.js').then(module => module.getActiveSession(game, 'easy')?.level || null), game)).not.toBe(2);
  await page.locator('#achievement-notice-modal').getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.locator('#achievement-notice-modal')).toHaveCount(0);
  if (destination === 'Bản đồ') await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  else await expect.poll(() => page.evaluate(game => window.productModule('/js/sessionProgress.js').then(module => module.getActiveSession(game, 'easy')?.level), game), { timeout: 20000 }).toBe(2);
  expect(await page.evaluate(async game => (await (await import('/js/persistence.js')).loadPersistentGameData()).appearance.achievements.grants[`${game}:1`].announced, game)).toBe(true);
});
test('F2 reload resumes committed announcement once; category hint is not repeated', async ({ page }) => {
  await boot(page); await certify(page, 'memory-match', ['easy', 'normal', 'hard', 'superHard']);
  await page.reload(); await expect(page.locator('#achievement-notice-modal')).toBeVisible({ timeout: 20000 });
  await page.locator('#achievement-notice-modal button').click(); await expect(page.locator('#achievement-notice-modal')).toHaveCount(0);
  await certify(page, 'memory-match', ['easy', 'normal', 'hard', 'superHard'], 5);
  await page.evaluate(() => { void import('/js/progression/achievementAnnouncements.js').then(module => module.presentAchievementAnnouncements({ gameId: 'memory-match', level: 5 })); });
  await expect(page.locator('#achievement-notice-modal')).toBeVisible();
  await expect(page.locator('#achievement-notice-modal')).not.toContainText('Chạm ảnh đại diện trong Hồ sơ');
  await page.locator('#achievement-notice-modal button').click(); await expect(page.locator('#achievement-notice-modal')).toHaveCount(0);
  await page.reload(); await expect(page.locator('#app-loading')).toHaveCount(0, { timeout: 20000 });
  await expect(page.locator('#achievement-notice-modal')).toHaveCount(0);
});
test('F2 twenty owner cancellations settle promises, cancel queued acknowledgment and keep receipt', async ({ page }) => {
  await boot(page); await certify(page, 'link-connect', ['easy', 'normal', 'hard', 'superHard']);
  const result = await page.evaluate(async () => {
    const { createGameShellLifecycle } = await import('/js/gameShell/gameShellLifecycle.js');
    const { presentAchievementAnnouncements } = await import('/js/progression/achievementAnnouncements.js');
    const results = [];
    for (let index = 0; index < 20; index++) {
      const owner = createGameShellLifecycle(), presentation = presentAchievementAnnouncements({ owner, gameId: 'link-connect', level: 1 });
      document.querySelector('#achievement-notice-modal button').click(); owner.dispose(); owner.dispose();
      results.push({ result: await presentation, diagnostics: owner.diagnostics(), nodes: document.querySelectorAll('#achievement-notice-modal').length });
    }
    const p = await import('/js/persistence.js');
    return { results, receipt: (await p.loadPersistentGameData()).appearance.achievements.grants['link-connect:1'], blocked: p.isPersistenceBlocked() };
  });
  expect(result.blocked).toBe(false); expect(result.receipt.announced).toBe(false);
  for (const cycle of result.results) { expect(cycle.result).toBe(false); expect(cycle.nodes).toBe(0); for (const [key, value] of Object.entries(cycle.diagnostics)) if (key !== 'active') expect(value).toBe(0); }
});
