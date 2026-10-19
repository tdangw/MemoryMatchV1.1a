import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const folder = 'test-results/victory-design';
mkdirSync(folder, { recursive: true });
const sizes = [{ width: 320, height: 740 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }];
const games = ['memory-match', 'link-connect', 'triple-connect'];
const metadata = JSON.parse(readFileSync('docs/design/ui-images/runtime-metadata.json', 'utf8'));

test('every exported image decodes; icon API keeps SVG accessibility and fallback', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async assets => Promise.all(assets.map(async ({ url }) => {
    const image = new Image(); image.src = url; await image.decode();
    return { url, width: image.naturalWidth, height: image.naturalHeight };
  })), metadata.assets);
  expect(results).toHaveLength(metadata.assets.length);
  expect(results.every(image => image.width > 0 && image.height > 0)).toBe(true);
  const icons = await page.evaluate(async () => {
    const { createIcon } = await import('/js/icons.js');
    const image = createIcon('home'), fallback = createIcon('unknown-old-icon');
    return { tag: image.tagName, hidden: image.getAttribute('aria-hidden'), focus: image.getAttribute('focusable'), href: image.querySelector('image').getAttribute('href'), fallback: fallback.querySelectorAll('path, circle').length };
  });
  expect(icons).toMatchObject({ tag: 'svg', hidden: 'true', focus: 'false' });
  expect(icons.href).toContain('night-home.webp'); expect(icons.fallback).toBeGreaterThan(0);
  expect(metadata.totals.garden).toBeLessThanOrEqual(350000);
  expect(metadata.totals.reward).toBeLessThanOrEqual(250000);
  expect(metadata.totals.icons).toBeLessThanOrEqual(250000);
});

