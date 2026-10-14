import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const source = readFileSync('js/leaderboardPanel.js', 'utf8')
  .replace("import { getFirebaseBackend } from './firebaseBackend.js';", "const getFirebaseBackend = async () => ({ database: null, environment: 'test' });")
  .replace("import { readLeaderboard } from './leaderboardStore.js';", `const readLeaderboard = async ({ board, page = 1 }) => {
    window.rankRequests.push({ ...board, page });
    if (window.rankDeferred) await new Promise(resolve => window.rankResolvers.push(resolve));
    if (window.rankError) throw new Error('offline');
    const count = window.rankCount;
    return { page, hasNext: page * 10 < count, knownPages: Array.from({ length: Math.min(Math.ceil(count / 10), page + 1) }, (_, i) => i + 1),
      top: Array.from({ length: Math.max(0, Math.min(10, count - (page - 1) * 10)) }, (_, i) => ({ uid: 'row-' + ((page - 1) * 10 + i), playerName: '<img src=x> Tên người chơi rất dài rất dài', durationMs: 1000, levelReached: 10, totalScore: 12345 })), own: null };
  };`);
async function open(page, count = 21) {
  await page.addInitScript(count => { window.rankCount = count; window.rankRequests = []; window.rankResolvers = []; }, count);
  await page.route('**/js/leaderboardPanel.js*', route => route.fulfill({ contentType: 'text/javascript', body: source }));
  await page.goto('/'); await page.locator('[data-dock-action="ranking"]').click();
  await page.evaluate(async () => (await import('/js/leaderboardPanel.js')).openLeaderboards(undefined, undefined, { presentation: 'screen', host: document.querySelector('.adventure-screen-host'), owner: (await import('/js/appPageLifecycle.js')).getAppPageScope() }));
  await expect(page.locator('.leaderboard-list li')).toHaveCount(Math.min(count, 10));
}
for (const viewport of [{ width: 412, height: 915 }, { width: 640, height: 360 }, { width: 1024, height: 900 }]) {
  test(`ranking layout, all 18 filters and scroll at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport); await open(page);
    for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
      await page.locator(`[data-rank-game="${game}"]`).click();
      for (const mode of ['easy', 'normal', 'hard', 'superHard', 'challenge', 'endless']) {
        await page.locator(`[data-rank-mode="${mode}"]`).click();
        await expect(page.locator('.leaderboard-status')).toHaveText('Đã cập nhật');
        await expect(page.locator('[aria-label="Màn chơi"]')).toBeVisible({ visible: !['challenge', 'endless'].includes(mode) });
        expect(await page.evaluate(() => window.rankRequests.at(-1).page)).toBe(1);
      }
    }
    await expect(page.locator('.leaderboard-list img')).toHaveCount(0);
    const boxes = await page.locator('.leaderboard-tabs--game button, .leaderboard-pager > button').evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom, height: rect.height }; }));
    for (const box of boxes) { expect(box.x).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(viewport.width); expect(Math.round(box.height * 1000) / 1000).toBeGreaterThanOrEqual(44); expect(box.bottom).toBeLessThanOrEqual(viewport.height); }
    const modeGeometry = await page.locator('.leaderboard-tabs--mode button').evaluateAll(nodes => nodes.map(node => ({ y: node.getBoundingClientRect().y, height: node.getBoundingClientRect().height })));
    expect(new Set(modeGeometry.map(box => box.y)).size).toBe(1);
    for (const box of modeGeometry) expect(box.height).toBeGreaterThanOrEqual(44);
    const panelBox = await page.locator('.leaderboard-panel').boundingBox();
    const pagerBox = await page.locator('.leaderboard-pager').boundingBox();
    expect(Math.abs(pagerBox.x + pagerBox.width / 2 - panelBox.x - panelBox.width / 2)).toBeLessThan(2);
    await page.getByRole('button', { name: 'Sau', exact: true }).click();
    await expect(page.locator('.leaderboard-pager')).toContainText('Trang 2');
    await page.getByRole('button', { name: 'Sau', exact: true }).click();
    await expect(page.locator('.leaderboard-list li')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Sau', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Trước', exact: true }).click();
    await expect(page.locator('.leaderboard-list li')).toHaveCount(10);
    expect((await page.locator('.leaderboard-results').boundingBox()).height).toBeGreaterThanOrEqual(44);
    const region = page.locator('.leaderboard-results'); await region.focus(); await page.keyboard.press('End');
    await page.screenshot({ path: `test-results/ranking-${viewport.width}x${viewport.height}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('stale requests, empty/offline state and close during load never commit the old response', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.rankDeferred = true; });
  await page.locator('[data-rank-game="link-connect"]').click();
  await page.locator('[data-rank-game="triple-connect"]').click();
  await page.evaluate(() => { window.rankDeferred = false; window.rankCount = 0; for (const resolve of window.rankResolvers) resolve(); });
  await expect(page.locator('.leaderboard-results')).toContainText('Chưa có thành tích');
  await page.evaluate(() => { window.rankError = true; });
  await page.getByRole('button', { name: 'Làm mới' }).click();
  await expect(page.locator('.leaderboard-status')).toContainText('Chưa tải được');
  await page.evaluate(() => { window.rankError = false; window.rankDeferred = true; });
  await page.locator('[data-rank-mode="challenge"]').click();
  await page.locator('.adventure-screen .adventure-exit').click();
  await page.evaluate(() => { for (const resolve of window.rankResolvers) resolve(); });
  await expect(page.locator('#rankings-modal')).toHaveCount(0);
});
