import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {openCase} from './production-helpers.mjs';
const browser=await chromium.launch({channel:'chrome'}),results=[];
const games=['memory-match','link-connect','triple-connect'];
try {
  for(const profile of [{width:320,height:740,dpr:2},{width:412,height:915,dpr:3},{width:900,height:1024,dpr:1}])
  for(const game of games)for(const kind of ['map','game']) {
    const f=await openCase(browser,{kind,game,mode:'superHard'},true,{viewport:{width:profile.width,height:profile.height},dpr:profile.dpr});
    try {
      for(const skin of ['default','woodland','papercut','starship','storybook']) {
        await f.page.evaluate(s=>window.ambientProbe.skin(s),skin);
        await expect.poll(()=>f.page.locator('html').getAttribute('data-ui-skin')).toBe(skin);
        await f.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const data=await f.page.evaluate(()=>{
          const d=window.ambientProbe.getAmbientDiagnostics();
          const selectors=d.scene==='map'?'.adventure-map-cell,.adventure-map-decoration,.adventure-special-modes,.treasure-map-card':'[data-shell-region="frame"],[data-shell-region="title"],[data-shell-region="hud"],[data-shell-region="milestones"],.adventure-dock,.adventure-ad-slot';
          const excluded=[...document.querySelectorAll(selectors)].map(n=>n.getBoundingClientRect());
          const overlaps=[...document.querySelectorAll('.ambient-bg-region')].filter(n=>{const r=n.getBoundingClientRect();return excluded.some(e=>r.left<e.right&&r.right>e.left&&r.top<e.bottom&&r.bottom>e.top);}).length;
          return {d,overlaps,hosts:document.querySelectorAll('.ambient-bg-host').length,overflow:document.documentElement.scrollWidth>innerWidth};
        });
        expect(data.overlaps).toBe(0);expect(data.hosts).toBeLessThanOrEqual(1);expect(data.d.handles).toBeLessThanOrEqual(5);expect(data.d.nodes).toBeLessThanOrEqual(24);expect(data.d.lastError).toBeNull();expect(data.overflow).toBe(false);
        await f.page.screenshot({path:`runtime/qa/animated-backgrounds/matrix-${profile.width}-${game}-${kind}-${skin}.png`});
        results.push({profile,game,kind,skin,...data});
      }
      for(const height of [profile.height-80,profile.height]) {
        await f.page.setViewportSize({width:profile.width,height});
        await f.page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const state=await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics());
        expect(state.handles).toBeLessThanOrEqual(5);expect(state.nodes).toBeLessThanOrEqual(24);expect(state.lastError).toBeNull();
      }
      await f.page.emulateMedia({reducedMotion:'reduce'});
      await expect.poll(()=>f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().handles)).toBe(0);
      await expect(f.page.locator('.ambient-bg-host')).toHaveCount(0);
      expect(f.errors).toEqual([]);
      await writeFile('docs/design/animated-backgrounds/qa/g4-matrix.json',JSON.stringify(results,null,2));
      console.log(JSON.stringify({profile,game,kind,skins:5}));
    }finally{await f.context.close();}
  }
}finally{await browser.close();}
