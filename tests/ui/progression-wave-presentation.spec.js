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
