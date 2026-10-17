import { expect, test } from '@playwright/test';

test('fireworks and confetti are cancelled by their owner, without a late summary', async ({ page }) => {
  await page.goto('/'); await page.emulateMedia({ reducedMotion: 'no-preference' });
  const data = await page.evaluate(async () => {
    const { createGameShellLifecycle } = await import('/js/gameShell/gameShellLifecycle.js');
    const presentation = await import('/js/victoryPresentation.web.js');
    const owner = createGameShellLifecycle();
    const fireworks = presentation.showSummaryFireworks({ durationMs: 3000, owner });
    owner.dispose();
    const afterFireworks = document.querySelectorAll('#victory-fireworks').length;
    const confettiOwner = createGameShellLifecycle();
    presentation.launchSummaryConfetti(confettiOwner);
    confettiOwner.dispose();
    const afterConfetti = document.querySelectorAll('canvas').length;
    return { afterFireworks, afterConfetti };
  });
  expect(data).toEqual({ afterFireworks: 0, afterConfetti: 0 });
});


test('30 cancellation, game-switch, hidden-tab and early-flower cycles release every owned resource', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/'); await page.emulateMedia({ reducedMotion: 'no-preference' });
  const cdp = await page.context().newCDPSession(page); await cdp.send('HeapProfiler.enable'); await cdp.send('Performance.enable');
  const samples = [];
  await page.exposeBinding('sampleVictoryHeap', async () => {
    // Measure after the renderer has processed cancelled WAAPI effects and detached their targets.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await cdp.send('HeapProfiler.collectGarbage');
    const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(item => [item.name, item.value]));
    samples.push({ heap: (await cdp.send('Runtime.getHeapUsage')).usedSize, nodes: metrics.Nodes, listeners: metrics.JSEventListeners });
  });
  const result = await page.evaluate(async () => {
    const lifecycle = await import('/js/gameShell/gameShellLifecycle.js');
    const presentation = await import('/js/victoryPresentation.web.js');
    const { showVictoryCelebration } = await import('/js/victoryCelebration.js');
    const { showLevelSummaryOverlay } = await import('/js/ui.js');
    const { showGameSelector } = await import('/js/gameSelector.js');
    const { getAppPageScope } = await import('/js/appPageLifecycle.js');
    const navigation = await import('/tests/ui/helpers/gameNavigation.js');
    const diagnostics = [];
    for (let index = 0; index < 30; index++) {
      const owner = lifecycle.createGameShellLifecycle();
      const pending = presentation.showSummaryFireworks({ durationMs: 2000, owner });
      await new Promise(requestAnimationFrame);
      Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
      document.dispatchEvent(new Event('visibilitychange'));
      if (!document.querySelector('#victory-fireworks').hidden) throw new Error('Hidden fireworks');
      Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange'));
      owner.dispose(); owner.dispose();
      if (await pending !== false || document.querySelector('#victory-fireworks')) throw new Error('Cancelled fireworks survived');
      const confettiOwner = lifecycle.createGameShellLifecycle();
      const confetti = presentation.launchSummaryConfetti(confettiOwner);
      await new Promise(requestAnimationFrame);
      Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
      if (document.querySelector('.summary-confetti')) throw new Error('Hidden confetti survived');
      Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange'));
      confettiOwner.dispose();
      diagnostics.push({ owner: owner.diagnostics(), confetti: confetti.diagnostics() });
      await navigation.openReadyGameMenu(['memory-match', 'link-connect', 'triple-connect'][index % 3]);
      const pageOwner = getAppPageScope();
      showLevelSummaryOverlay({ level: 100, score: 100, stars: 3, coinsEarned: 10, moves: 1, misses: 0, remainingTime: 20, timeBonus: 0, settings: {}, onNext: () => { window.lateVictory = true; } });
      showGameSelector();
      if (pageOwner.active) throw new Error('Old page retained');
      const celebration = showVictoryCelebration({ level: 100, settings: { sound: false, music: false } });
      await new Promise(requestAnimationFrame);
      celebration.dispose(); celebration.dispose();
      if (document.querySelector('#victory-celebration, #victory-fireworks, .summary-confetti, #level-summary-modal')) throw new Error('Victory resource survived');
      if ((index + 1) % 10 === 0) await window.sampleVictoryHeap();
    }
    delete document.hidden;
    return { diagnostics, late: window.lateVictory || false, audio: { scene: (await import('/js/sound.js')).sounds.congratulations.paused } };
  });
  console.log(JSON.stringify({ victorySoak: samples }));
  expect(Math.max(...samples.map(item => item.heap)) - Math.min(...samples.map(item => item.heap))).toBeLessThan(2 * 1024 * 1024);
  expect(new Set(samples.map(item => item.listeners)).size).toBe(1);
  expect(new Set(samples.map(item => item.nodes)).size).toBe(1);
  expect(result.late).toBe(false); expect(result.audio.scene).toBe(true);
  for (const sample of result.diagnostics) for (const counts of Object.values(sample)) expect(counts).toEqual({ active: false, listener: 0, timeout: 0, interval: 0, frame: 0, animation: 0, node: 0, cleanup: 0 });
  await page.clock.install(); await page.clock.runFor(5000);
  await expect(page.locator('#level-summary-modal, #victory-celebration, #victory-fireworks, .summary-confetti')).toHaveCount(0);
});

