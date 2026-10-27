import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {openCase} from './production-helpers.mjs';
const browser=await chromium.launch({channel:'chrome'}),results=[];
try {
  for(const game of ['memory-match','link-connect','triple-connect'])for(const kind of ['map','game'])for(const mode of kind==='map'?['easy']:['easy','superHard']){
    const f=await openCase(browser,{kind,game,mode},true);
    try {
      const samples=await f.page.evaluate(async()=>{
        const api=window.ambientProbe,values=[];
        for(let i=0;i<100;i++){
          api.setMeteorEffectsEnabled(false);api.setMeteorEffectsEnabled(true);
          const d=api.getAmbientDiagnostics();if(d.preparing||d.blockers||d.lastError)throw new Error('Mount not ready');
          values.push({mountMs:d.mountMs,handles:d.handles,nodes:d.nodes,reason:d.reason});
          await new Promise(resolve=>requestAnimationFrame(resolve));
        }
        return values;
      });
      const times=samples.map(s=>s.mountMs).sort((a,b)=>a-b),p95=times[95];
      results.push({game,kind,mode,samples,p95,max:times[99],errors:f.errors});
      await writeFile('docs/design/animated-backgrounds/qa/g4-mounts.json',JSON.stringify(results,null,2));console.log(JSON.stringify({game,kind,mode,p95,max:times[99]}));
      if(p95>4)throw new Error('Mount p95 exceeds 4ms');
    }finally{await f.context.close();}
  }
}finally{await browser.close();}
