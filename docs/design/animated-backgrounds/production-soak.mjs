import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {openCase,ownedLayers} from './production-helpers.mjs';
const browser=await chromium.launch({channel:'chrome'}),results=[];
try {
  for(const scenario of [{kind:'home'},{kind:'map',game:'memory-match'},{kind:'game',game:'triple-connect',mode:'superHard'}]) {
    const f=await openCase(browser,scenario,true,{soak:true}),samples=[];
    try {
      const layers=await ownedLayers(f.cdp);
      for(let minute=0;minute<=10;minute++) {
        await f.cdp.send('HeapProfiler.collectGarbage');
        samples.push({minute,heap:(await f.cdp.send('Runtime.getHeapUsage')).usedSize,dom:await f.cdp.send('Memory.getDOMCounters'),diagnostics:await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics())});
        console.log(JSON.stringify({scenario,...samples.at(-1)}));
        await writeFile('docs/design/animated-backgrounds/qa/g4-production-soak.json',JSON.stringify([...results,{scenario,layers,samples,errors:f.errors}],null,2));
        if(minute<10)await f.page.waitForTimeout(60000);
      }
      const heaps=samples.slice(2).map(s=>s.heap),spread=Math.max(...heaps)-Math.min(...heaps);
      if(spread>=2*1024*1024)throw new Error(`Post-GC plateau exceeded: ${spread}`);
      for(const s of samples){if(s.diagnostics.blockers||s.diagnostics.preparing||s.diagnostics.lastError)throw new Error('Soak scene was blocked');if(s.diagnostics.handles!==samples[0].diagnostics.handles)throw new Error('Soak handles changed');}
      await f.page.evaluate(()=>{window.ambientProbe.disposeMeteorEffects();window.ambientProbe.disposeMeteorEffects();});
      const disposed=await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics());
      if(disposed.handles||disposed.timers||disposed.listeners||await f.page.locator('.ambient-bg-host,.meteor-layer').count())throw new Error('Dispose retained resources');
      results.push({scenario,layers,samples,spread,disposed,errors:f.errors});
      await writeFile('docs/design/animated-backgrounds/qa/g4-production-soak.json',JSON.stringify(results,null,2));
    }finally{await f.context.close();}
  }
}finally{await browser.close();}
