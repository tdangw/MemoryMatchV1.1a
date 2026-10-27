import { expect, test } from '@playwright/test';

// Exercise the preserved facade independently of Home's approved static scene.
async function isolateMeteorFacade(page) {
  await page.locator('.game-selector__choice').first().waitFor();
  await page.evaluate(async () => {
    (await import('/js/appPageLifecycle.js')).disposeAppPage();
    const effects = await import('/js/backgroundEffects.js');
    effects.setMeteorSceneEligible(true);
    effects.setMeteorEffectsEnabled(true);
  });
}

test('two permanent meteors survive ten minutes and 100 eligibility cycles with one scheduler', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.meteor-layer .shooting-star')).toHaveCount(2);
  await isolateMeteorFacade(page);
  await page.clock.install();
  await page.evaluate(() => { window.meteorNodes = [...document.querySelectorAll('.shooting-star')]; });
  await page.clock.runFor(600000);
  const diagnostics = await page.evaluate(async () => {
    const effects = await import('/js/backgroundEffects.js');
    for (let i = 0; i < 100; i++) {
      effects.initializeMeteorEffects(true);
      effects.setMeteorSceneEligible(false);
      const blocked = effects.getMeteorDiagnostics();
      if (blocked.active || blocked.timers) throw new Error('Blocked meteor resources');
      effects.setMeteorSceneEligible(true);
    }
    return { ...effects.getMeteorDiagnostics(), same: window.meteorNodes.every((node, i) => node === document.querySelectorAll('.shooting-star')[i]) };
  });
  expect(diagnostics).toMatchObject({ nodes: 2, timers: 1, same: true });
  await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
  await page.locator('[data-dock-action="ranking"]').click();
  expect(await page.evaluate(async () => (await import('/js/backgroundEffects.js')).getMeteorDiagnostics())).toMatchObject({ active: 0, timers: 0, eligible: false });
  await page.locator('.adventure-exit').click();
  await page.evaluate(() => {
    window.meteorReducedChange = new Promise(resolve => matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', resolve, { once: true }));
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.meteorReducedChange);
  expect(await page.evaluate(async () => (await import('/js/backgroundEffects.js')).getMeteorDiagnostics())).toMatchObject({ active: 0, timers: 0 });
});

test('real animation returns to idle and rapid cancellation leaves no active resources', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await isolateMeteorFacade(page);
  await expect(page.locator('.shooting-star[data-state="ACTIVE"]')).toHaveCount(1, { timeout: 10000 });
  expect(await page.evaluate(() => { const node = document.querySelector('.shooting-star[data-state="ACTIVE"]'); node.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName: 'shooting' })); return node.dataset.state; })).toBe('ACTIVE');
  await expect(page.locator('.shooting-star[data-state="ACTIVE"]')).toHaveCount(0, { timeout: 3000 });
  await page.evaluate(async () => {
    const effects = await import('/js/backgroundEffects.js');
    for (let i = 0; i < 100; i++) { effects.setMeteorEffectsEnabled(false); effects.setMeteorEffectsEnabled(true); }
    Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
    if (effects.getMeteorDiagnostics().timers || effects.getMeteorDiagnostics().active) throw new Error('Hidden page kept resources');
    effects.disposeMeteorEffects(); effects.disposeMeteorEffects();
  });
  await expect(page.locator('.meteor-layer')).toHaveCount(0);
});


test('100 real Home/map/game switches preserve pool and block every game startup', async ({ page }) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const data = await page.evaluate(async () => {
    const effects = await import('/js/backgroundEffects.js');
    const nodes = [...document.querySelectorAll('.shooting-star')];
    const navigation = await import('/tests/ui/helpers/gameNavigation.js');
    const selector = await import('/js/gameSelector.js');
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.music = gameState.settings.sound = false;
    for (let i = 0; i < 100; i++) {
      const game = ['memory-match', 'link-connect', 'triple-connect'][i % 3];
      await navigation.openReadyGameMenu(game);
      if (!effects.getMeteorDiagnostics().eligible) throw new Error('Map is ineligible');
      let ready;
      if (game === 'memory-match') ready = (await import('/js/gameController.js')).startNewMemoryRun(1,{skipIntro:true});
      else if (game === 'link-connect') ready = (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy', level: 1,skipIntro:true });
      else ready = (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', skipIntro: true });
      if (effects.getMeteorDiagnostics().timers || effects.getMeteorDiagnostics().active) throw new Error('Startup meteor resource');
      await ready;
      if (effects.getMeteorDiagnostics().eligible) throw new Error('Gameplay is eligible');
      selector.showGameSelector();
      if (effects.getMeteorDiagnostics().eligible) throw new Error('Static Home is eligible');
    }
    return nodes.every((node, i) => node === document.querySelectorAll('.shooting-star')[i]);
  });
  expect(data).toBe(true);
});

test('ten-minute real animation soak returns heap and nodes to a bounded baseline', async ({ page }) => {
  test.setTimeout(650000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.meteor-layer')).toHaveCount(1);
  await isolateMeteorFacade(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  await page.evaluate(() => { window.soakNodes = [...document.querySelectorAll('.shooting-star')]; window.meteorCompletions = 0; document.querySelector('.meteor-layer').addEventListener('animationend', () => window.meteorCompletions++); });
  const heaps = [];
  for (let minute = 0; minute <= 10; minute++) {
    await cdp.send('HeapProfiler.collectGarbage');
    heaps.push((await cdp.send('Runtime.getHeapUsage')).usedSize);
    if (minute < 10) await page.waitForTimeout(60000);
  }
  const state = await page.evaluate(async () => ({ ...(await import('/js/backgroundEffects.js')).getMeteorDiagnostics(), same: window.soakNodes.every((node, i) => node === document.querySelectorAll('.shooting-star')[i]), completions: window.meteorCompletions }));
  expect(state.same).toBe(true); expect(state.nodes).toBe(2); expect(state.timers).toBe(1); expect(state.completions).toBeGreaterThan(60);
  expect(Math.max(...heaps.slice(2)) - Math.min(...heaps.slice(2))).toBeLessThan(2 * 1024 * 1024);
  console.log(JSON.stringify({ meteorSoak: state, postGCHeap: heaps }));
});
