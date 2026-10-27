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

test('map detail proposal fits native motion envelopes and releases every interrupted cycle', async ({page}) => {
  await page.evaluate(async()=>{
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    const root=document.querySelector('#menu-container');
    (await import('/js/background/bindings.js')).mountMapAmbient((await import('/js/appPageLifecycle.js')).getAppPageScope(),root,root.querySelector('.adventure-map-trail'),root.querySelector('.adventure-map-scroll'),{mapDetails:true});
  });
  await settle(page);
  const scroll=page.locator('.adventure-map-scroll');
  const bottom=await scroll.evaluate(n=>n.scrollHeight-n.clientHeight);
  let found=false;
  for(let step=0;step<110;step++){
    await scroll.evaluate((n,y)=>{n.scrollTop=y;},Math.max(0,bottom-step*100));
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await expect.poll(async()=>(await diagnostics(page)).blockers).toBe(0);
    if((await diagnostics(page)).kinds.includes('pond')){found=true;break;}
  }
  expect(found,'A clear pond proposal must be available').toBe(true);
  const bounds=await page.evaluate(()=>{
    const host=document.querySelector('.ambient-bg-host'), failures=[];
    const animations=host.getAnimations({subtree:true});
    animations.forEach(a=>a.pause());
    for(let step=0;step<=100;step++){
      animations.forEach(a=>{a.currentTime=28000*step/100;});
      for(const node of host.querySelectorAll('.ambient-bg-frog,.ambient-bg-ripple,.ambient-bg-lily')){
        const box=node.getBoundingClientRect(),outer=node.parentElement.getBoundingClientRect();
        if(box.left<outer.left-.1||box.top<outer.top-.1||box.right>outer.right+.1||box.bottom>outer.bottom+.1)failures.push({step,kind:node.classList[0]});
      }
    }
    return failures;
  });
  expect(bounds).toEqual([]);
  await page.evaluate(async()=>{
    const api=await import('/js/backgroundEffects.js');
    for(let i=0;i<100;i++){
      api.setMeteorEffectsEnabled(false);
      if(document.querySelector('.ambient-bg-host')||api.getAmbientDiagnostics().handles)throw new Error('Proposal leaked on off');
      api.setMeteorEffectsEnabled(true);
      const d=api.getAmbientDiagnostics();
      // The original meteor scheduler can still use available map slots,
      // including the reservation for the static pad; at most one timer.
      if(d.nodes>24||d.handles>5||d.sceneInstances!==1||d.timers>1||d.lastError)throw new Error(JSON.stringify(d));
    }
  });
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.ambient-bg-host')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('.ambient-bg-frog')).toHaveCount(1);
  await page.evaluate(async()=>{
    const api=await import('/js/backgroundEffects.js'); const resume=api.suspendAmbientBackground();
    if(api.getAmbientDiagnostics().handles)throw new Error('Suspension kept frog');
    resume();
    (await import('/js/gameSelector.js')).showGameSelector();
  });
  await expect(page.locator('.ambient-bg-host')).toHaveCount(0);
  expect(await diagnostics(page)).toMatchObject({scene:'home',handles:0,timers:0,observers:0});
});
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

test('background fade always settles without an initial style flush and cancels stale work', async ({page}, info) => {
  test.skip(info.project.name !== 'portrait', 'Transition contract is viewport independent');
  const results = await page.evaluate(async () => {
    const api=await import('/js/gameShell/gameBackgroundTransition.js');
    const values=[];
    for(let i=0;i<12;i++) {
      values.push(await api.prepareGameBackgroundTransition(['memory-match','link-connect','triple-connect'][i%3]));
      api.completeGameBackgroundTransition();
    }
    const pending=api.prepareGameBackgroundTransition('memory-match');
    api.cancelGameBackgroundTransition();
    values.push(await pending);
    const interrupted=api.prepareGameBackgroundTransition('memory-match');
    await Promise.resolve();await Promise.resolve();
    document.querySelector('.game-background-transition').getAnimations()[0].cancel();
    values.push(await interrupted);
    api.completeGameBackgroundTransition();
    return values;
  });
  expect(results.slice(0,12)).toEqual(Array(12).fill('ready'));
  expect(results[12]).toBe('cancelled');
  expect(results[13]).toBe('ready');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.evaluate(async()=>(await import('/js/gameShell/gameBackgroundTransition.js')).prepareGameBackgroundTransition('triple-connect'))).toBe('ready');
  await page.evaluate(async()=>(await import('/js/gameShell/gameBackgroundTransition.js')).completeGameBackgroundTransition());
  await expect(page.locator('.game-background-transition.is-visible')).toHaveCount(0);
});

