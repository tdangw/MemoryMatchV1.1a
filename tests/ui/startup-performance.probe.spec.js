import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const games = ['memory-match', 'link-connect', 'triple-connect'];
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];

test('startup CPU and image readiness: cold/warm, three games, 1x/6x', async ({ browser }, testInfo) => {
  test.setTimeout(300000);
  const samples = [];
  const repeats = Number(process.env.STARTUP_SAMPLES || 5);
  for (const cpu of [1, 6]) for (const id of games) for (let repeat = 0; repeat < repeats; repeat++) {
    const context = await browser.newContext({ viewport: { width: 412, height: 915 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await page.goto(testInfo.project.use.baseURL || 'http://127.0.0.1:' + (process.env.GAME_SHELL_TEST_PORT || '4173'));
    await expect(page.locator('.game-selector__choice').first()).toBeVisible();
    await page.evaluate(async id => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      await Promise.all([import('/js/gameController.js'), import('/js/linkConnect/linkController.js'), import('/js/tripleConnect/tripleController.js'), import('/js/gameShell/gameShell.js')]);
      const { gameState } = await import('/js/gameState.js');
      gameState.settings.mode = 'superHard';
      gameState.settings.sound = false;
      gameState.settings.music = false;
    }, id);
    // The previous menu must finish layout/font work before gameplay's clock.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    for (const cache of ['cold', 'warm']) {
      const sample = await page.evaluate(async ({ id, cache }) => {
        const memory = await import('/js/gameController.js');
        const link = await import('/js/linkConnect/linkController.js');
        const triple = await import('/js/tripleConnect/tripleController.js');
        const { gameState } = await import('/js/gameState.js');
        const { getActiveSession } = await import('/js/sessionProgress.js');
        const { getGameShellDiagnostics } = await import('/js/gameShell/gameShell.js');
        const longTasks = [];
        const observer = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration }))));
        observer.observe({ type: 'longtask' });
        const begin = performance.now();
        let firstResponseMs;
        requestAnimationFrame(() => { firstResponseMs = performance.now() - begin; });
        const pending = id === 'memory-match'
          ? cache === 'cold' ? memory.startNewMemoryRun() : memory.continueMemorySession(getActiveSession(id, 'superHard'))
          : id === 'link-connect'
            ? cache === 'cold' ? link.startLinkLevel({ mode: 'superHard' }) : link.continueLinkSession(getActiveSession(id, 'superHard'))
            : cache === 'cold' ? triple.startTripleConnectRound({ mode: 'superHard', seed: 'startup-probe', skipIntro: true }) : triple.continueTripleConnectSession(getActiveSession(id, 'superHard'));
        const commandMs = performance.now() - begin;
        await pending;
        const shell = getGameShellDiagnostics().activeShell;
        const startupMetrics = shell.scope.startup?.diagnostics();
        const domMs = startupMetrics ? startupMetrics.domReadyAt - begin : performance.now() - begin;
        const images = [...shell.root.querySelectorAll('[data-shell-region="board"] img')];
        const decodeBegin = performance.now();
        const decoded = startupMetrics ? [] : await Promise.allSettled(images.map(image => image.decode()));
        const imageWaitMs = startupMetrics ? startupMetrics.phases.find(phase => phase.name === 'images').durationMs : performance.now() - decodeBegin;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        observer.takeRecords().forEach(entry => longTasks.push({ start: entry.startTime, duration: entry.duration }));
        observer.disconnect();
        const result = {
          commandMs, firstResponseMs, domMs, imageWaitMs, boardReadyMs: performance.now() - begin,
          longestTaskMs: Math.max(0, ...longTasks.filter(task => task.start >= begin).map(task => task.duration)),
          images: images.length, failedImages: startupMetrics?.failedImages || decoded.filter(result => result.status === 'rejected').length,
          nodes: shell.root.querySelectorAll('*').length,
          phases: shell.scope.startup?.diagnostics() || null,
        };
        shell.scope.dispose();
        return result;
      }, { id, cache });
      samples.push({ id, cpu, cache, repeat, ...sample });
      expect(sample.images).toBeGreaterThan(0);
      expect(sample.failedImages).toBe(0);
    }
    await context.close();
  }
  const summary = [];
  for (const id of games) for (const cpu of [1, 6]) for (const cache of ['cold', 'warm']) {
    const rows = samples.filter(row => row.id === id && row.cpu === cpu && row.cache === cache);
    summary.push({ id, cpu, cache, samples: rows.length, ...Object.fromEntries(['commandMs', 'firstResponseMs', 'domMs', 'imageWaitMs', 'boardReadyMs', 'longestTaskMs'].map(key => [key, { median: percentile(rows.map(row => row[key]), .5), p95: percentile(rows.map(row => row[key]), .95) }])) });
  }
  const path = process.env.STARTUP_REPORT_PATH || testInfo.outputPath('startup-performance.json');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ summary, samples }, null, 2));
  console.log(JSON.stringify(summary));
  if (process.env.STARTUP_ENFORCE_BUDGET === '1') for (const profile of summary.filter(profile => profile.cpu === 6)) expect(profile.commandMs.p95).toBeLessThan(100);
});
