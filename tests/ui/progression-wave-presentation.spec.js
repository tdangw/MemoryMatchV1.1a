import { test, expect } from '@playwright/test';

for(const motion of ['reduce','no-preference']) test(`wave notice is centered, finite and cancelled with its owner (${motion})`,async({page})=>{
  await page.emulateMedia({reducedMotion:motion});await page.goto('/');
  await page.evaluate(async()=>{
    await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    await(await import('/js/gameController.js')).startNewMemoryRun(1,{skipIntro:true});
  });
  await expect(page.locator('.progression-wave-notice')).toHaveText('Wave 1');
  const centered=await page.locator('.progression-wave-notice').evaluate(node=>{const r=node.getBoundingClientRect();return Math.abs(r.top+r.height/2-innerHeight/2);});
  // Entry slides at most a fraction of the toast height; reduced motion is exactly centered.
  expect(centered).toBeLessThan(motion==='reduce'?1:12);
  await expect(page.locator('.progression-wave-notice')).toHaveCount(0,{timeout:3000});
  const result=await page.evaluate(async()=>{
    const {getMemoryShell}=await import('/js/memoryMatch/memoryShell.js');
    const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js');
    const {announceWave,presentWaveExit}=await import('/js/progression/waveHud.js');
    const {gameState}=await import('/js/gameState.js');
    const diagnostics=[];
    for(let index=0;index<30;index++) {
      const scope=createGameShellLifecycle();
      announceWave(getMemoryShell().refs,scope,{...gameState.wave,attemptId:`cancel-${index}`,index:2});
      const finished=presentWaveExit(getMemoryShell().refs,scope);
      scope.dispose();await finished;
      diagnostics.push(scope.diagnostics());
    }
    return {diagnostics,notices:document.querySelectorAll('.progression-wave-notice').length,animations:getMemoryShell().refs.board.getAnimations().length};
  });
  expect(result.notices).toBe(0);expect(result.animations).toBe(0);
  for(const row of result.diagnostics) expect(Object.entries(row).every(([key,value])=>key==='active'?value===false:value===0)).toBe(true);
});

for (const gameId of ['memory-match','link-connect','triple-connect']) for (const motion of ['reduce','no-preference']) {
  test(`${gameId} gives the new wave a finite entrance and longer notice (${motion})`, async ({page}) => {
    await page.setViewportSize({width:412,height:915});await page.emulateMedia({reducedMotion:motion});await page.goto('/');
    await page.evaluate(async id => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      await (await import('/tests/ui/helpers/progressionFixtures.js')).startProgressionScene(id);
    },gameId);
    await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup',/.+/);
    await expect(page.locator('.progression-wave-notice')).toHaveCount(0,{timeout:4000});
    const effect = await page.evaluate(async id => {
      const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js');
      const shell=id==='memory-match'?(await import('/js/memoryMatch/memoryShell.js')).getMemoryShell():id==='link-connect'?(await import('/js/linkConnect/linkShell.js')).getLinkShell():(await import('/js/tripleConnect/tripleShell.js')).getTripleShell();
      const {announceWave}=await import('/js/progression/waveHud.js');
      window.waveEntranceOwner=createGameShellLifecycle();
      const before=shell.refs.board.children.length;
      const started=performance.now();announceWave(shell.refs,window.waveEntranceOwner,{attemptId:'new-wave-'+id,index:2});
      announceWave(shell.refs,window.waveEntranceOwner,{attemptId:'new-wave-'+id,index:2});
      const notice=document.querySelector('.progression-wave-notice');
      window.waveNoticeLifetime=new Promise(resolve=>{
        const observer=new MutationObserver(()=>{if(!notice.isConnected){observer.disconnect();resolve(performance.now()-started);}});
        observer.observe(document.body,{childList:true});
      });
      const scene=document.querySelector('.progression-wave-arrival');
      return {before,after:shell.refs.board.children.length,nodes:scene?.querySelectorAll('*').length || 0,pointerEvents:scene && getComputedStyle(scene).pointerEvents};
    },gameId);
    expect(effect.after).toBe(effect.before);
    await expect(page.locator('.progression-wave-notice')).toHaveCount(1);
    if(motion==='reduce') await expect(page.locator('.progression-wave-arrival')).toHaveCount(0);
    else {
      await expect(page.locator('.progression-wave-arrival')).toHaveCount(1);
      expect(effect.nodes).toBe(1);expect(effect.pointerEvents).toBe('none');
      await expect(page.locator('.progression-wave-arrival')).toHaveCount(0,{timeout:1500});
    }
    const lifetime=await page.evaluate(()=>window.waveNoticeLifetime);
    expect(lifetime).toBeGreaterThanOrEqual(1750);expect(lifetime).toBeLessThan(2800);
    const diagnostics=await page.evaluate(()=>{window.waveEntranceOwner.dispose();return window.waveEntranceOwner.diagnostics();});
    expect(Object.entries(diagnostics).every(([key,value])=>key==='active'?value===false:value===0)).toBe(true);
  });
}

