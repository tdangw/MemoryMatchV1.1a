import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
for (const id of ['memory-match', 'link-connect', 'triple-connect']) test(`${id} low and high boards stay within the configured resource bounds`, async ({ page }) => {
  test.setTimeout(60000); await page.setViewportSize({ width: 412, height: 915 }); await page.goto('/');
  const evidence = await page.evaluate(async id => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const { gameState } = await import('/js/gameState.js'); gameState.settings.mode = 'challenge';
    gameState.settings.sound = gameState.settings.music = false;
    const rows = [];
    for (const level of [1, 100000]) {
      const longTasks = [];
      const observer = new PerformanceObserver(list => { for (const entry of list.getEntries()) longTasks.push(entry.duration); });
      observer.observe({ type: 'longtask', buffered: false });
      const heapBefore = performance.memory?.usedJSHeapSize ?? null; const began = performance.now();
      if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(level, { skipIntro: true });
      else if (id === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'challenge', level, skipIntro: true });
      else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'challenge', level, seed: `level-qa-${level}`, skipIntro: true });
      const startupMs = performance.now() - began;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      longTasks.push(...observer.takeRecords().map(entry => entry.duration)); observer.disconnect();
      const selector = id === 'memory-match' ? '#grid-container .tile' : id === 'link-connect' ? '.link-tile' : '.triple-connect__tile';
      const record = { level, startupMs, tiles: document.querySelectorAll(selector).length, nodes: document.querySelectorAll('*').length,
        longTasks, heapBefore, heapAfter: performance.memory?.usedJSHeapSize ?? null };
      (await import('/js/gameShell/gameShell.js')).unmountActiveGameShell();
      record.scopeReleased = !(await import('/js/gameShell/gameShellLifecycle.js')).getActiveGameScope(); rows.push(record);
    }
    return { game: id, viewport: { width: innerWidth, height: innerHeight }, userAgent: navigator.userAgent, rows, device: 'Desktop Chrome headless; mobile viewport, not physical device or FPS proof' };
  }, id);
  expect(evidence.rows[0].tiles).toBeGreaterThan(0);
  expect(evidence.rows[1].tiles).toBeGreaterThan(0);
  for (const row of evidence.rows) { expect(row.scopeReleased).toBe(true); expect(row.tiles).toBeLessThanOrEqual(id === 'triple-connect' ? 93 : 60); }
  writeFileSync(`docs/design/leaderboard/qa/level-resources-${id}.json`, JSON.stringify(evidence, null, 2));
});
