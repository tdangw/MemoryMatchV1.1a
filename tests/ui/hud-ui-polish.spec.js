import { expect, test } from '@playwright/test';
import { previewMapLevel, closeLevelPreview } from './helpers/adventureNavigation.js';

async function start(page, id = 'link-connect') {
  await page.evaluate(async id => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'easy';
    gameState.settings.music = gameState.settings.sound = false;
    if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
    else if (id === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', level: 1, skipIntro: true });
    else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', level: 1, skipIntro: true });
  }, id);
  await expect(page.locator('.game-shell-root:visible')).toHaveCount(1);
}

for (const viewport of [{ width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
  test(`preview, profile and tools are complete at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('[data-dock-action="profile"]').click();
    await expect(page.locator('.profile-hero')).not.toHaveClass(/tab-card--ornament/);
    expect(await page.locator('.profile-hero').evaluate(node => getComputedStyle(node, '::before').content)).toBe('none');
    await page.screenshot({ path: `docs/design/hud-polish/qa/profile-${viewport.width}.png` });
    await page.locator('.adventure-screen > .adventure-exit').click();
    await page.locator('.game-selector__choice.is-selected').click();
    await previewMapLevel(page);
    await expect(page.locator('.menu-ad-preview')).toHaveCount(1);
    expect((await page.locator('#adventure-level-modal .app-modal').boundingBox()).y + (await page.locator('#adventure-level-modal .app-modal').boundingBox()).height).toBeLessThanOrEqual((await page.locator('.menu-ad-preview').boundingBox()).y);
    await page.screenshot({ path: `docs/design/hud-polish/qa/preview-${viewport.width}.png` });
    await closeLevelPreview(page);
    const layouts = [];
    for (const id of ['memory-match', 'link-connect', 'triple-connect']) {
      await start(page, id);
      await page.locator('.game-shell-root:visible [aria-controls$="tools-menu"]').click();
      const rows = page.locator('.game-shell-root:visible .hud-tool-item');
      await expect(rows.first()).toBeVisible();
      const data = await rows.evaluateAll(rows => rows.map(row => {
        const style = getComputedStyle(row);
        return { columns: style.gridTemplateColumns, height: row.getBoundingClientRect().height,
          icon: row.querySelectorAll(':scope > svg').length, count: row.querySelector('.hud-tool-count').textContent };
      }));
      expect(data.every(row => row.icon === 1 && /^\d+$/.test(row.count))).toBe(true);
      layouts.push(data[0]);
      await page.screenshot({ path: `docs/design/hud-polish/qa/tools-${id}-${viewport.width}.png` });
    }
    expect(layouts.map(row => row.columns)).toEqual([layouts[0].columns, layouts[0].columns, layouts[0].columns]);
    expect(layouts.map(row => row.height)).toEqual([layouts[0].height, layouts[0].height, layouts[0].height]);
  });
}

for (const reducedMotion of ['no-preference', 'reduce']) test(`freeze bar follows item use, stacking, pause, background and restart with ${reducedMotion}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.clock.install();
  await page.goto('/');
  await start(page);
  await page.evaluate(async () => { await (await import('/js/linkConnect/linkItems.js')).grantLinkItem('freeze', 6); });
  await expect.poll(() => page.evaluate(async () => (await import('/js/linkConnect/linkState.js')).linkGameState.isLocked)).toBe(false);
  const bar = page.locator('.link-freeze-progress');
  if (reducedMotion === 'reduce') await expect(bar).toHaveCSS('transition-duration', '0s');
  else await expect(bar).toHaveCSS('transition-duration', '0.25s');
  const sample = () => page.evaluate(async () => {
    const state = (await import('/js/linkConnect/linkState.js')).linkGameState;
    return { seconds: state.freezeSeconds, time: state.remainingTime, scale: Number(document.querySelector('.link-freeze-progress').style.transform.match(/[\d.]+/)[0]) };
  });
  const freeze = async () => {
    await page.evaluate(() => {
      const bar = document.querySelector('.link-freeze-progress');
      window.freezeRefill = new Promise(resolve => {
        const observer = new MutationObserver(() => {
          if (bar.style.transform !== 'scaleX(1)' || bar.style.opacity !== '1') return;
          const style = getComputedStyle(bar);
          resolve({ scale: new DOMMatrixReadOnly(style.transform).a, duration: style.transitionDuration,
            transitions: bar.getAnimations().filter(animation => animation.transitionProperty === 'transform').length });
          observer.disconnect();
        });
        observer.observe(bar, { attributes: true, attributeFilter: ['style'] });
      });
    });
    await page.locator('#link-tools-toggle').click();
    await page.locator('[data-item="freeze"]').click();
    expect(await page.evaluate(() => window.freezeRefill)).toEqual({ scale: 1, duration: '0s', transitions: 0 });
    await expect(bar).toHaveCSS('opacity', '1');
  };
  await freeze();
  const initial = await sample();
  await page.clock.runFor(2000);
  const running = await sample();
  expect(running.seconds).toBeLessThan(initial.seconds);
  expect(running.scale).toBeLessThan(initial.scale);
  expect(running.time).toBe(initial.time);
  await page.locator('#link-actions-menu-toggle').click();
  const paused = await sample();
  await page.clock.runFor(2500);
  expect(await sample()).toEqual(paused);
  await page.locator('#game-exit-modal').getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await freeze();
  expect((await sample()).seconds).toBeGreaterThan(10);
  await page.clock.runFor(1000);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const background = await sample();
  await page.clock.runFor(2000);
  expect(await sample()).toEqual(background);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.screenshot({ path: 'docs/design/hud-polish/qa/freeze-412.png' });
  await page.clock.runFor(20000);
  await expect(bar).toHaveCSS('opacity', '0');
  expect((await sample()).time).toBeLessThan(initial.time);
  for (let cycle = 0; cycle < 3; cycle++) {
    await freeze();
    await page.evaluate(async () => { await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', level: 1, restart: true, skipIntro: true }); });
    await expect(bar).toHaveCount(1);
    await expect(bar).toHaveCSS('opacity', '0');
    await expect.poll(() => page.evaluate(async () => (await import('/js/linkConnect/linkState.js')).linkGameState.isLocked)).toBe(false);
  }
});

for (const reducedMotion of ['no-preference', 'reduce']) test(`animated artwork uses vector shapes with ${reducedMotion}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/');
  await start(page);
  const freeze = await page.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js');
    gameState.appearance.linkExitEffect = 'freeze';
    const { linkGameState } = await import('/js/linkConnect/linkState.js');
    const connection = (await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(linkGameState.board.grid)[0];
    const tiles = (await import('/js/linkConnect/linkRenderer.js')).playLinkMatchExit(connection.start, connection.end);
    return tiles.map(tile => ({ content: getComputedStyle(tile, '::before').content, art: getComputedStyle(tile, '::before').backgroundImage }));
  });
  expect(freeze.every(tile => tile.content === '""' && tile.art.includes('freeze-crystal.svg'))).toBe(true);
  await page.evaluate(async () => (await import('/js/linkConnect/linkRenderer.js')).clearLinkTransientEffects());
  await expect(page.locator('.link-tile.is-removing')).toHaveCount(0);
  await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ level: 1, score: 1234, stars: 2, coinsEarned: 10, moves: 1, misses: 0, remainingTime: 20, timeBonus: 0, settings: {} }));
  const stars = page.locator('#level-summary-modal .level-summary__star');
  await expect(stars).toHaveCount(3);
  await expect(page.locator('#level-summary-modal .level-summary-modal')).toHaveCSS('overflow', 'visible');
  await expect(stars.locator('svg')).toHaveCount(3);
  await expect(stars.last()).toHaveCSS('opacity', '1');
  await expect(stars.last()).toHaveCSS('filter', 'grayscale(1) brightness(0.85)');
  expect(await stars.allTextContents()).toEqual(['', '', '']);
  await expect(stars.first()).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `docs/design/hud-polish/qa/summary-${reducedMotion}.png` });
  await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
  await expect(page.locator('#level-summary-modal')).toHaveCount(0);
});
