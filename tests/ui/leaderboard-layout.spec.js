import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const source = readFileSync('js/leaderboardPanel.js', 'utf8')
  .replace("import { getFirebaseBackend } from './firebaseBackend.js';", "const getFirebaseBackend = async () => ({ database: null, environment: 'test' });")
  .replace("import { getAccountService } from './accountService.js';", "const getAccountService = () => ({ getIdentity: () => ({ uid: window.rankUid }), subscribe: listener => { listener(); return () => {}; } });")
  .replace("import { readLeaderboard } from './leaderboardStore.js';", `const readLeaderboard = async ({ board, page = 1 }) => {
    window.rankRequests.push({ ...board, page });
    if (window.rankDeferred) await new Promise(resolve => window.rankResolvers.push(resolve));
    if (window.rankError) throw new Error('offline');
    const count = window.rankCount;
    return { page, hasNext: page * 10 < count, knownPages: Array.from({ length: Math.min(Math.ceil(count / 10), page + 1) }, (_, i) => i + 1),
      top: Array.from({ length: Math.max(0, Math.min(10, count - (page - 1) * 10)) }, (_, i) => ({ uid: 'row-' + ((page - 1) * 10 + i), playerName: '<img src=x> Tên người chơi rất dài rất dài', durationMs: 1000, levelReached: 10, totalScore: 12345 })), own: window.rankUid ? { durationMs: 1000, levelReached: 10, totalScore: 12345 } : null };
  };`);
async function open(page, count = 21) {
  await page.addInitScript(count => { window.rankCount = count; window.rankRequests = []; window.rankResolvers = []; }, count);
  await page.route('**/js/leaderboardPanel.js*', route => route.fulfill({ contentType: 'text/javascript', body: source }));
  await page.goto('/'); await page.locator('[data-dock-action="ranking"]').click();
  await page.evaluate(async () => { window.rankCycleModal = (await import('/js/leaderboardPanel.js')).openLeaderboards(undefined, undefined, { presentation: 'screen', host: document.querySelector('.adventure-screen-host'), owner: (await import('/js/appPageLifecycle.js')).getAppPageScope() }); });
  await expect(page.locator('.leaderboard-list li')).toHaveCount(Math.min(count, 10));
}
for (const count of [0, 1, 10, 11]) test(`record count ${count}, private own record and no repeated copy`, async ({ page }) => {
  await open(page, count);
  if (count) await expect(page.locator('.leaderboard-heading')).toContainText('Thời gian');
  else await expect(page.locator('.leaderboard-status')).toHaveText('Chưa có thành tích.');
  await page.evaluate(() => { window.rankUid = 'row-0'; });
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  if (count) { await expect(page.locator('.leaderboard-list .is-self')).toHaveCount(1); await expect(page.locator('.leaderboard-own')).toHaveText(''); }
  await page.evaluate(() => { window.rankUid = 'outside'; });
  await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
  await expect(page.locator('.leaderboard-own')).toHaveText('Thành tích của bạn: 00:01,00');
  await expect(page.locator('.leaderboard-view')).not.toContainText('Đã cập nhật');
  await expect(page.locator('.leaderboard-list img')).toHaveCount(0);
});
test('stage picker confirms 212 once, rejects invalid input and returns focus on cancel', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await open(page);
  const before = await page.evaluate(() => window.rankRequests.length);
  await page.getByRole('button', { name: 'Chọn màn', exact: true }).click();
  const input = page.getByLabel('Màn chơi', { exact: true });
  await input.fill('212');
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(before);
  await input.press('Enter');
  await expect(page.locator('.leaderboard-context')).toHaveText('Màn 212');
  await expect(page.getByRole('button', { name: 'Chọn màn', exact: true })).toContainText('212');
  expect(await page.evaluate(() => window.rankRequests.at(-1))).toMatchObject({ level: 212, page: 1 });
  await page.getByRole('button', { name: 'Chọn màn', exact: true }).click();
  for (const invalid of ['0', '-1', '2.5', 'abc', '9007199254740991']) {
    await input.fill(invalid); await input.press('Enter');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('.leaderboard-context')).toHaveText('Màn 212');
  }
  await input.press('Escape');
  await expect(page.locator('#leaderboard-stage-picker')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Chọn màn', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Chọn màn', exact: true }).click();
  await input.fill('9007199254740900'); await input.press('Enter');
  await expect(page.locator('.leaderboard-context')).toHaveText('Màn 9007199254740900');
  expect(await page.evaluate(() => window.rankRequests.at(-1).level)).toBe(9007199254740900);
  await page.screenshot({ path: 'test-results/ranking-stage-picker-confirmed.png' });
});
test('30 mount, picker cancel and mode changes release every page-owned resource', async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.rankCycleModal.destroy());
  const diagnostics = () => page.evaluate(async () => ({ nodes: document.querySelectorAll('*').length, owner: (await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics() }));
  const before = await diagnostics();
  for (let cycle = 0; cycle < 30; cycle++) {
    await page.evaluate(async () => { window.rankCycleModal = (await import('/js/leaderboardPanel.js')).openLeaderboards(undefined, undefined, { presentation: 'screen', host: document.querySelector('.adventure-screen-host'), owner: (await import('/js/appPageLifecycle.js')).getAppPageScope() }); });
    await expect(page.locator('.leaderboard-heading')).toBeVisible();
    await page.getByRole('button', { name: 'Chọn màn', exact: true }).click();
    await page.getByLabel('Màn chơi', { exact: true }).press('Escape');
    await expect(page.locator('#leaderboard-stage-picker')).toHaveCount(0);
    await page.locator('[data-rank-mode="challenge"]').click();
    await expect(page.locator('.leaderboard-heading')).toContainText('Điểm');
    await page.evaluate(() => window.rankCycleModal.destroy());
  }
  expect(await diagnostics()).toEqual(before);
});
for (const viewport of [{ width: 412, height: 915 }, { width: 640, height: 360 }, { width: 1024, height: 900 }]) {
  test(`ranking layout, all 18 filters and scroll at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport); await open(page);
    for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
      await page.locator(`[data-rank-game="${game}"]`).click();
      for (const mode of ['easy', 'normal', 'hard', 'superHard', 'challenge', 'endless']) {
        await page.locator(`[data-rank-mode="${mode}"]`).click();
        await expect(page.locator('.leaderboard-heading')).toBeVisible();
        await expect(page.locator('.leaderboard-status')).toHaveText('');
        await expect(page.getByRole('button', { name: 'Chọn màn', exact: true })).toBeVisible({ visible: !['challenge', 'endless'].includes(mode) });
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
