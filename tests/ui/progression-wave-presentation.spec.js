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


for(const gameId of ['memory-match','link-connect','triple-connect']) for(const motion of ['reduce','no-preference']) {
  test(`${gameId} reveals spatial layers without a board flash (${motion})`,async({page})=>{
    await page.emulateMedia({reducedMotion:motion});await page.goto('/');
    await page.evaluate(async id=>{
      await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      await(await import('/tests/ui/helpers/progressionFixtures.js')).startProgressionScene(id);
    },gameId);
    await expect(page.locator('.progression-wave-notice')).toHaveCount(0,{timeout:4000});
    for(const [width,height] of [[320,568],[412,915],[844,390],[1024,900]]) {
      await page.setViewportSize({width,height});
      for(let direction=0;direction<4;direction++) {
        const result=await page.evaluate(async({gameId,direction})=>{
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const shell=gameId==='memory-match'?(await import('/js/memoryMatch/memoryShell.js')).getMemoryShell():gameId==='link-connect'?(await import('/js/linkConnect/linkShell.js')).getLinkShell():(await import('/js/tripleConnect/tripleShell.js')).getTripleShell();
          const scope=(await import('/js/gameShell/gameShellLifecycle.js')).createGameShellLifecycle();
          window.waveEntranceOwner=scope;
          const {prepareWaveArrival,announceWave}=await import('/js/progression/waveHud.js');
          const board=shell.refs.board;const before=board.children.length;
          prepareWaveArrival(shell.refs,scope);const hidden=getComputedStyle(board).visibility;
          const random=Math.random;Math.random=()=>direction/4+.01;
          try {announceWave(shell.refs,scope,{attemptId:crypto.randomUUID(),index:2});}finally{Math.random=random;}
          const animations=board.getAnimations({subtree:true}).filter(a=>a.effect.target!==board && a.effect.getTiming().duration===340);
          const layers=animations.map(a=>{
            a.pause();a.currentTime=0;
            const r=a.effect.target.getBoundingClientRect();
            return{coordinate:direction<2?r.left:r.top,delay:a.effect.getTiming().delay,opacity:Number(getComputedStyle(a.effect.target).opacity)};
          });
          return{hidden,visible:getComputedStyle(board).visibility,before,after:board.children.length,
            direction:board.dataset.waveArrival,inert:board.inert,layers,
            scene:document.querySelectorAll('.progression-wave-arrival').length,
            overflow:document.documentElement.scrollWidth>innerWidth+1};
        },{gameId,direction});
        expect(result.hidden).toBe('hidden');expect(result.visible).toBe('visible');
        expect(result.before).toBe(result.after);expect(result.scene).toBe(0);expect(result.overflow).toBe(false);
        if(motion==='reduce') {expect(result.layers).toHaveLength(0);expect(result.inert).toBe(false);}
        else {
          expect(result.direction).toBe(['left','right','top','bottom'][direction]);expect(result.inert).toBe(true);
          expect(result.layers.length).toBeGreaterThan(1);expect(result.layers.every(row=>row.opacity===0)).toBe(true);
          const sorted=[...result.layers].sort((a,b)=>a.coordinate-b.coordinate);
          expect(Math.max(...sorted.map(row=>row.delay))).toBe(560);
          for(let i=1;i<sorted.length;i++) {
            if(direction%2===0)expect(sorted[i].delay).toBeGreaterThanOrEqual(sorted[i-1].delay);
            else expect(sorted[i].delay).toBeLessThanOrEqual(sorted[i-1].delay);
          }
        }
        if(motion==='no-preference' && width===412 && direction===2) {
          await page.evaluate(()=>{
            for(const animation of document.getAnimations())if(animation.effect.getTiming().duration===340)animation.currentTime=450;
          });
          await page.screenshot({path:test.info().outputPath(`stagger-${gameId}.png`)});
        }
        const cleanup=await page.evaluate(()=>{window.waveEntranceOwner.dispose();return window.waveEntranceOwner.diagnostics();});
        expect(Object.entries(cleanup).every(([key,value])=>key==='active'?value===false:value===0)).toBe(true);
        await expect(page.locator('[data-wave-arrival],.progression-wave-notice')).toHaveCount(0);
      }
    }
  });
}

