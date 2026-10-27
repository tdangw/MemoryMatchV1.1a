// Repeatable same-build evidence; outputs are local QA, not product assets.
import {chromium} from '@playwright/test';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openCase,ownedLayers} from './production-helpers.mjs';
const finalMap=process.argv.includes('--final-map');
const output=`docs/design/animated-backgrounds/qa/${finalMap?'g4-final-map-ab':'g4-production-ab'}.json`;
const games=['memory-match','link-connect','triple-connect'];
const scenarios=finalMap?[{kind:'map',game:'memory-match',maximumPose:true}]:[{kind:'home'},...games.map(game=>({kind:'map',game})),...games.flatMap(game=>['easy','superHard'].map(mode=>({kind:'game',game,mode})))];
const browser=await chromium.launch({channel:'chrome'});
const duration=120000,results=await readFile(output,'utf8').then(JSON.parse,()=>[]);
const buildHash=createHash('sha256').update(await readFile('runtime/qa/animated-backgrounds/production/index.html')).update(await readFile('runtime/qa/animated-backgrounds/production/ambient-probe.js')).digest('hex');
if(results.some(r=>r.buildHash!==buildHash))throw new Error('Existing measurements belong to another build; archive them before starting a fresh matrix');
const percentile=(values,p)=>{const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]??null;};
try {
  const system=await browser.newBrowserCDPSession();
  const gpu=await system.send('SystemInfo.getInfo');
  await writeFile('docs/design/animated-backgrounds/qa/g4-browser-system.json',JSON.stringify({version:browser.version(),gpu},null,2));
  for(const scenario of scenarios)for(let pair=0;pair<3;pair++)for(const enabled of pair%2?[true,false]:[false,true]) {
    if(results.some(r=>JSON.stringify(r.scenario)===JSON.stringify(scenario)&&r.pair===pair&&r.enabled===enabled))continue;
    const f=await openCase(browser,scenario,enabled);
    try {
      const before=await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics());
      if(enabled&&scenario.kind==='map'&&!before.handles)throw new Error('Expected moving map');
      if(before.reason==='source-mismatch'||before.lastError)throw new Error(JSON.stringify(before));
      const layers=await ownedLayers(f.cdp),paint=[],trees=[];
      let paintCount=0,treeCount=0;
      const painted=e=>{paintCount++;if(paint.length<5000)paint.push({layerId:e.layerId,clip:e.clip});};
      const tree=e=>{treeCount++;if(trees.length<5000&&e.layers)trees.push(e.layers.map(l=>({id:l.layerId,node:l.backendNodeId,w:l.width,h:l.height,draw:l.drawsContent})));};
      f.cdp.on('LayerTree.layerPainted',painted);f.cdp.on('LayerTree.layerTreeDidChange',tree);
      await f.cdp.send('HeapProfiler.collectGarbage');
      const heapBefore=(await f.cdp.send('Runtime.getHeapUsage')).usedSize;
      const metricsBefore=(await f.cdp.send('Performance.getMetrics')).metrics;
      await f.page.evaluate(()=>{
        window.ambientSample={frames:[],input:[],longtasks:[],loaf:[],events:[],observers:[],supported:PerformanceObserver.supportedEntryTypes};
        const sample=window.ambientSample;
        for(const [type,key]of [['longtask','longtasks'],['long-animation-frame','loaf'],['event','events']])if(sample.supported.includes(type)){
          const observer=new PerformanceObserver(list=>{for(const e of list.getEntries())sample[key].push(e.toJSON());});
          observer.observe({type,buffered:false,...(type==='event'?{durationThreshold:16}:{})});sample.observers.push(observer);
        }
        sample.listener=e=>{if(e.isTrusted)sample.input.push({delay:Math.max(0,performance.now()-e.timeStamp),type:e.type});};
        document.addEventListener('pointerdown',sample.listener,true);
        let previous;sample.running=true;
        const frame=now=>{if(!sample.running)return;if(previous!==undefined)sample.frames.push(now-previous);previous=now;sample.raf=requestAnimationFrame(frame);};
        sample.raf=requestAnimationFrame(frame);
      });
      const start=Date.now();let inputCount=0;
      while(Date.now()-start<duration){
        // Identical trusted input dispatch on a non-action background point.
        await f.page.mouse.click(3,3);inputCount++;
        await f.page.waitForTimeout(Math.min(2000,Math.max(0,duration-(Date.now()-start))));
      }
      const sample=await f.page.evaluate(()=>{
        const s=window.ambientSample;s.running=false;cancelAnimationFrame(s.raf);
        document.removeEventListener('pointerdown',s.listener,true);s.observers.forEach(o=>o.disconnect());
        const result={frames:s.frames,input:s.input,longtasks:s.longtasks,loaf:s.loaf,events:s.events,supported:s.supported};delete window.ambientSample;return result;
      });
      const metricsAfter=(await f.cdp.send('Performance.getMetrics')).metrics;
      await f.cdp.send('HeapProfiler.collectGarbage');const heapAfter=(await f.cdp.send('Runtime.getHeapUsage')).usedSize;
      f.cdp.off('LayerTree.layerPainted',painted);
      f.cdp.off('LayerTree.layerTreeDidChange',tree);
      const after=await f.page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics());
      const overlays=await f.page.locator('.app-modal-overlay,.level-reward-overlay,.progression-wave-notice,.game-over-overlay').count();
      if(overlays||after.blockers)throw new Error(`Sample blocked: ${JSON.stringify({overlays,after})}`);
      const b=percentile(sample.frames,.5);
      const record={buildHash,scenario,pair,enabled,mapPose:f.mapPose,durationMs:Date.now()-start,inputCount,before,after,heapBefore,heapAfter,metricsBefore,metricsAfter,layers,paint,paintCount,trees,treeCount,errors:f.errors,sample,
        summary:{p50:b,p95:percentile(sample.frames,.95),p99:percentile(sample.frames,.99),max:Math.max(...sample.frames),gapRatio:sample.frames.filter(n=>n>b*1.5).length/sample.frames.length,inputP95:percentile(sample.input.map(n=>n.delay),.95),longTasks:sample.longtasks.length}};
      results.push(record);await writeFile(output,JSON.stringify(results));
      console.log(JSON.stringify({scenario,pair,enabled,summary:record.summary,handles:after.handles,reason:after.reason}));
    }finally{await f.context.close();}
  }
}finally{await browser.close();}
