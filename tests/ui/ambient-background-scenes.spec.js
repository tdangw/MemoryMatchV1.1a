import { expect, test } from '@playwright/test';
const games = ['memory-match', 'link-connect', 'triple-connect'];
const diagnostics = page => page.evaluate(async () => (await import('/js/backgroundEffects.js')).getAmbientDiagnostics());
const settle = async page => {
  await expect(page.locator('.progression-wave-notice')).toHaveCount(0);
  await expect(page.locator('.level-reward-overlay')).toHaveCount(0);
  const guide = page.locator('.tutorial-guide');
  if (await guide.isVisible()) { await guide.getByRole('button', { name: 'Đã hiểu' }).click(); await expect(guide).toHaveCount(0); }
  await expect.poll(async () => (await diagnostics(page)).preparing).toBe(0);
};
test.beforeEach(async ({ page }) => {
  await page.goto('/'); await page.locator('.game-selector__choice').first().waitFor();
  await page.evaluate(async () => { const { gameState } = await import('/js/gameState.js'); gameState.settings.sound = gameState.settings.music = false; });
});
test('Home is static and repeated initialize keeps only the original meteor pool', async ({ page }) => {
  await page.evaluate(async () => { const api = await import('/js/backgroundEffects.js'); for (let i=0;i<100;i++) api.initializeMeteorEffects(true); });
  expect(await diagnostics(page)).toMatchObject({ state: 'STATIC', scene: 'home', handles: 0, timers: 0, pendingFrames: 0 });
  await expect(page.locator('.ambient-bg-host')).toHaveCount(0); await expect(page.locator('.shooting-star')).toHaveCount(2);
  await expect(page.locator('.fog, .cloud')).toHaveCount(0);
});
test('all maps use bounded texture slots and suspend during scroll, popup and off', async ({ page }, testInfo) => {
  for (const game of games) {
    await page.evaluate(async game => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game), game);
    await expect.poll(async () => (await diagnostics(page)).scene).toBe('map');
    await expect.poll(async () => (await diagnostics(page)).handles).toBeGreaterThan(0);
    let data = await diagnostics(page); expect(data.tileSlots).toBeLessThanOrEqual(3); expect(data.nodes).toBeLessThanOrEqual(24); expect(data.handles).toBeLessThanOrEqual(5);
    await page.screenshot({ path: `runtime/qa/animated-backgrounds/${testInfo.project.name}-${game}-map.png` });
    const duringScroll = await page.evaluate(async () => { const effects=await import('/js/backgroundEffects.js'); const scroll=document.querySelector('.adventure-map-scroll'); scroll.scrollTop=Math.max(0,scroll.scrollTop-240); scroll.dispatchEvent(new Event('scroll')); return effects.getAmbientDiagnostics(); });
    expect(duringScroll).toMatchObject({ state:'SUSPENDED',handles:0,scenes:0 });
    await page.evaluate(() => document.querySelector('.adventure-map-scroll').dispatchEvent(new Event('scrollend')));
    await expect.poll(async () => (await diagnostics(page)).handles).toBeGreaterThan(0);
    await page.evaluate(async () => { const {openAppModal}=await import('/js/modal.js'); window.ambientDialogs=[openAppModal({title:'Bản đồ'}),openAppModal({title:'Bản đồ'})]; });
    expect(await diagnostics(page)).toMatchObject({handles:0,blockers:2});
    await page.evaluate(() => window.ambientDialogs[0].destroy()); expect(await diagnostics(page)).toMatchObject({handles:0,blockers:1});
    await page.evaluate(() => window.ambientDialogs[1].destroy());
    await expect.poll(async () => (await diagnostics(page)).blockers).toBe(0);
    await page.evaluate(async () => (await import('/js/backgroundEffects.js')).setMeteorEffectsEnabled(false));
    expect(await diagnostics(page)).toMatchObject({state:'STATIC',handles:0,timers:0});
    await expect(page.locator('.ambient-bg-host')).toHaveCount(0);
    await page.evaluate(async () => (await import('/js/backgroundEffects.js')).setMeteorEffectsEnabled(true));
  }
});
test('three gameplay scenes preserve meteor exclusion and clean pause/restart/hidden/reduction', async ({ page }, testInfo) => {
  for (const game of games) {
    await page.evaluate(async game => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game);
      if (game==='memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1,{skipIntro:true});
      else if(game==='link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({mode:'easy',level:1});
      else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({mode:'easy',skipIntro:true});
    },game);
    if(game==='memory-match') await page.locator('#grid-container:not(.is-locked) .tile').first().waitFor();
    await settle(page);
    await expect.poll(async () => (await diagnostics(page)).scene).toBe(game);
    const data=await diagnostics(page); expect(data.handles).toBeLessThanOrEqual(5); expect(data.nodes).toBeLessThanOrEqual(24); expect(data.lastError).toBeNull();
    expect(await page.evaluate(async ()=>(await import('/js/backgroundEffects.js')).getMeteorDiagnostics())).toMatchObject({active:0,timers:0,eligible:false});
    await page.screenshot({path:`runtime/qa/animated-backgrounds/${testInfo.project.name}-${game}-game.png`});
    await page.emulateMedia({reducedMotion:'reduce'}); await expect.poll(async ()=>(await diagnostics(page)).handles).toBe(0);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(async()=>{
      const effects=await import('/js/backgroundEffects.js');
      for(let i=0;i<100;i++){effects.setMeteorEffectsEnabled(false);const state=effects.getAmbientDiagnostics();if(state.handles||state.timers||state.pendingFrames)throw new Error('Off kept background resources');effects.setMeteorEffectsEnabled(true);}
      Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
      if(effects.getAmbientDiagnostics().handles||effects.getAmbientDiagnostics().timers)throw new Error('Hidden kept background resources');
      delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.evaluate(async()=>(await import('/js/gameSelector.js')).showGameSelector());
    expect(await diagnostics(page)).toMatchObject({scene:'home',handles:0,timers:0,blockers:0});
    await expect(page.locator('.ambient-bg-host')).toHaveCount(0);
  }
});

test('map source failure stays static without a retry loop and a delayed old owner cannot return', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'portrait', 'Source ownership is viewport independent');
  let requests = 0;
  await page.route('**/assets/adventure/moonlit-garden.webp', route => { requests++; return route.abort(); });
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  await expect.poll(async () => (await diagnostics(page)).lastError).toContain('unavailable');
  const settledRequests = requests;
  await page.evaluate(async () => { const effects=await import('/js/backgroundEffects.js'); for(let i=0;i<100;i++)effects.refreshAmbientBackground(); });
  expect(await diagnostics(page)).toMatchObject({state:'STATIC',handles:0,timers:0,preparing:0});
  expect(requests).toBe(settledRequests);
  await page.unroute('**/assets/adventure/moonlit-garden.webp');
  let release;
  const gate = new Promise(resolve => { release=resolve; });
  await page.route('**/assets/adventure/moonlit-garden.webp', async route => { await gate; await route.continue(); });
  await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect'));
  await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
  release();
  await page.unrouteAll({behavior:'wait'});
  expect(await diagnostics(page)).toMatchObject({scene:'home',state:'STATIC',handles:0,timers:0});
  await expect(page.locator('.ambient-bg-host')).toHaveCount(0);
});
