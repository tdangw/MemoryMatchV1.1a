import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('docs/design/app-tabs/qa', { recursive: true });
const source = readFileSync('js/leaderboardPanel.js', 'utf8')
  .replace("import { readPublicCosmetics } from './progression/publicCosmeticStore.js';", "const readPublicCosmetics = async () => ({ selections: new Map(window.rankCosmetics || []), available: true });")
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
      top: Array.from({ length: Math.max(0, Math.min(10, count - (page - 1) * 10)) }, (_, i) => ({ uid: 'row-' + ((page - 1) * 10 + i), playerName: window.rankNames?.[i] || '<img src=x> Tên người chơi rất dài rất dài', durationMs: window.rankNames ? 41810 + i * 1370 : 1000, levelReached: window.rankNames ? 100000 - i : 10, totalScore: window.rankNames ? 128640 - i * 3500 : 12345, ...(board.kind === 'adventure' ? {metricsComplete: true, score: window.rankNames ? 128640-i*3500 : 12345, moves: 28+i, misses: i%3, ...(window.rankMetrics?.[board.mode] || {})} : {}) })), own: window.rankUid && !window.rankNoOwn ? { uid: window.rankUid, playerName: 'Người chơi Reks2', durationMs: 1000, levelReached: 10, totalScore: 12345, ...(board.kind === 'adventure' ? {metricsComplete:true,score:12345,moves:28,misses:0} : {}) } : null, ownRank: window.rankUid?.startsWith('row-') ? Number(window.rankUid.slice(4)) + 1 : 42 };
    data.loadedPages = [...new Set([...window.rankCache.keys()].map(key => JSON.parse(key)).filter(item => JSON.stringify(item.board) === JSON.stringify(board) && item.uid === uid).map(item => item.page).concat(page))];
    window.rankCache.set(JSON.stringify({ board, uid, page }), data); return data;
  };`);
async function open(page, count = 21, gameContext = false) {
  await page.addInitScript(() => performance.setResourceTimingBufferSize(2000));
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
  await page.locator('.leaderboard-family-picker').click();
  await page.locator(`[data-rank-family="${family}"]`).click();
}
test('all three game tabs fit one row in every skin on narrow and wide screens',async({page})=>{
 await open(page,1);
 for(const skin of ['default','woodland','papercut','starship','storybook'])for(const width of [320,412,1024]){
  await page.setViewportSize({width,height:900});await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);
  const tabs=page.locator('.leaderboard-tabs--game');await expect(tabs.getByRole('tab')).toHaveCount(3);
  const geometry=await tabs.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,buttons:[...node.children].map(child=>({top:child.offsetTop,width:child.clientWidth,scroll:child.scrollWidth}))}));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width+1);expect(new Set(geometry.buttons.map(button=>button.top)).size).toBe(1);expect(geometry.buttons.every(button=>button.scroll<=button.width+1)).toBe(true);
 }
});
for (const count of [0, 1, 10, 11]) test(`record count ${count}, private own record and no repeated copy`, async ({ page }) => {
  await open(page, count);
  if (count) await expect(page.locator('.leaderboard-difficulties')).toBeVisible();
  else await expect(page.locator('.leaderboard-status')).toHaveText('Chưa có thành tích.');
  await page.evaluate(() => { window.rankUid = 'row-0'; });
  await reopen(page);
  if (count) { await expect(page.locator('.leaderboard-list .is-self')).toHaveCount(1); await expect(page.locator('.leaderboard-own .leaderboard-rank')).toHaveText('1'); }
  await page.evaluate(() => { window.rankUid = 'outside'; });
  await reopen(page);
  await expect(page.locator('.leaderboard-own .leaderboard-card-level')).toHaveText('Màn 10');
  await expect(page.locator('.leaderboard-own')).toContainText('Bạn');
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

test('shared family menu opens without querying, supports keyboard and clamps above an anchor near the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await open(page);
  await page.locator('[data-rank-game="link-connect"]').click();
  await expect(page.locator('.leaderboard-results')).not.toHaveAttribute('aria-busy', 'true');
  const before = await page.evaluate(() => window.rankRequests.length);
  const anchor = page.locator('.leaderboard-family-picker'); await anchor.click();
  const menu = page.getByRole('menu'); await expect(menu).toBeVisible();
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(before);
  await expect(menu.locator('[data-rank-family="adventure"]')).toBeFocused();
  await menu.locator('[data-rank-family="adventure"]').press('End');
  await expect(menu.locator('[data-rank-family="endless"]')).toBeFocused();
  await menu.locator('[data-rank-family="endless"]').press('Escape');
  await expect(menu).toHaveCount(0); await expect(anchor).toBeFocused();
  await anchor.click(); await menu.locator('[data-rank-family="adventure"]').press('Tab');
  await expect(menu).toHaveCount(0); await expect(page.getByRole('button',{name:'Độ khó C',exact:true})).toBeFocused();
  await anchor.click(); await menu.locator('[data-rank-family="adventure"]').press('Shift+Tab');
  await expect(menu).toHaveCount(0); await expect(page.locator('.leaderboard-results')).toBeFocused();
  await anchor.evaluate(node => { node.style.position = 'fixed'; node.style.bottom = '10px'; node.style.zIndex = '15000'; });
  await anchor.click(); await expect(menu).toHaveAttribute('data-direction', 'up');
  const box = await menu.boundingBox(); const trigger = await anchor.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(128); expect(box.width).toBeLessThanOrEqual(152); expect(box.y).toBeGreaterThanOrEqual(8); expect(box.y + box.height).toBeLessThan(trigger.y);
  await menu.locator('[data-rank-family="adventure"]').press('ArrowDown');
  await menu.locator('[data-rank-family="challenge"]').press('Enter');
  expect(await page.evaluate(() => window.rankRequests.at(-1))).toMatchObject({ gameId: 'link-connect', family: 'challenge', page: 1 });
  expect(await page.evaluate(() => window.rankRequests.length)).toBe(before + 1);
  await expect(anchor).toBeFocused(); await expect(anchor).toContainText('Thử thách');
  await page.locator('[data-rank-game="triple-connect"]').click();
  await expect(page.locator('[data-rank-game="triple-connect"]')).toHaveAttribute('aria-selected','true');
  await expect(anchor).toContainText('Thử thách');
  expect(await page.evaluate(()=>window.rankRequests.at(-1))).toMatchObject({gameId:'triple-connect',family:'challenge',page:1});
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
    await page.locator('.leaderboard-family-picker').click();
    await page.locator('[data-rank-family="adventure"]').press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await selectFamily(page, 'memory-match', 'challenge');
    await expect(page.locator('.leaderboard-list li').first()).toContainText('Màn');
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
for (const viewport of [{ width: 320, height: 740 }, { width: 412, height: 915 }, { width: 640, height: 360 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
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
    const headingBox = await page.locator('.leaderboard-heading').boundingBox();
    const familyBox = await page.locator('.leaderboard-family-picker').boundingBox();
    const gamesBox = await page.locator('.leaderboard-tabs--game').boundingBox();
    expect(familyBox.y).toBeGreaterThanOrEqual(gamesBox.y + gamesBox.height);
    expect(familyBox.y).toBeGreaterThanOrEqual(headingBox.y);
    expect(familyBox.y + familyBox.height).toBeLessThanOrEqual(headingBox.y + headingBox.height);
    await expect(page.locator('.leaderboard-heading .leaderboard-family-picker')).toHaveCount(1);
    await expect(page.locator('.leaderboard-view > .leaderboard-family-picker')).toHaveCount(0);
    await expect(page.locator('.leaderboard-heading-player')).toHaveCount(0);
    await expect(page.locator('.leaderboard-difficulties')).toBeHidden();
    await expect(page.locator('.leaderboard-tabs--game [aria-haspopup]')).toHaveCount(0);
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
  await page.locator('.leaderboard-list li').last().scrollIntoViewIfNeeded();
  const last = await page.locator('.leaderboard-list li').last().boundingBox();
  const region = await page.locator('.leaderboard-results').boundingBox();
  expect(last.y + last.height).toBeLessThanOrEqual(region.y + region.height);
  await page.locator('.leaderboard-results').evaluate(node => { node.scrollTop = 0; });
  expect(await page.locator('.leaderboard-rank--1').evaluate(node => getComputedStyle(node).color)).toBe('rgb(255, 249, 232)');
  await expect(page.locator('.ui-icon--rank-medal')).toHaveCount(3);
  await expect(page.locator('.leaderboard-medal-number')).toHaveText(['1', '2', '3']);
  await expect(page.getByRole('img', { name: 'Hạng 1', exact: true })).toHaveCount(1);
  expect(await page.locator('.leaderboard-rank--1').evaluate(node => getComputedStyle(node).borderStyle)).toBe('none');
  await expect(page.locator('.leaderboard-list li').nth(3).locator('.ui-icon--rank-medal')).toHaveCount(0);
  await page.locator('.leaderboard-results').blur();
  await page.screenshot({ path: 'docs/design/app-tabs/qa/mobile-level.png', animations: 'disabled' });
  await page.locator('.leaderboard-family-picker').click();
  await page.screenshot({ path: 'docs/design/app-tabs/qa/mobile-family-menu.png', animations: 'disabled' });
  await page.locator('[data-rank-family="adventure"]').press('Escape');
  await selectFamily(page, 'memory-match', 'challenge'); await expect(page.locator('.leaderboard-list li').first()).toContainText('Màn');
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

test('equipped portrait fills its slot without a second circular backing or cropped ornaments', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await open(page, 4, true);
  await page.evaluate(() => {
    window.rankNames = ['Người chơi Reks2', 'Ảnh không khung', 'Khung trang trí', 'Chưa trang bị'];
    window.rankCosmetics = [
      ['row-0', { avatar: 'starter-avatar-little-sparrow', frame: 'starter-frame-plain-wood', badge: 'starter-badge-first-leaf' }],
      ['row-1', { avatar: 'starter-avatar-little-sparrow' }],
      ['row-2', { avatar: 'memory-avatar-sapphire-owl', frame: 'memory-frame-golden-laurel', badge: 'memory-badge-wisdom-seal' }],
    ];
  });
  await reopen(page);
  for (const [width, height] of [[412, 915], [320, 740], [844, 390], [1024, 900]]) {
    await page.setViewportSize({ width, height });
    const measurements = await page.locator('.leaderboard-list li').evaluateAll(async rows => {
      await Promise.all(rows.flatMap(row => [...row.querySelectorAll('img')].map(image => image.decode())));
      return rows.map(row => {
        const slot = row.querySelector('.leaderboard-avatar'), portrait = slot.firstElementChild;
        const slotStyle = getComputedStyle(slot), box = row.getBoundingClientRect(), portraitBox = portrait.getBoundingClientRect();
        const avatar = portrait.querySelector('.storybook-portrait__avatar');
        const avatarBox = avatar?.getBoundingClientRect();
        return { background: slotStyle.backgroundColor, border: slotStyle.borderWidth, radius: slotStyle.borderRadius,
          layerCount: portrait.querySelectorAll('img').length, portraitWidth: portraitBox.width,
          faceWidth: avatarBox ? avatarBox.width * 318 / 512 : null,
          paintedTop: avatarBox ? avatarBox.top + avatarBox.height * 97 / 512 : null,
          paintedBottom: avatarBox ? avatarBox.top + avatarBox.height * 415 / 512 : null,
          rowTop: box.top, rowBottom: box.bottom, fallbackWidth: portrait.querySelector('.ui-icon')?.getBoundingClientRect().width };
      });
    });
    expect(measurements.map(row => row.layerCount)).toEqual([3, 1, 3, 0]);
    for (const row of measurements) {
      expect(row.background).toBe('rgba(0, 0, 0, 0)'); expect(row.border).toBe('0px'); expect(row.radius).toBe('0px');
      if (row.faceWidth) {
        expect(row.faceWidth).toBeGreaterThan(40); expect(row.paintedTop).toBeGreaterThanOrEqual(row.rowTop);
        expect(row.paintedBottom).toBeLessThanOrEqual(row.rowBottom);
      } else expect(row.fallbackWidth).toBeGreaterThan(36);
    }
    expect(measurements[1].faceWidth).toBeGreaterThan(55);
    await page.screenshot({ path: `design/rewards-liveops/review/ranking-portrait-tight-${width}.png` });
    expect(await page.locator('.leaderboard-results').evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  }
});


test('personal rank stays pinned below scrolling results and pagination across games and sizes', async ({page}) => {
  await open(page, 100); await page.evaluate(()=>{window.rankUid='outside';}); await reopen(page);
  for (const width of [320,412,844,1024]) {
    await page.setViewportSize({width,height:width===844?390:915});
    await expect(page.locator('.leaderboard-own .leaderboard-rank')).toHaveText('42');
    await expect(page.locator('.leaderboard-own')).toContainText('Người chơi Reks2');
    const before=await page.locator('.leaderboard-own').boundingBox();
    await page.locator('.leaderboard-results').evaluate(node=>{node.scrollTop=node.scrollHeight;});
    expect(await page.locator('.leaderboard-own').boundingBox()).toEqual(before);
    const result=await page.locator('.leaderboard-results').boundingBox();
    expect(before.y).toBeGreaterThanOrEqual(result.y+result.height);
    expect(before.y+before.height).toBeLessThanOrEqual(width===844?390:915);
    if(width===412)await page.screenshot({path:'runtime/qa/leaderboard-tabs-pinned-412.png',animations:'disabled'});
  }
  await page.getByRole('button',{name:'Sau',exact:true}).click();
  await expect(page.locator('.leaderboard-own .leaderboard-rank')).toHaveText('42');
  await page.locator('[data-rank-game="link-connect"]').click();
  await expect(page.locator('.leaderboard-own .leaderboard-rank')).toHaveText('42');
  await page.evaluate(()=>{window.rankNoOwn=true;}); await reopen(page);
  await expect(page.locator('.leaderboard-own')).toHaveText('Bạn chưa có thành tích ở bảng này.');
});


test('pinned rank uses the same gold silver bronze markers as the list', async ({page}) => {
  await open(page,100);
  for(const width of [320,412,1024]) {
    await page.setViewportSize({width,height:915});
    for(const rank of [1,2,3,4,42]) {
      await page.evaluate(rank=>{window.rankUid='row-'+(rank-1);},rank); await reopen(page);
      const pinned=page.locator('.leaderboard-own .leaderboard-rank');
      await expect(pinned).toHaveText(String(rank));
      if(rank<=3) {
        const listed=page.locator('.leaderboard-list .leaderboard-rank').nth(rank-1);
        await expect(pinned).toHaveAttribute('role','img'); await expect(pinned).toHaveAttribute('aria-label',`Hạng ${rank}`);
        expect(await pinned.innerHTML()).toBe(await listed.innerHTML());
        const appearance=node=>{const style=getComputedStyle(node),rect=node.getBoundingClientRect();return{face:style.getPropertyValue('--rank-medal-face'),edge:style.getPropertyValue('--rank-medal-edge'),color:style.color,width:rect.width,height:rect.height};};
        expect(await pinned.evaluate(appearance)).toEqual(await listed.evaluate(appearance));
        if(width===412&&rank===1)await page.screenshot({path:'runtime/qa/leaderboard-pinned-medal-412.png',animations:'disabled'});
      } else await expect(pinned.locator('.ui-icon--rank-medal')).toHaveCount(0);
    }
  }
});

test('twelve adventure filters show coherent metrics across five skins and phone sizes',async({page})=>{
 test.setTimeout(120000);await open(page,4,true);await page.evaluate(()=>{window.rankUid='row-0';window.rankNames=['Người chơi Reks2','Thảo Nguyên','Nguyễn Hải Minh với tên dài','Minh Anh'];window.rankCosmetics=[['row-0',{avatar:'starter-avatar-little-sparrow',frame:'starter-frame-plain-wood',badge:'starter-badge-first-leaf'}]];});await reopen(page);
 for(const game of ['memory-match','link-connect','triple-connect']){
  await selectFamily(page,game,'adventure');
  for(const [mode,label] of [['easy','C'],['normal','B'],['hard','A'],['superHard','S']]){
   await page.getByRole('button',{name:`Độ khó ${label}`,exact:true}).click();await expect(page.locator('.leaderboard-results')).not.toHaveAttribute('aria-busy','true');
   expect(await page.evaluate(()=>window.rankRequests.at(-1))).toMatchObject({gameId:game,kind:'adventure',rulesVersion:4,mode});
   await expect(page.locator('.leaderboard-list li').first().locator('.leaderboard-card-stats')).toContainText('Lượt');
   await expect(page.locator('.leaderboard-list li').first().locator('.leaderboard-card-stat--moves')).toHaveText('28');
   await expect(page.locator('.leaderboard-list li').first().locator('.leaderboard-card-stat--misses')).toHaveText('0');
  }
 }
 for(const skin of ['default','woodland','papercut','starship','storybook'])for(const size of [{width:320,height:740},{width:384,height:824},{width:390,height:844},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]){
  await page.setViewportSize(size);await page.evaluate(async skin=>await(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);
  const bounds=await page.locator('.leaderboard-list li').first().evaluate(row=>{const n=row.querySelector('.leaderboard-card-name').getBoundingClientRect(),a=row.querySelector('.leaderboard-avatar').getBoundingClientRect();return {ordered:n.bottom<=a.top,overflow:row.scrollWidth-row.clientWidth,stats:[...row.querySelectorAll('.leaderboard-card-stats > div')].map(n=>n.getBoundingClientRect().width)};});
  expect(bounds.ordered).toBe(true);expect(bounds.overflow).toBeLessThanOrEqual(1);expect(Math.max(...bounds.stats)-Math.min(...bounds.stats)).toBeLessThan(1);
  const panelOverflow=await page.locator('.leaderboard-panel').evaluate(n=>({amount:n.scrollWidth-n.clientWidth,offenders:[...n.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>n.getBoundingClientRect().right+1).map(e=>e.className)}));expect(panelOverflow.amount,JSON.stringify({skin,size,panelOverflow})).toBeLessThanOrEqual(1);
  for(const button of await page.locator('[data-rank-difficulty]').all()){const r=await button.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);}
  if(size.width===384){mkdirSync('runtime/qa-leaderboard-refresh',{recursive:true});await page.screenshot({path:`runtime/qa-leaderboard-refresh/${skin}-384.png`});}
 }
 await selectFamily(page,'memory-match','challenge');await expect(page.locator('.leaderboard-difficulties')).toBeHidden();await expect(page.locator('.leaderboard-card-stats')).toHaveCount(0);
 expect(await page.evaluate(()=>window.rankRequests.at(-1))).toMatchObject({kind:'progress',rulesVersion:3,family:'challenge'});
});

test('missing legacy metrics never look like zero and delayed difficulty responses cannot replace the selected board',async({page})=>{
 await open(page,1);await page.evaluate(()=>{window.rankMetrics={easy:{metricsComplete:false,score:-1,moves:0,misses:0},normal:{score:1000},hard:{score:2000}};});await reopen(page);
 await expect(page.locator('.leaderboard-list .leaderboard-card-stat')).toHaveText(['—','—','—']);
 await page.evaluate(()=>{window.rankDeferred=true;});
 await page.getByRole('button',{name:'Độ khó B',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.rankResolvers.length)).toBe(1);
 await page.getByRole('button',{name:'Độ khó A',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.rankResolvers.length)).toBe(2);
 await page.evaluate(()=>{window.rankDeferred=false;window.rankResolvers[1]();});
 await expect(page.locator('.leaderboard-list .leaderboard-card-stat--score')).toHaveText('2.000');
 await page.evaluate(()=>window.rankResolvers[0]());
 await expect(page.locator('.leaderboard-list .leaderboard-card-stat--score')).toHaveText('2.000');
 await expect(page.getByRole('button',{name:'Độ khó A',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('release flag disabled preserves the existing v3 query and tab presentation',async({page})=>{
 await page.route('**/js/adventureRankingAvailability.js*',route=>route.fulfill({contentType:'text/javascript',body:'export function adventureRankingEnabled(){return false;}'}));
 await open(page,1);await expect(page.locator('.leaderboard-view--records')).toHaveCount(0);await expect(page.locator('.leaderboard-difficulties')).toBeHidden();
 await expect(page.locator('.leaderboard-heading')).toContainText('Màn');
 expect(await page.evaluate(()=>window.rankRequests.at(-1))).toMatchObject({kind:'progress',rulesVersion:3,family:'adventure'});
 await expect(page.locator('.leaderboard-tabs--game [role=tab]')).toHaveCount(3);
});
