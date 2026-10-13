import { expect, test } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
for (const motion of ['no-preference', 'reduce']) test(`profile full chapter victory flow ${motion}`, async ({ browser, baseURL }, info) => {
  test.setTimeout(45000);
  const context = await browser.newContext({ baseURL, viewport: { width: 412, height: 915 }, deviceScaleFactor: 3, reducedMotion: motion, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const bestByLevel = Object.fromEntries(Array.from({ length: 99 }, (_, index) => [`easy:${index + 1}`, { score: 0, stars: 0 }]));
    localStorage.setItem('memoryMatchSave', JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 0, progress: { memoryMatch: { bestByLevel } }, settings: {}, appearance: {} } }));
  });
  await page.goto('/');
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'easy'; gameState.settings.sound = gameState.settings.music = false;
    await (await import('/js/gameController.js')).startNewMemoryRun(100);
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.collectGarbage');
  const heapBefore = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  let paints = 0; let maxLayers = 0;
  await cdp.send('LayerTree.enable');
  cdp.on('LayerTree.layerPainted', () => paints++);
  cdp.on('LayerTree.layerTreeDidChange', event => { maxLayers = Math.max(maxLayers, event.layers?.length || 0); });
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  await page.evaluate(() => {
    window.victoryProfile = { phase: 'fireworks', last: performance.now(), frames: {}, longTasks: [] };
    const tick = now => { const data = window.victoryProfile; (data.frames[data.phase] ||= []).push(now - data.last); data.last = now; data.frame = requestAnimationFrame(tick); }; window.victoryProfile.frame = requestAnimationFrame(tick);
    window.victoryProfile.observer = new PerformanceObserver(list => { for (const entry of list.getEntries()) window.victoryProfile.longTasks.push({ phase: window.victoryProfile.phase, duration: entry.duration }); }); window.victoryProfile.observer.observe({ type: 'longtask' });
  });
  await page.evaluate(async () => { const { gameState } = await import('/js/gameState.js'); gameState.matchedPairs = gameState.totalPairs; gameState.remainingTime = 30; await (await import('/js/logic.js')).checkLevelComplete(); });
  await expect(page.locator('#level-summary-modal')).toBeVisible();
  await page.evaluate(() => { window.victoryProfile.phase = 'summary-confetti'; });
  await page.screenshot({ path: info.outputPath('summary.png') });
  await page.getByRole('button', { name: 'Congratulations!', exact: true }).click();
  await expect(page.locator('#victory-celebration')).toBeVisible();
  const overlap = await page.evaluate(() => { window.victoryProfile.phase = 'flower'; return { canvas: document.querySelectorAll('canvas').length, animations: document.querySelector('#victory-celebration').getAnimations({ subtree: true }).length }; });
  if (motion === 'no-preference') await page.waitForFunction(() => document.querySelector('#victory-celebration').getAnimations({ subtree: true }).every(animation => animation.playState === 'finished'), null, { timeout: 7000 });
  await page.evaluate(() => { window.victoryProfile.phase = 'idle'; });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: info.outputPath('flower.png') });
  await page.locator('#victory-celebration').getByRole('button', { name: 'Về Menu' }).click();
  await expect(page.locator('#victory-celebration')).toHaveCount(0);
  const data = await page.evaluate(() => {
    const data = window.victoryProfile; cancelAnimationFrame(data.frame); data.observer.disconnect();
    return { frames: Object.fromEntries(Object.entries(data.frames).map(([phase, values]) => { values.sort((a, b) => a - b); return [phase, { samples: values.length, p95: values[Math.floor(values.length * .95)] }]; })), longTasks: data.longTasks, canvasAfter: document.querySelectorAll('canvas').length, browser: navigator.userAgent, dpr: devicePixelRatio };
  });
  await cdp.send('HeapProfiler.collectGarbage'); const heapAfter = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve)); await cdp.send('Tracing.end'); const { stream } = await complete;
  let trace = ''; while (true) { const chunk = await cdp.send('IO.read', { handle: stream }); trace += chunk.data; if (chunk.eof) break; } await cdp.send('IO.close', { handle: stream });
  const path = info.outputPath('victory-trace.json'); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, trace);
  const paintEvents = JSON.parse(trace).traceEvents.filter(event => event.name === 'Paint');
  const report = { tracePaintEvents: paintEvents.length, label: process.env.VICTORY_PROFILE_LABEL || 'current', motion, ...data, heapBefore, heapAfter, paints, maxLayers, overlap };
  writeFileSync(info.outputPath('victory-metrics.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ victoryProfile: report }));
  expect(data.canvasAfter).toBe(0);
  await context.close();
});
