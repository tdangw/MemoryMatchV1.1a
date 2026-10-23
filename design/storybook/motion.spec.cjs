const { test, expect } = require('@playwright/test');
const { startNatural, solveNatural } = require('../../docs/design/advanced-ui/runtime/natural-play.cjs');
for (const motion of ['no-preference', 'reduce']) for (const variant of ['memory-match','memory-petals','link-connect','triple-connect']) test(`F3 real gameplay achievement motion ${variant} ${motion}`, async ({ page }) => {
  const game = variant === 'memory-petals' ? 'memory-match' : variant;
  test.setTimeout(100000); await page.setViewportSize({ width:412,height:915 }); await page.emulateMedia({ reducedMotion:motion });
  await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible({timeout:20000});
  await expect(page.locator('#app-loading')).toHaveCount(0);
  await page.evaluate(async flip => {
    window.productModule = path => import(path);
    const { gameState: state } = await import('/js/gameState.js');
    const { savePersistentGameData,saveAppearance } = await import('/js/persistence.js');
    for (const key of ['memoryMatch','linkConnect','tripleConnect']) for (const level of [4,10]) for (const mode of ['easy','normal','hard','superHard']) state.progress[key].bestByLevel[`${mode}:${level}`] = { score:0,stars:0,cleared:true,rulesVersion:1,completedWaves:2 };
    await savePersistentGameData({progress:state.progress});
    await saveAppearance({ ...state.appearance, flipEffect:flip,linkPathEffect:'link-effect-meteor-route',linkExitEffect:'link-effect-moon-petals',triplePathEffect:'triple-effect-triad-converge',tripleExitEffect:'triple-effect-crystal-bloom' });
    window.seenRewardMotion = new Set();
    window.rewardObserver = new MutationObserver(records => { for (const record of records) { const node = record.target; if (!(node instanceof Element)) continue;
      if (node.matches('.achievement-flip-particles') || node.querySelector('.achievement-flip-particles')) window.seenRewardMotion.add('flip');
      if (node.matches('[class*="link-path-overlay--link-effect-meteor-route"], [class*="link-path-overlay--triple-effect-triad-converge"]')) window.seenRewardMotion.add('path');
      if (node.matches('.has-canvas-exit')) window.seenRewardMotion.add('exit');
    } }); window.rewardObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }, variant === 'memory-petals' ? 'memory-effect-spring-petals' : 'memory-effect-moonflip');
  await startNatural(page,game); await solveNatural(page,game);
  const result = await page.evaluate(async () => { window.rewardObserver.disconnect(); return { seen:[...window.seenRewardMotion], particles:(await import('/js/effects/achievementFlip.js')).getAchievementFlipParticleCount(), nodes:document.querySelectorAll('.achievement-flip-particles').length }; });
  if (motion === 'no-preference') expect(result.seen).toEqual(expect.arrayContaining(game === 'memory-match' ? ['flip'] : ['path','exit']));
  else expect(result.seen).not.toContain('flip');
  expect(result.particles).toBe(0); expect(result.nodes).toBe(0);
});
test('F3 twenty interrupted cycles bound particles, reuse canvas and record setup/draw costs', async ({ page }) => {
  await page.setViewportSize({width:412,height:915});
  await page.emulateMedia({ reducedMotion:'no-preference' }); await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible({timeout:20000});
  const result = await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    await (await import('/js/linkConnect/linkController.js')).startLinkLevel({mode:'easy'});
    const { restartMemoryTileAnimation,clearMemoryTileAnimations } = await import('/js/memoryMatch/tileAnimation.js');
    const { getAchievementFlipParticleCount } = await import('/js/effects/achievementFlip.js');
    const { playCanvasExit,clearCanvasExit } = await import('/js/effects/exitEngine.js');
    const { renderConnectionV2,clearConnectionV2 } = await import('/js/effects/connectionEngine.js');
    const { getEffectV2Path } = await import('/js/effects/effectCatalog.js');
    const { getEffectRegistry } = await import('/js/gameShell/gameShellEffects.js');
    const frame = document.querySelector('.link-board-frame'), tiles = [...document.querySelectorAll('.link-tile')].slice(0,3), surface = document.querySelector('#link-path-overlay');
    await Promise.allSettled([...frame.querySelectorAll('img')].map(image=>image.decode())); await document.fonts.ready;
    const container = document.createElement('div'); container.className='tile'; const image=document.createElement('img'); container.append(image); frame.append(container);
    let maxParticles=0,maxCanvas=0,maxAccepted=0; const setup=[],draw=[],frameTimes=[],idleFrameTimes=[],longTasks=[];
    let idlePrevious=await new Promise(requestAnimationFrame);
    for(let index=0;index<20;index++) await new Promise(resolve=>requestAnimationFrame(now=>{idleFrameTimes.push(now-idlePrevious);idlePrevious=now;resolve();}));
    const observer=new PerformanceObserver(list => { for (const task of list.getEntries()) longTasks.push(task.duration); }); observer.observe({type:'longtask'});
    let previousFrame=performance.now();
    for (let index=0;index<20;index++) {
      restartMemoryTileAnimation(image,{animationClass:index%2?'appear-storybook-moon':'appear-storybook-petals',durationMs:600});
      await new Promise(resolve=>requestAnimationFrame(now=>{frameTimes.push(now-previousFrame);previousFrame=now;resolve();})); maxParticles=Math.max(maxParticles,getAchievementFlipParticleCount());
      const started=performance.now();
      let accepted=0;
      for (let batch=0;batch<5;batch++) if(playCanvasExit({frame,tiles,exitId:'triple-effect-crystal-bloom',diagnostics:{recordFrame:ms=>draw.push(ms)}})) accepted++;
      maxAccepted=Math.max(maxAccepted,accepted);
      renderConnectionV2({surface,points:[{x:10,y:10},{x:10,y:70},{x:70,y:70}],effect:getEffectV2Path('triple-effect-triad-converge')});
      setup.push(performance.now()-started); maxCanvas=Math.max(maxCanvas,frame.querySelectorAll('canvas.link-card-exit-effect').length);
      await new Promise(resolve=>requestAnimationFrame(now=>{frameTimes.push(now-previousFrame);previousFrame=now;resolve();})); clearCanvasExit(); clearCanvasExit(); clearConnectionV2(surface); clearConnectionV2(surface); clearMemoryTileAnimations(); clearMemoryTileAnimations();
      tiles.forEach(tile=>tile.classList.remove('has-canvas-exit'));
    }
    observer.disconnect(); container.remove();
    return {maxParticles,maxCanvas,maxAccepted,afterParticles:getAchievementFlipParticleCount(),afterNodes:document.querySelectorAll('.achievement-flip-particles,canvas.link-card-exit-effect').length,active:getEffectRegistry().diagnostics(),setup,draw,frameTimes,idleFrameTimes,longTasks};
  });
  expect(result.maxParticles).toBeLessThanOrEqual(24); expect(result.maxCanvas).toBe(1); expect(result.afterParticles).toBe(0); expect(result.afterNodes).toBe(0); expect(result.active.connection).toBe(0); expect(result.active.canvas).toBe(0); expect(result.draw.length).toBeGreaterThan(0);
  expect(result.maxAccepted).toBe(2);
  await require('node:fs/promises').writeFile('docs/design/achievements/runtime/qa/f3-motion-cost.json',JSON.stringify(result,null,2));
});
