import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

for(const [width,height] of [[320,568],[412,915],[844,390],[1024,900]]) for(const motion of ['reduce','no-preference']) {
  test(`progression shells remain bounded at ${width}x${height}, ${motion}`,async({page})=>{
    test.setTimeout(180000);
    await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:motion});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/');
    await page.evaluate(async()=>{
      await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
      await(await import('/tests/ui/helpers/progressionFixtures.js')).seedProgressionAccess();
    });
    const measurements=[];
    for(const gameId of ['memory-match','link-connect','triple-connect']) for(const [mode,level,waves] of [['easy',1,2],['normal',11,3],['hard',51,4],['superHard',91,5],['challenge',11,3],['endless',91,5]]) {
      await page.evaluate(async args=>{
        await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(args.gameId);
        await(await import('/tests/ui/helpers/progressionFixtures.js')).startProgressionScene(args.gameId,args.mode,args.level);
      },{gameId,mode,level});
      const root=page.locator('.game-shell-root:visible');
      await expect(root).toHaveCount(1);
      await expect(root.locator('.progression-wave-status')).toHaveCount(0);
      await expect(root.locator('.stat-level')).toHaveAttribute('aria-label',`Màn ${level}-1`);
      await expect(root).toHaveAttribute('data-wave-count',String(waves));
      await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      const measured=await root.evaluate(root=>{
        const board=root.querySelector('[data-shell-region="board"]');
        const bounds=board.getBoundingClientRect();
        const tiles=[...board.querySelectorAll('.tile,.link-tile,.triple-connect__tile')];
        return {tiles:tiles.length,width:bounds.width,height:bounds.height,overflow:root.scrollWidth-root.clientWidth,
          overflowNodes:[...root.querySelectorAll('*')].filter(node=>node.getBoundingClientRect().right>root.getBoundingClientRect().right+1).slice(0,8).map(node=>({tag:node.tagName,id:node.id,class:node.className,right:node.getBoundingClientRect().right})),
          outside:tiles.filter(tile=>{const r=tile.getBoundingClientRect();return r.width>0&&(r.left<bounds.left-2||r.right>bounds.right+2||r.top<bounds.top-2||r.bottom>bounds.bottom+2);}).length};
      });
      expect(measured.tiles).toBeGreaterThan(0);expect(measured.width).toBeGreaterThan(0);
      expect(measured.overflow,JSON.stringify({gameId,mode,...measured})).toBeLessThanOrEqual(1);expect(measured.outside).toBe(0);
      measurements.push({gameId,mode,level,...measured});
      await page.evaluate(async()=>{
        window.disposedProgressionScope=(await import('/js/gameShell/gameShellLifecycle.js')).getActiveGameScope();
        (await import('/js/gameSelector.js')).showGameSelector();
      });
      const cleanup=await page.evaluate(()=>window.disposedProgressionScope.diagnostics());
      expect(Object.entries(cleanup).filter(([key])=>key!=='active').every(([,value])=>value===0)).toBe(true);
      expect(cleanup.active).toBe(false);
    }
    expect(errors).toEqual([]);
    writeFileSync(`docs/qa/gameplay-progression/matrix-${width}-${motion}.json`,JSON.stringify(measurements,null,2));
  });
}

for(const [width,height] of [[320,568],[412,915],[844,390],[1024,900]]) {
  test(`all twenty Triple patterns render and expose clickable tiles at ${width}x${height}`,async({page})=>{
    test.setTimeout(180000);await page.setViewportSize({width,height});await page.goto('/');
    await page.evaluate(async()=> (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect'));
    for(let patternIndex=0;patternIndex<20;patternIndex++) {
      await page.evaluate(async patternIndex=>{
        await(await import('/js/tripleConnect/tripleController.js')).startTripleConnectDevelopmentRound({mode:'easy',patternIndex,seed:`render-${patternIndex}`});
      },patternIndex);
      const tiles=page.locator('.triple-connect__board .triple-connect__tile');
      await expect(tiles).toHaveCount(27);
      const playable=page.locator('.triple-connect__board .triple-connect__tile.is-exposed').first();
      await playable.scrollIntoViewIfNeeded();
      const hit=await playable.evaluate(node=>{
        const r=node.getBoundingClientRect();
        return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('[data-tile-id]')?.dataset.tileId===node.dataset.tileId;
      });
      expect(hit).toBe(true);
      if(patternIndex===0||patternIndex===19) await page.locator('#triple-connect-container').screenshot({path:`docs/qa/gameplay-progression/pattern-${patternIndex}-${width}.png`});
    }
  });
}
