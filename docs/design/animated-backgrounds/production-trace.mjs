import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {openCase,ownedLayers} from './production-helpers.mjs';
const browser=await chromium.launch({channel:'chrome'}),results=[];
const final=process.argv.includes('--final');
try {
  for(const scenario of [{kind:'map',game:'memory-match',...(final?{maximumPose:true}:{})},{kind:'game',game:'memory-match',mode:'easy'},{kind:'game',game:'triple-connect',mode:'easy'},{kind:'game',game:'triple-connect',mode:'superHard'}])for(const enabled of [false,true]){
    const f=await openCase(browser,scenario,enabled),events=[];
    try {
      const layers=await ownedLayers(f.cdp),collected=e=>events.push(...e.value);
      f.cdp.on('Tracing.dataCollected',collected);
      await f.cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,cc,viz,benchmark,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame',transferMode:'ReportEvents'});
      await f.page.waitForTimeout(15000);
      const done=new Promise(resolve=>f.cdp.once('Tracing.tracingComplete',resolve));
      await f.cdp.send('Tracing.end');await done;f.cdp.off('Tracing.dataCollected',collected);
      const counts={};for(const e of events)counts[e.name]=(counts[e.name]||0)+1;
      const name=`g4${final?'-final':''}-${scenario.game}-${scenario.kind}-${scenario.mode||'map'}-${enabled?'on':'off'}`;
      await writeFile(`docs/design/animated-backgrounds/qa/traces/${name}.json.gz`,gzipSync(JSON.stringify({traceEvents:events})));
      results.push({scenario,enabled,layers,counts,paint:events.filter(e=>e.name==='Paint'),errors:f.errors});
      await writeFile(`docs/design/animated-backgrounds/qa/g4-trace${final?'-final':''}-summary.json`,JSON.stringify(results,null,2));
      console.log(JSON.stringify({scenario,enabled,paint:counts.Paint||0,drawFrame:counts.DrawFrame||0,droppedFrame:counts.DroppedFrame??null}));
    }finally{await f.context.close();}
  }
}finally{await browser.close();}