test('stale source completion preserves the current scene and each failed source stays static', async({page},info)=>{
  test.skip(info.project.name!=='portrait','Source ordering contract uses a portrait viewport with synthetic orientation queries');
  const result=await page.evaluate(async()=>{
    (await import('/js/backgroundEffects.js')).disposeMeteorEffects();
    const {createAmbientScene}=await import('/js/background/scene.js');
    const {SCENE_PRESETS}=await import('/js/background/presets.js');
    const original=window.matchMedia,background=document.body.style.backgroundImage,root=document.createElement('section');
    document.body.append(root);
    let portrait=true,actor,attempts=0;const pending=[],errors=[];
    window.matchMedia=query=>query==='(orientation: portrait)'?{matches:portrait}:original.call(window,query);
    const source=()=>SCENE_PRESETS['memory-match'][portrait?'portrait':'landscape'].source;
    const options={document,kind:'memory-match',root,maxHandles:5,prepareSource:()=>{attempts++;return new Promise(resolve=>pending.push(resolve));},requestRefresh:()=>actor.refresh(),onError:error=>errors.push(error.message)};
    const select=value=>{portrait=value;document.body.style.backgroundImage=`url("${source()}")`;actor.refresh();};
    const tick=async()=>{await Promise.resolve();await Promise.resolve();};
    try {
      document.body.style.backgroundImage=`url("${source()}")`;
      actor=createAmbientScene({...options,initialSource:source()});
      select(false);select(true);pending.shift()(true);await tick();
      const stale={attempts,...actor.diagnostics()};actor.dispose();
      attempts=0;portrait=true;document.body.style.backgroundImage=`url("${source()}")`;
      actor=createAmbientScene({...options,initialSource:''});pending.shift()(false);await tick();
      select(false);pending.shift()(false);await tick();
      for(let i=0;i<100;i++)select(i%2===0);
      return {stale,failed:{attempts,...actor.diagnostics()},errors};
    }finally{actor.dispose();root.remove();window.matchMedia=original;document.body.style.backgroundImage=background;}
  });
  expect(result.stale.attempts).toBe(1);expect(result.stale.handles).toBeGreaterThan(0);expect(result.stale.reason).toBeNull();
  expect(result.failed).toMatchObject({attempts:2,handles:0,reason:'source-unavailable'});
  expect(result.errors).toEqual(['Ambient source unavailable','Ambient source unavailable']);
});