test('changing motion preference or viewport cancels the wave light immediately',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  await page.evaluate(async()=>{
    await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    await(await import('/js/gameController.js')).startNewMemoryRun(1,{skipIntro:true});
  });
  await expect(page.locator('.progression-wave-notice')).toHaveCount(0,{timeout:4000});
  const start=()=>page.evaluate(async()=>{
    const shell=(await import('/js/memoryMatch/memoryShell.js')).getMemoryShell();
    window.waveEntranceOwner=(await import('/js/gameShell/gameShellLifecycle.js')).createGameShellLifecycle();
    (await import('/js/progression/waveHud.js')).announceWave(shell.refs,window.waveEntranceOwner,{attemptId:crypto.randomUUID(),index:2});
  });
  await start();await expect(page.locator('.progression-wave-arrival')).toHaveCount(1);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.progression-wave-arrival')).toHaveCount(0);
  await page.evaluate(()=>window.waveEntranceOwner.dispose());
  await page.emulateMedia({reducedMotion:'no-preference'});await start();await expect(page.locator('.progression-wave-arrival')).toHaveCount(1);
  await page.setViewportSize({width:844,height:390});await expect(page.locator('.progression-wave-arrival')).toHaveCount(0);
  await page.evaluate(()=>window.waveEntranceOwner.dispose());await expect(page.locator('.progression-wave-notice')).toHaveCount(0);
});

test('arrival light stays inside each board on narrow, landscape and desktop layouts',async({page})=>{
  for(const id of ['memory-match','link-connect','triple-connect']) {
    await page.goto('/');await page.emulateMedia({reducedMotion:'no-preference'});
    await page.evaluate(async id=>{
      await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      await(await import('/tests/ui/helpers/progressionFixtures.js')).startProgressionScene(id);
    },id);
    await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup',/.+/);
    await expect(page.locator('.progression-wave-notice')).toHaveCount(0,{timeout:4000});
    for(const viewport of [{width:320,height:568},{width:844,height:390},{width:1024,height:900}]) {
      await page.setViewportSize(viewport);
      const footprint=await page.evaluate(async id=>{
        await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        const shell=id==='memory-match'?(await import('/js/memoryMatch/memoryShell.js')).getMemoryShell():id==='link-connect'?(await import('/js/linkConnect/linkShell.js')).getLinkShell():(await import('/js/tripleConnect/tripleShell.js')).getTripleShell();
        const bounds=shell.refs.board.getBoundingClientRect();
        const scope=(await import('/js/gameShell/gameShellLifecycle.js')).createGameShellLifecycle();
        (await import('/js/progression/waveHud.js')).announceWave(shell.refs,scope,{attemptId:crypto.randomUUID(),index:2});
        const scene=document.querySelector('.progression-wave-arrival'),rect=scene.getBoundingClientRect();
        const difference=Math.max(...['left','top','width','height'].map(key=>Math.abs(rect[key]-bounds[key])));
        const overflow=document.documentElement.scrollWidth-innerWidth;
        scope.dispose();return {difference,overflow,left:rect.left,right:rect.right};
      },id);
      expect(footprint.difference).toBeLessThan(1);expect(footprint.overflow).toBeLessThanOrEqual(1);
      expect(footprint.left).toBeGreaterThanOrEqual(-1);expect(footprint.right).toBeLessThanOrEqual(viewport.width+1);
      await expect(page.locator('.progression-wave-arrival,.progression-wave-notice')).toHaveCount(0);
    }
  }
});

test('new wave arrival has a readable mobile presentation',async({page})=>{
  await page.setViewportSize({width:412,height:915});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  await page.evaluate(async()=>{
    await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    await(await import('/js/gameController.js')).startNewMemoryRun(1,{skipIntro:true});
  });
  await expect(page.locator('.progression-wave-notice')).toHaveCount(0,{timeout:4000});
  await page.evaluate(async()=>{
    const shell=(await import('/js/memoryMatch/memoryShell.js')).getMemoryShell();
    window.waveSampleOwner=(await import('/js/gameShell/gameShellLifecycle.js')).createGameShellLifecycle();
    const {announceWave,renderWaveStatus}=await import('/js/progression/waveHud.js');
    const wave={...(await import('/js/gameState.js')).gameState.wave,index:2};
    renderWaveStatus(shell.refs,wave);
    announceWave(shell.refs,window.waveSampleOwner,{...wave,attemptId:'wave-visual-sample'});
    // Freeze just the new presentation at its impact frame for visual QA.
    for(const animation of document.getAnimations()) {
      const target=animation.effect.target;
      if(target===shell.refs.board || target.closest('.progression-wave-arrival,.progression-wave-notice')) {animation.currentTime=300;animation.pause();}
    }
  });
  await page.screenshot({path:'docs/qa/gameplay-progression/wave-arrival-412.png'});
  await page.evaluate(()=>window.waveSampleOwner.dispose());
  await expect(page.locator('.progression-wave-arrival,.progression-wave-notice')).toHaveCount(0);
});