test('replacement and reduced-motion changes cancel only the current show', async ({ page }) => {
  await page.goto('/'); await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(async () => {
    const { createGameShellLifecycle } = await import('/js/gameShell/gameShellLifecycle.js');
    const show = (await import('/js/victoryPresentation.web.js')).showSummaryFireworks;
    window.victoryOwner = createGameShellLifecycle();
    window.oldShow = show({ durationMs: 10000, owner: window.victoryOwner });
    window.newShow = show({ durationMs: 10000, owner: window.victoryOwner });
  });
  expect(await page.evaluate(() => window.oldShow)).toBe(false);
  await expect(page.locator('#victory-fireworks')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.newShow);
  await expect(page.locator('#victory-fireworks')).toHaveCount(0);
  await page.evaluate(() => window.victoryOwner.dispose());
});


test('natural completion forgets resources while the parent stays active', async ({ page }) => {
  await page.goto('/'); await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(async () => {
    const { createGameShellLifecycle } = await import('/js/gameShell/gameShellLifecycle.js');
    const presentation = await import('/js/victoryPresentation.web.js');
    window.naturalOwner = createGameShellLifecycle();
    await presentation.showSummaryFireworks({ owner: window.naturalOwner, durationMs: 80 });
    presentation.launchSummaryConfetti(window.naturalOwner);
  });
  await expect(page.locator('#victory-fireworks, .summary-confetti')).toHaveCount(0, { timeout: 7000 });
  expect(await page.evaluate(() => window.naturalOwner.diagnostics())).toEqual({ active: true, listener: 0, timeout: 0, interval: 0, frame: 0, animation: 0, node: 0, cleanup: 0 });
  await page.evaluate(() => window.naturalOwner.dispose());
});


test('a replaced summary cannot run its old pending continuation in the same parent', async ({ page }) => {
  await page.goto('/'); await page.clock.install();
  await page.evaluate(async () => {
    const { showLevelSummaryOverlay } = await import('/js/ui.js');
    window.summaryCompletion = { level: 100, score: 100, stars: 3, coinsEarned: 10, moves: 1, misses: 0, remainingTime: 20, timeBonus: 0, settings: {}, onNext: () => { window.staleSummaryNext = true; } };
    showLevelSummaryOverlay(window.summaryCompletion);
  });
  await expect(page.locator('#level-summary-modal')).toBeVisible();
  await page.getByRole('button', { name: 'Next Level', exact: true }).click();
  await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ ...window.summaryCompletion, level: 101 }));
  await page.clock.runFor(500);
  expect(await page.evaluate(() => window.staleSummaryNext || false)).toBe(false);
  await expect(page.locator('#level-summary-modal')).toContainText('Màn 101');
  await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
});

test('summary counters resolve statically when motion is reduced during their stagger', async ({ page }) => {
  await page.goto('/'); await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ level: 1, score: 1234, stars: 3, coinsEarned: 10, moves: 1, misses: 0, remainingTime: 20, timeBonus: 0, settings: {} }));
  await page.clock.runFor(3600);
  await expect(page.locator('#level-summary-modal')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.level-summary__score')).toHaveText('1,234 ĐIỂM');
  await expect(page.locator('.summary-coins strong')).toHaveText('+10');
  await expect(page.locator('.summary-confetti')).toHaveCount(0);
  await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
});


test('restarting each real game during fireworks cancels the old summary across repeated rounds', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/'); await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js'); gameState.settings.sound = gameState.settings.music = false; gameState.settings.mode = 'easy';
    const { openReadyGameMenu } = await import('/tests/ui/helpers/gameNavigation.js');
    const { showLevelSummaryOverlay } = await import('/js/ui.js');
    for (const game of ['memory-match', 'link-connect', 'triple-connect']) {
      await openReadyGameMenu(game);
      for (let round = 0; round < 3; round++) {
        let restart;
        if (game === 'memory-match') {
          const controller = await import('/js/gameController.js'); await controller.startNewMemoryRun(1); restart = () => controller.restartMemoryLevel();
        } else if (game === 'link-connect') {
          const controller = await import('/js/linkConnect/linkController.js'); await controller.startLinkLevel({ mode: 'easy', level: 1 }); restart = () => controller.startLinkLevel({ mode: 'easy', level: 1, restart: true });
        } else {
          const controller = await import('/js/tripleConnect/tripleController.js'); await controller.startTripleConnectRound({ mode: 'easy', skipIntro: true }); restart = () => controller.startTripleConnectRound({ mode: 'easy', reason: 'restart', skipIntro: true });
        }
        showLevelSummaryOverlay({ level: 100, score: 100, stars: 3, coinsEarned: 10, moves: 1, misses: 0, remainingTime: 20, timeBonus: 0, settings: {} });
        if (!document.querySelector('#victory-fireworks')) throw new Error('No active fireworks');
        await restart();
        if (document.querySelector('#victory-fireworks, #level-summary-modal, .summary-confetti')) throw new Error('Old round retained victory');
      }
    }
  });
  await page.clock.install(); await page.clock.runFor(5000);
  await expect(page.locator('#victory-fireworks, #level-summary-modal, .summary-confetti')).toHaveCount(0);
});
