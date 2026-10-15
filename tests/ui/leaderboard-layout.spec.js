import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('docs/design/app-tabs/qa', { recursive: true });
const source = readFileSync('js/leaderboardPanel.js', 'utf8')
  .replace("import { getFirebaseBackend } from './firebaseBackend.js';", "const getFirebaseBackend = async () => ({ database: null, environment: 'test' });")
  .replace("import { readCachedLeaderboard } from './leaderboardStore.js';", "const readCachedLeaderboard = ({ board, uid, page }) => window.rankCache.get(JSON.stringify({ board, uid, page })) || null;")
  .replace("import { getAccountService } from './accountService.js';", "const getAccountService = () => ({ getIdentity: () => ({ uid: window.rankUid }), subscribe: listener => { listener(); return () => {}; } });")
  .replace("import { readLeaderboard } from './leaderboardStore.js';", `const readLeaderboard = async ({ board, uid, page = 1, refresh = false, forceRefresh = false }) => {
    window.rankRequests.push({ ...board, page, refresh, forceRefresh });
    if (forceRefresh) for (const key of window.rankCache.keys()) { const cached = JSON.parse(key); if (cached.uid === uid && JSON.stringify(cached.board) === JSON.stringify(board)) window.rankCache.delete(key); }
    if (window.rankFailures > 0) { window.rankFailures--; throw Object.assign(new Error('changed'), { code: 'stale' }); }
    if (window.rankDeferred) await new Promise(resolve => window.rankResolvers.push(resolve));
    if (window.rankError) throw new Error('offline');
    const count = window.rankCount;
    const data = { page, hasNext: page * 10 < count, knownPages: Array.from({ length: Math.min(Math.ceil(count / 10), page + 1) }, (_, i) => i + 1),
      top: Array.from({ length: Math.max(0, Math.min(10, count - (page - 1) * 10)) }, (_, i) => ({ uid: 'row-' + ((page - 1) * 10 + i), playerName: window.rankNames?.[i] || '<img src=x> Tên người chơi rất dài rất dài', durationMs: window.rankNames ? 41810 + i * 1370 : 1000, levelReached: window.rankNames ? 100000 - i : 10, totalScore: window.rankNames ? 128640 - i * 3500 : 12345 })), own: window.rankUid ? { durationMs: 1000, levelReached: 10, totalScore: 12345 } : null };
    data.loadedPages = [...new Set([...window.rankCache.keys()].map(key => JSON.parse(key)).filter(item => JSON.stringify(item.board) === JSON.stringify(board) && item.uid === uid).map(item => item.page).concat(page))];
    window.rankCache.set(JSON.stringify({ board, uid, page }), data); return data;
  };`);
