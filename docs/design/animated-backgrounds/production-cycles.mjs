import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {openCase} from './production-helpers.mjs';
const browser=await chromium.launch({channel:'chrome'}),samples=[];
const games=['memory-match','link-connect','triple-connect'];
try {
  const f=await openCase(browser,{kind:'home'},true);
  try {
    const settle=async()=>{
      await expect(f.page.locator('.progression-wave-notice,.level-reward-overlay')).toHaveCount(0,{timeout:15000});
      const guide=f.page.locator('.tutorial-guide');if(await guide.isVisible())await guide.getByRole('button',{name:'Đã hiểu'}).click();
      await expect.poll(()=>f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().preparing)).toBe(0);
      await expect.poll(()=>f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().blockers)).toBe(0);
    };
    const cycle=async(index)=>{
      const game=games[index%3];await f.page.evaluate(id=>window.ambientProbe.map(id),game);
      await f.page.locator(`#menu-container.${game}-menu[data-map-ready="true"]`).waitFor();
      await f.page.waitForFunction(id=>document.documentElement.dataset.activeGame===id,game);
      await expect.poll(()=>f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().handles)).toBeGreaterThan(0);
      const scroll=f.page.locator('.adventure-map-scroll');
      await scroll.evaluate(n=>{n.scrollTop=Math.max(0,n.scrollTop-220);n.dispatchEvent(new Event('scroll'));n.dispatchEvent(new Event('scrollend'));});
      await f.page.locator('.adventure-map-node--level[data-level="1"]').click();
      await expect(f.page.locator('#adventure-level-modal')).toBeVisible();
      expect((await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics())).handles).toBe(0);
      await f.page.locator('#adventure-level-modal .app-modal__close').click();await expect(f.page.locator('#adventure-level-modal')).toHaveCount(0);
      await f.page.evaluate(id=>window.ambientProbe.start(id,'easy'),game);await settle();
      if(index%5===0){await f.page.evaluate(id=>window.ambientProbe.start(id,'easy'),game);await settle();}
      const state=await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics());
      expect(state.scene).toBe(game);expect(state.sceneInstances).toBeLessThanOrEqual(1);expect(state.handles).toBeLessThanOrEqual(5);expect(state.nodes).toBeLessThanOrEqual(24);expect(state.lastError).toBeNull();
      await f.page.evaluate(()=>{window.ambientProbe.setMeteorEffectsEnabled(false);window.ambientProbe.setMeteorEffectsEnabled(true);window.ambientProbe.home();});
      await expect(f.page.locator('.game-selector__choice').first()).toBeVisible();
      const home=await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics());
      expect(home).toMatchObject({scene:'home',handles:0,timers:0,blockers:0,preparing:0});await expect(f.page.locator('.ambient-bg-host')).toHaveCount(0);await expect(f.page.locator('.shooting-star')).toHaveCount(2);
    };
    for(let i=0;i<3;i++)await cycle(i);
    for(let i=0;i<=100;i++){
      if(i%10===0){await f.cdp.send('HeapProfiler.collectGarbage');samples.push({cycle:i,dom:await f.cdp.send('Memory.getDOMCounters'),heap:(await f.cdp.send('Runtime.getHeapUsage')).usedSize,diagnostics:await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics())});console.log(JSON.stringify(samples.at(-1)));await writeFile('docs/design/animated-backgrounds/qa/g4-cycles.json',JSON.stringify({samples,errors:f.errors},null,2));}
      if(i<100)await cycle(i);
    }
    expect(f.errors).toEqual([]);
    const listeners=samples.map(s=>s.dom.jsEventListeners);
    expect(Math.max(...listeners)-Math.min(...listeners)).toBe(0);
  }finally{await f.context.close();}
}finally{await browser.close();}
