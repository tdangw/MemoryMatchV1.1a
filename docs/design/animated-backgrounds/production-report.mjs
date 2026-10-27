import {readFile,writeFile} from 'node:fs/promises';
const finalMap=process.argv.includes('--final-map'),stem=finalMap?'g4-final-map-ab':'g4-production-ab';
const data=JSON.parse(await readFile(`docs/design/animated-backgrounds/qa/${stem}.json`,'utf8')),pairs=[];
const p=(a,n)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*n))];};
for(const off of data.filter(r=>!r.enabled)){
  const on=data.find(r=>r.enabled&&r.pair===off.pair&&JSON.stringify(r.scenario)===JSON.stringify(off.scenario));if(!on)continue;
  const b=p(off.sample.frames,.5),gap=r=>r.sample.frames.filter(t=>t>1.5*b).length/r.sample.frames.length;
  const d95=p(on.sample.frames,.95)-p(off.sample.frames,.95),d99=p(on.sample.frames,.99)-p(off.sample.frames,.99),dGap=gap(on)-gap(off),dInput=on.summary.inputP95-off.summary.inputP95;
  const metrics=r=>Object.fromEntries(r.metricsAfter.map(m=>[m.name,m.value-(r.metricsBefore.find(b=>b.name===m.name)?.value||0)]));
  pairs.push({scenario:off.scenario,pair:off.pair,b,deltaP95:d95,limitP95:.06*b,deltaP99:d99,limitP99:.12*b,deltaGapPoints:dGap*100,deltaDispatchInputP95:dInput,
    pass:d95<=.06*b&&d99<=.12*b&&dGap<=.005&&dInput<=8,
    off:off.summary,on:on.summary,offMetrics:metrics(off),onMetrics:metrics(on),onMountMs:on.after.mountMs,onReason:on.after.reason,
    onOwnedLayers:on.layers.owned.filter(l=>l.drawsContent).map(l=>({owner:l.owner,w:l.width,h:l.height,reasons:l.reasons})),onPaintCount:on.paintCount,
    diagnosticsStable:off.after.handles===off.before.handles&&on.after.handles===on.before.handles,errors:[...off.errors,...on.errors]});
}
const report={sampleCount:data.length,pairCount:pairs.length,allFrameInputPairsPass:pairs.length===(finalMap?3:30)&&pairs.every(p=>p.pass),pairs};
await writeFile(`docs/design/animated-backgrounds/qa/${finalMap?'g4-final-map-report':'g4-ab-report'}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(!report.allFrameInputPairsPass)process.exitCode=1;