async function open(page, count = 21, gameContext = false) {
  await page.addInitScript(count => { window.rankCount = count; window.rankRequests = []; window.rankResolvers = []; window.rankCache = new Map(); }, count);
  await page.route('**/js/leaderboardPanel.js*', route => route.fulfill({ contentType: 'text/javascript', body: source }));
  await page.goto('/');
  if (gameContext) await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  await page.locator('[data-dock-action="ranking"]').click();
  await page.evaluate(async () => { window.rankCycleModal = (await import('/js/leaderboardPanel.js')).openLeaderboards(undefined, undefined, { presentation: 'screen', host: document.querySelector('.adventure-screen-host'), owner: (await import('/js/appPageLifecycle.js')).getAppPageScope() }); });
  await expect(page.locator('.leaderboard-list li')).toHaveCount(Math.min(count, 10));
}
async function reopen(page) {
  await page.evaluate(async () => {
    window.rankCycleModal?.destroy();
    window.rankCycleModal = (await import('/js/leaderboardPanel.js')).openLeaderboards(undefined, undefined, { presentation: 'screen', host: document.querySelector('.adventure-screen-host'), owner: (await import('/js/appPageLifecycle.js')).getAppPageScope() });
  });
  await expect(page.locator('.leaderboard-results')).not.toHaveAttribute('aria-busy', 'true');
}
async function selectFamily(page, game, family) {
  await page.locator(`[data-rank-game="${game}"]`).click();
  await page.locator(`[data-rank-family="${family}"]`).click();
}
for (const count of [0, 1, 10, 11]) test(`record count ${count}, private own record and no repeated copy`, async ({ page }) => {
  await open(page, count);
  if (count) await expect(page.locator('.leaderboard-heading')).toContainText('Màn');
  else await expect(page.locator('.leaderboard-status')).toHaveText('Chưa có thành tích.');
  await page.evaluate(() => { window.rankUid = 'row-0'; });
  await reopen(page);
  if (count) { await expect(page.locator('.leaderboard-list .is-self')).toHaveCount(1); await expect(page.locator('.leaderboard-own')).toHaveText(''); }
  await page.evaluate(() => { window.rankUid = 'outside'; });
  await reopen(page);
  await expect(page.locator('.leaderboard-own')).toHaveText('Thành tích của bạn: Màn 10');
  await expect(page.locator('.leaderboard-view')).not.toContainText('Đã cập nhật');
  await expect(page.locator('.leaderboard-list img')).toHaveCount(0);
});
test('page numbers show only loaded pages, collapse with ellipsis and jump once', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 }); await open(page, 1000);
  await page.evaluate(() => { window.rankNames = ['Linh Nguyễn', 'Hải Minh', 'Ngọc Anh', 'Bảo Trân', 'Hoàng Nam', 'Mai Chi', 'An Nhiên', 'Tuấn Anh', 'Thanh Hà', 'Minh Khôi']; });
  await reopen(page);
  const numbers = page.locator('.leaderboard-page-numbers');
  await expect(numbers.locator('button')).toHaveText(['1']);
  for (let n = 2; n <= 12; n++) {
    await page.getByRole('button', { name: 'Sau', exact: true }).click();
    await expect(numbers.locator('[aria-current="page"]')).toHaveText(String(n));
  }
  await page.getByRole('button', { name: 'Trang 11', exact: true }).click();
  await expect(numbers.locator('[aria-current="page"]')).toHaveText('11');
  await expect(numbers.locator('button')).toHaveText(['1', '2', '10', '11', '12']);
  await expect(numbers.locator('.leaderboard-page-gap')).toHaveCount(1);
  await page.screenshot({ path: 'docs/design/app-tabs/qa/desktop-pagination.png', animations: 'disabled' });
  await expect(page.getByRole('button', { name: 'Trang 13', exact: true })).toHaveCount(0);
  const before = await page.evaluate(() => window.rankRequests.length);
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(numbers.locator('[aria-current="page"]')).toHaveText('2');
  await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toBeFocused();
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(before + 1);
  expect(await page.evaluate(() => window.rankRequests.at(-1).page)).toBe(2);
  await page.setViewportSize({ width: 412, height: 915 });
  await expect(numbers.locator('button')).toHaveText(['1', '2', '12']);
  await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toBeFocused();
  const pager = await page.locator('.leaderboard-pager').boundingBox();
  expect(Math.abs(pager.x + pager.width / 2 - 206)).toBeLessThan(2);
  await page.screenshot({ path: 'docs/design/app-tabs/qa/mobile-pagination.png', animations: 'disabled' });
  await page.setViewportSize({ width: 320, height: 740 });
  const narrowPager = await page.locator('.leaderboard-pager').boundingBox();
  expect(Math.abs(narrowPager.x + narrowPager.width / 2 - 160)).toBeLessThan(2);
  await selectFamily(page, 'memory-match', 'challenge');
  await expect(numbers.locator('button')).toHaveText(['1']);
});

test('game menu opens without querying, supports keyboard and clamps above an anchor near the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await open(page);
  const before = await page.evaluate(() => window.rankRequests.length);
  const anchor = page.locator('[data-rank-game="link-connect"]'); await anchor.click();
  const menu = page.getByRole('menu'); await expect(menu).toBeVisible();
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(before);
  await expect(menu.locator('[data-rank-family="adventure"]')).toBeFocused();
  await menu.locator('[data-rank-family="adventure"]').press('End');
  await expect(menu.locator('[data-rank-family="endless"]')).toBeFocused();
  await menu.locator('[data-rank-family="endless"]').press('Escape');
  await expect(menu).toHaveCount(0); await expect(anchor).toBeFocused();
  await anchor.click(); await menu.locator('[data-rank-family="adventure"]').press('Tab');
  await expect(menu).toHaveCount(0); await expect(page.locator('[data-rank-game="triple-connect"]')).toBeFocused();
  await anchor.click(); await menu.locator('[data-rank-family="adventure"]').press('Shift+Tab');
  await expect(menu).toHaveCount(0); await expect(page.locator('[data-rank-game="memory-match"]')).toBeFocused();
  await anchor.evaluate(node => { node.style.position = 'fixed'; node.style.bottom = '10px'; node.style.zIndex = '15000'; });
  await anchor.click(); await expect(menu).toHaveAttribute('data-direction', 'up');
  const box = await menu.boundingBox(); const trigger = await anchor.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(128); expect(box.width).toBeLessThanOrEqual(152); expect(box.y).toBeGreaterThanOrEqual(8); expect(box.y + box.height).toBeLessThan(trigger.y);
  await menu.locator('[data-rank-family="adventure"]').press('ArrowDown');
  await menu.locator('[data-rank-family="challenge"]').press('Enter');
  expect(await page.evaluate(() => window.rankRequests.at(-1))).toMatchObject({ gameId: 'link-connect', family: 'challenge', page: 1 });
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(before + 1);
  await expect(anchor).toBeFocused(); await expect(anchor).not.toContainText('Thử thách'); await expect(page.locator('.leaderboard-family-label')).toHaveText('Thử thách');
});