test('unexpected cancellation of a live native animation falls static without retry',async({page},info)=>{
  test.skip(info.project.name!=='portrait','Native cancellation contract is viewport independent');
  await page.evaluate(async()=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  await expect.poll(async()=>(await diagnostics(page)).handles).toBeGreaterThan(0);
  await page.evaluate(()=>document.querySelector('.ambient-bg-host').getAnimations({subtree:true})[0].cancel());
  await expect.poll(async()=>(await diagnostics(page)).lastError).toContain('AbortError');
  await page.evaluate(async()=>{const effects=await import('/js/backgroundEffects.js');for(let i=0;i<100;i++)effects.refreshAmbientBackground();});
  expect(await diagnostics(page)).toMatchObject({state:'STATIC',handles:0,observers:0,timers:0});
  await expect(page.locator('.ambient-bg-host')).toHaveCount(0);
});

test('native sprite rotation and travel stay inside narrow portrait envelopes',async({page})=>{
  const result=await page.evaluate(async()=>{
    (await import('/js/backgroundEffects.js')).disposeMeteorEffects();
    const {createAmbientScene}=await import('/js/background/scene.js');
    const {SCENE_PRESETS}=await import('/js/background/presets.js');
    const source=SCENE_PRESETS['memory-match'].portrait.source,original=document.body.style.backgroundImage;
    const root=document.createElement('section');document.body.append(root);document.body.style.backgroundImage=`url("${source}")`;
    const errors=[],clipped=[];
    const actor=createAmbientScene({document,kind:'memory-match',root,initialSource:source,maxHandles:5,prepareSource:async()=>true,requestRefresh(){},onError:e=>errors.push(e.message)});
    try {
      const nodes=[...document.querySelectorAll('.ambient-bg-host .ambient-bg-fish,.ambient-bg-host .ambient-bg-leaf,.ambient-bg-host .ambient-bg-firefly')];
      for(const node of nodes){
        const animation=node.getAnimations()[0];animation.pause();
        for(const fraction of [0,.1,.2,.36,.6,.99]){
          animation.currentTime=animation.effect.getTiming().duration*fraction;
          const r=node.getBoundingClientRect(),box=node.parentElement.getBoundingClientRect(),epsilon=.1;
          if(r.left<box.left-epsilon||r.right>box.right+epsilon||r.top<box.top-epsilon||r.bottom>box.bottom+epsilon)clipped.push({kind:node.getAttribute('class'),fraction});
        }
      }
      return {count:nodes.length,clipped,errors};
    }finally{actor.dispose();root.remove();document.body.style.backgroundImage=original;}
  });
  expect(result.count).toBe(4);expect(result.clipped).toEqual([]);expect(result.errors).toEqual([]);
});
test('all maps use bounded texture slots and suspend during scroll, popup and off', async ({ page }, testInfo) => {
  for (const game of games) {
    await page.evaluate(async game => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game), game);
    await expect.poll(async () => (await diagnostics(page)).scene).toBe('map');
    await expect.poll(async () => (await diagnostics(page)).handles).toBeGreaterThan(0);
    let data = await diagnostics(page); expect(data.tileSlots).toBeLessThanOrEqual(3); expect(data.nodes).toBeLessThanOrEqual(24); expect(data.handles).toBeLessThanOrEqual(5);
    await expect.poll(()=>page.locator('html').getAttribute('data-active-game')).toBe(game);
    await expect.poll(async()=>(await diagnostics(page)).pendingFrames).toBe(0);
    // A banner can change only the scroller's height, without resizing the
    // page or the chapter trail. Observe that viewport boundary directly.
    const scroll=page.locator('.adventure-map-scroll'),originalHeight=await scroll.evaluate(n=>n.clientHeight);
    expect(await scroll.evaluate(n=>getComputedStyle(n).scrollbarWidth)).toBe('none');
    expect(await scroll.evaluate(n=>getComputedStyle(n).overflowY)).toBe('auto');
    await scroll.evaluate((n,height)=>{n.style.height=`${height-80}px`;},originalHeight);
    await expect.poll(()=>page.locator('.ambient-bg-map').evaluate(n=>Number.parseFloat(n.style.height))).toBe(originalHeight-80);
    await scroll.evaluate(n=>{n.style.height='';});
    await expect.poll(()=>page.locator('.ambient-bg-map').evaluate(n=>Number.parseFloat(n.style.height))).toBe(originalHeight);
    const beforeWheel=await scroll.evaluate(n=>n.scrollTop);
    await scroll.evaluate(n=>{window.ambientWheelDone=new Promise(resolve=>n.addEventListener('scrollend',()=>resolve(),{once:true}));});
    await scroll.hover();await page.mouse.wheel(0,-180);
    await expect.poll(()=>scroll.evaluate(n=>n.scrollTop)).not.toBe(beforeWheel);
    await page.evaluate(()=>window.ambientWheelDone);
    await expect.poll(async()=>(await diagnostics(page)).handles).toBeGreaterThan(0);
    await page.screenshot({ path: `runtime/qa/animated-backgrounds/${testInfo.project.name}-${game}-map.png` });
    // Native wheel above proves movement. Keep its known safe pose when
    // isolating suspension: another pose may intentionally have no safe region.
    const duringScroll = await page.evaluate(async () => { const effects=await import('/js/backgroundEffects.js'); document.querySelector('.adventure-map-scroll').dispatchEvent(new Event('scroll')); return effects.getAmbientDiagnostics(); });
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