test('motion changes, resize and natural completion restore cards and input',async({page})=>{
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
  await start();await expect(page.locator('[data-wave-arrival]')).toHaveCount(1);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('[data-wave-arrival]')).toHaveCount(0);
  await page.evaluate(()=>window.waveEntranceOwner.dispose());
  await page.emulateMedia({reducedMotion:'no-preference'});await start();
  await page.setViewportSize({width:412,height:915});await expect(page.locator('[data-wave-arrival]')).toHaveCount(0);
  await page.evaluate(()=>window.waveEntranceOwner.dispose());
  await start();await expect(page.locator('[data-wave-arrival]')).toHaveCount(0,{timeout:1800});
  expect(await page.locator('[data-shell-region="board"]:visible').evaluate(el=>el.inert)).toBe(false);
  await page.evaluate(()=>window.waveEntranceOwner.dispose());
});

test('music keeps its source and position across sync and a real Memory wave transition',async({page})=>{
  test.setTimeout(45000);await page.goto('/');
  await page.getByRole('button',{name:'Trò sau',exact:true}).click();
  await page.evaluate(async()=>{
    await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    const {gameState}=await import('/js/gameState.js');gameState.settings.music=true;gameState.settings.sound=false;
    await(await import('/js/gameController.js')).startNewMemoryRun(1,{skipIntro:true});
  });
  await expect.poll(()=>page.evaluate(async()=>!(await import('/js/gameState.js')).gameState.isLocked),{timeout:15000}).toBe(true);
  const result=await page.evaluate(async()=>{
    const music=document.getElementById('bg-music');
    await music.play();music.currentTime=4;
    let pauses=0,emptied=0;const pause=()=>pauses++,empty=()=>emptied++;
    music.addEventListener('pause',pause);music.addEventListener('emptied',empty);
    const {syncDefaultMusic}=await import('/js/sound.js');const {gameState}=await import('/js/gameState.js');
    const source=music.src;for(let i=0;i<5;i++)syncDefaultMusic(gameState.settings);
    const afterSync=music.currentTime;
    const {handleTileClick}=await import('/js/logic.js');
    const groups=new Map();
    for(const tile of document.querySelectorAll('#grid-container .tile')) {
      const pair=groups.get(tile.dataset.imageId)||[];pair.push(tile);groups.set(tile.dataset.imageId,pair);
    }
    for(const [first,second] of groups.values()) {await handleTileClick(first);await handleTileClick(second);}
    music.removeEventListener('pause',pause);music.removeEventListener('emptied',empty);
    return{source:source===music.src,afterSync,time:music.currentTime,pauses,emptied,wave:gameState.wave.index};
  });
  expect(result.source).toBe(true);expect(result.afterSync).toBeGreaterThanOrEqual(4);
  expect(result.time).toBeGreaterThanOrEqual(result.afterSync);expect(result.pauses).toBe(0);expect(result.emptied).toBe(0);expect(result.wave).toBe(2);
});

for(const id of ['link-connect','triple-connect']) test(`${id} waits for the card entrance before charging play time`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  await page.evaluate(async id=>{
    await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    await(await import('/tests/ui/helpers/progressionFixtures.js')).startProgressionScene(id);
    const session=(await import('/js/sessionProgress.js')).getActiveSession(id,'easy');
    const {completeWave}=await import('/js/progression/waveProgress.js');
    const next=completeWave(session.wave,{score:100,moves:20,misses:0,matchedGroups:session.wave.groupsPerWave});
    const checkpoint={...session,wave:next.progress,remainingTime:60,timeLimit:120};
    window.waveTransition=id==='link-connect'?(await import('/js/linkConnect/linkController.js')).startLinkLevel({...checkpoint,waveTransition:true,skipIntro:true}):(await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({mode:'easy',level:1,reason:'wave',waveSession:checkpoint,skipIntro:true});
  },id);
  await expect(page.locator('[data-wave-arrival]')).toHaveCount(1);
  const before=await page.evaluate(async id=> (await import('/js/playMetrics.js')).getActivePlayMetrics().clock.durationMs(),id);
  await page.waitForTimeout(550);
  const after=await page.evaluate(async id=> (await import('/js/playMetrics.js')).getActivePlayMetrics().clock.durationMs(),id);
  expect(after).toBe(before);
  await page.evaluate(()=>window.waveTransition);
  await expect(page.locator('[data-wave-arrival]')).toHaveCount(0);
});