test('30 mount, picker cancel and mode changes release every page-owned resource', async ({ page }) => {
  await open(page);
  await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('leaderboard-night-garden.webp')));
  const imageLoads = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('leaderboard-night-garden.webp')).length);
  await page.screenshot({ animations: 'disabled' });
  const tracing = await page.context().newCDPSession(page); const decodes = [];
  tracing.on('Tracing.dataCollected', ({ value }) => { for (const event of value) if (/Decode Image|ImageDecodeTask/.test(event.name)) decodes.push({ name: event.name, data: event.args }); });
  await tracing.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
  await page.evaluate(() => window.rankCycleModal.destroy());
  const diagnostics = () => page.evaluate(async () => ({ nodes: document.querySelectorAll('*').length, owner: (await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics() }));
  const before = await diagnostics();
  for (let cycle = 0; cycle < 30; cycle++) {
    await page.evaluate(async () => { window.rankCycleModal = (await import('/js/leaderboardPanel.js')).openLeaderboards(undefined, undefined, { presentation: 'screen', host: document.querySelector('.adventure-screen-host'), owner: (await import('/js/appPageLifecycle.js')).getAppPageScope() }); });
    await expect(page.locator('.leaderboard-heading')).toBeVisible();
    await page.locator('[data-rank-game="memory-match"]').click();
    await page.locator('[data-rank-family="adventure"]').press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await selectFamily(page, 'memory-match', 'challenge');
    await expect(page.locator('.leaderboard-heading')).toContainText('Màn');
    await page.evaluate(() => window.rankCycleModal.destroy());
  }
  expect(await diagnostics()).toEqual(before);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('leaderboard-night-garden.webp')).length)).toBe(imageLoads);
  const complete = new Promise(resolve => tracing.once('Tracing.tracingComplete', resolve));
  await tracing.send('Tracing.end'); await complete; await tracing.detach();
  const evidence = { imageLoads, decodes, before, after: await diagnostics() };
  writeFileSync('docs/design/app-tabs/qa/level-ranking-30-cycles.json', JSON.stringify(evidence, null, 2));
  await test.info().attach('ranking-30-cycle-resources', { body: JSON.stringify(evidence), contentType: 'application/json' });
  expect(decodes.length).toBeLessThanOrEqual(1);
});
for (const viewport of [{ width: 412, height: 915 }, { width: 640, height: 360 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
  test(`ranking layout, all nine boards and scroll at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport); await open(page);
    for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
      for (const mode of ['adventure', 'challenge', 'endless']) {
        await selectFamily(page, game, mode);
        await expect(page.locator('.leaderboard-heading')).toBeVisible();
        await expect(page.locator('.leaderboard-status')).toHaveText('');
        expect(await page.evaluate(() => window.rankRequests.at(-1).page)).toBe(1);
      }
    }
    await expect(page.locator('.leaderboard-list img')).toHaveCount(0);
    const boxes = await page.locator('.leaderboard-tabs--game button, .leaderboard-pager button').evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom, height: rect.height, minimum: node.closest('.leaderboard-pager') ? 32 : 44 }; }));
    for (const box of boxes) { expect(box.x).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(viewport.width); expect(Math.round(box.height * 1000) / 1000).toBeGreaterThanOrEqual(box.minimum); expect(box.bottom).toBeLessThanOrEqual(viewport.height); }
    await expect(page.locator('.leaderboard-tabs--mode, .leaderboard-level')).toHaveCount(0);
    const panelBox = await page.locator('.leaderboard-panel').boundingBox();
    const pagerBox = await page.locator('.leaderboard-pager').boundingBox();
    expect(Math.abs(pagerBox.x + pagerBox.width / 2 - panelBox.x - panelBox.width / 2)).toBeLessThan(2);
    await page.getByRole('button', { name: 'Sau', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page');
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
  await selectFamily(page, 'link-connect', 'adventure');
  await selectFamily(page, 'triple-connect', 'adventure');
  await page.evaluate(() => { window.rankDeferred = false; window.rankCount = 0; for (const resolve of window.rankResolvers) resolve(); });
  await expect(page.locator('.leaderboard-results')).toContainText('Chưa có thành tích');
  await page.evaluate(() => { window.rankError = true; });
  await reopen(page);
  await expect(page.locator('.leaderboard-status')).toContainText('Chưa tải được');
  await page.evaluate(() => { window.rankError = false; window.rankDeferred = true; });
  await selectFamily(page, 'memory-match', 'challenge');
  await page.locator('.adventure-screen .adventure-exit').click();
  await page.evaluate(() => { for (const resolve of window.rankResolvers) resolve(); });
  await expect(page.locator('#rankings-modal')).toHaveCount(0);
});
test('offline refresh preserves only the same board and UID cache', async ({ page, context }) => {
  await open(page);
  await context.setOffline(true);
  await reopen(page);
  await expect(page.locator('.leaderboard-list li')).toHaveCount(10);
  await expect(page.locator('.leaderboard-status')).toHaveText('Chưa có kết nối.');
  await selectFamily(page, 'link-connect', 'adventure');
  await expect(page.locator('.leaderboard-list li')).toHaveCount(0);
  await selectFamily(page, 'memory-match', 'adventure');
  await expect(page.locator('.leaderboard-list li')).toHaveCount(10);
  await page.evaluate(() => { window.rankUid = 'another-owner'; });
  await reopen(page);
  await expect(page.locator('.leaderboard-list li')).toHaveCount(0);
});
test('final garden artwork, centered footer and background failure keep a usable product screen', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await open(page, 21, true);
  await page.evaluate(() => { window.rankNames = ['Linh Nguyễn', 'Hải Minh', 'Ngọc Anh', 'Bảo Trân', 'Hoàng Nam', 'Mai Chi', 'An Nhiên', 'Tuấn Anh', 'Thanh Hà', 'Minh Khôi']; window.rankUid = 'row-6'; });
  await reopen(page);
  await expect(page.locator('.leaderboard-list .is-self')).toHaveCount(1);
  const last = await page.locator('.leaderboard-list li').last().boundingBox();
  const region = await page.locator('.leaderboard-results').boundingBox();
  expect(last.y + last.height).toBeLessThanOrEqual(region.y + region.height);
  expect(await page.locator('.leaderboard-rank--1').evaluate(node => getComputedStyle(node).color)).toBe('rgb(58, 42, 17)');
  await page.locator('.leaderboard-results').blur();
  await page.screenshot({ path: 'docs/design/app-tabs/qa/mobile-level.png', animations: 'disabled' });
  await page.locator('[data-rank-game="memory-match"]').click();
  await page.screenshot({ path: 'docs/design/app-tabs/qa/mobile-family-menu.png', animations: 'disabled' });
  await page.locator('[data-rank-family="adventure"]').press('Escape');
  await selectFamily(page, 'memory-match', 'challenge'); await expect(page.locator('.leaderboard-heading')).toContainText('Màn');
  await page.screenshot({ path: 'docs/design/app-tabs/qa/mobile-level-challenge.png', animations: 'disabled' });
  await page.setViewportSize({ width: 844, height: 390 }); await page.screenshot({ path: 'docs/design/app-tabs/qa/landscape-level.png', animations: 'disabled' });
  await page.setViewportSize({ width: 1024, height: 900 }); await page.screenshot({ path: 'docs/design/app-tabs/qa/desktop-level.png', animations: 'disabled' });
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('leaderboard-night-garden.webp')).length);
  expect(resources).toBe(1);
  await page.route('**/leaderboard-night-garden.webp', route => route.abort());
  await page.reload(); await page.locator('[data-dock-action="ranking"]').click();
  await expect(page.locator('.leaderboard-panel')).toBeVisible(); await expect(page.locator('.leaderboard-heading')).toBeVisible();
  expect(await page.locator('.leaderboard-panel').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(6, 28, 36)');
  await page.screenshot({ path: 'docs/design/app-tabs/qa/background-fallback.png', animations: 'disabled' });
});

test('each mount is fresh, menu is query-free, and stale recovery is bounded with contextual retry', async ({ page }) => {
  await open(page, 21);
  await expect(page.getByRole('button', { name: 'Làm mới' })).toHaveCount(0);
  const before = await page.evaluate(() => window.rankRequests.length);
  await reopen(page);
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(before + 1);
  expect(await page.evaluate(() => window.rankRequests.at(-1))).toMatchObject({ refresh: true, forceRefresh: true, page: 1 });
  await page.evaluate(() => window.rankFailures = 1);
  const requests = await page.evaluate(() => window.rankRequests.length);
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(page.locator('.leaderboard-results')).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('button', { name: 'Trang 1', exact: true })).toHaveAttribute('aria-current', 'page');
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(requests + 2);
  await page.evaluate(() => window.rankFailures = 5);
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(requests + 4);
  await page.evaluate(() => window.rankFailures = 0);
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.locator('.leaderboard-list li')).toHaveCount(10);
  await expect(page.getByRole('button', { name: 'Thử lại', exact: true })).toBeHidden();
});