for (const size of sizes) test(`painted surfaces preserve three games and screen layouts at ${size.width}`, async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize(size);
  await page.goto('/');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('.adventure-dock svg image')).toHaveCount(5);
  await page.screenshot({ path: `${folder}/home-${size.width}.png` });
  for (const game of games) {
    await page.evaluate(async game => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game), game);
    await page.locator('.adventure-map-node--level:not(:disabled)').first().click();
    await expect(page.locator('#adventure-level-modal [data-ui-surface="garden"]')).toHaveCSS('border-image-source', /garden-panel.webp/);
    await page.screenshot({ path: `${folder}/preview-${game}-${size.width}.png` });
    await page.locator('#adventure-level-modal .app-modal__close').click();
    await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
    await page.locator('[data-dock-action="shop"]:visible').click();
    await page.locator('#shop-modal .shop-buy-button').first().click();
    await expect(page.locator('#shop-confirm-modal [data-ui-surface="garden"]')).toBeVisible();
    await expect(page.locator('.menu-ad-preview')).toHaveCount(1);
    if (game === games[0]) await page.screenshot({ path: `${folder}/purchase-${size.width}.png` });
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(page.locator('#shop-confirm-modal')).toHaveCount(0);
    if (game === games[0]) await page.screenshot({ path: `${folder}/shop-${size.width}.png` });
    await page.evaluate(async game => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game);
      const { gameState } = await import('/js/gameState.js');
      gameState.settings.sound = gameState.settings.music = false;
      if (game === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
      else if (game === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', level: 1, skipIntro: true });
      else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', level: 1, skipIntro: true });
    }, game);
    const root = page.locator('.game-shell-root:visible');
    await root.locator('[aria-controls="game-exit-modal"]').click();
    const pauseActions = page.locator('#game-exit-modal .app-modal__footer .app-button');
    await expect(pauseActions).toHaveCount(3);
    const actionBoxes = await Promise.all((await pauseActions.all()).map(button => button.boundingBox()));
    for (let index = 0; index < actionBoxes.length; index++) {
      expect(actionBoxes[index].width / actionBoxes[index].height).toBeLessThan(4.5);
      expect(Math.abs(actionBoxes[index].x - actionBoxes[0].x)).toBeLessThan(1);
      if (index) expect(actionBoxes[index].y).toBeGreaterThanOrEqual(actionBoxes[index-1].y + actionBoxes[index-1].height);
    }
    await page.screenshot({ path: `${folder}/pause-${game}-${size.width}.png` });
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
    await expect(page.locator('#game-exit-modal')).toHaveCount(0);
    const toggle = root.locator('[aria-controls$="tools-menu"]');
    await toggle.click();
    await expect(root.locator('.hud-tool-list svg image').first()).toBeVisible();
    await page.screenshot({ path: `${folder}/tools-${game}-${size.width}.png` });
    await toggle.click();
    await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ level: 999, score: 1234567, stars: 2, coinsEarned: 1234, moves: 100, misses: 12, remainingTime: 77, timeBonus: 15, luckyAwards: [{ type: 'coins', value: 10 }], settings: {} }));
    const summary = page.locator('#level-summary-modal [data-ui-surface="reward"]');
    await expect(summary).toHaveCSS('border-image-source', /garden-panel.webp/);
    await expect(summary).toHaveCSS('background-color', 'rgb(8, 38, 46)');
    await expect(summary.locator('.level-summary__stat > svg')).toHaveCount(3);
    await expect(summary.locator('.level-summary__star--unearned')).toHaveCSS('opacity', '1');
    await expect(summary.locator('.level-summary__star--unearned')).toHaveCSS('filter', 'grayscale(1) brightness(0.85)');
    await expect(summary.locator('.app-modal__body')).toHaveCSS('scrollbar-width', 'none');
    await expect(summary.locator('.level-summary__stat')).toHaveCount(3);
    await expect(summary.locator('.level-summary__stat > span')).toHaveText(['Xu nhận', 'Thời gian', 'Điểm']);
    await expect(summary.locator('.summary-points strong')).toHaveText('1,234,567');
    const titleFits = await summary.locator('.level-summary__heading text').evaluate(text => {
      const box = text.getBBox(); return box.x >= 44 && box.x + box.width <= 316;
    });
    expect(titleFits).toBe(true);
    await expect(summary.locator('.level-summary__star--unearned image')).toHaveAttribute('href', /star.webp/);
    await expect(summary.locator('.app-modal__footer button').last()).toBeInViewport();
    const panelBox = await summary.boundingBox();
    for (const star of await summary.locator('.level-summary__star').all()) {
      const starBox = await star.boundingBox();
      expect(starBox.y).toBeGreaterThanOrEqual(panelBox.y);
      expect(starBox.y + starBox.height).toBeLessThanOrEqual(panelBox.y + panelBox.height);
    }
    const box = await summary.boundingBox(), slot = await page.locator('.gameplay-ad-slot').boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(slot.y);
    await page.screenshot({ path: `${folder}/win-${game}-${size.width}.png` });
    await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
    await expect(page.locator('#level-summary-modal')).toHaveCount(0);
  }
  for (const tab of ['profile', 'settings', 'ranking', 'missions', 'events']) {
    await page.locator(`[data-dock-action="${tab}"]:visible`).click();
    await expect(page.locator('.adventure-screen .app-modal')).not.toHaveAttribute('data-ui-surface');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${folder}/${tab}-${size.width}.png` });
    await page.locator('.adventure-screen > .adventure-exit').click();
  }
  expect(errors).toEqual([]);
});


test('single chapter action stays compact and centered', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ level: 100, stars: 3, score: 275, coinsEarned: 18, remainingTime: 77, isVictoryCelebration: true }));
  const panel = page.locator('#level-summary-modal .app-modal');
  const button = panel.locator('.app-modal__footer button');
  await expect(button).toHaveCount(1);
  const frame = await panel.boundingBox(), action = await button.boundingBox();
  expect(Math.abs(action.x + action.width/2 - frame.x - frame.width/2)).toBeLessThan(2);
  expect(action.width/action.height).toBeLessThan(4.5);
});
