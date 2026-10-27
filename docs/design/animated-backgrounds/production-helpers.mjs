import { expect } from '@playwright/test';
export const ORIGIN = 'http://127.0.0.1:4194';
export const PC_PORTRAIT = { width: 900, height: 1024 };

export async function openCase(browser, scenario, enabled, { soak = false, viewport = PC_PORTRAIT, dpr = 1, recordVideo = null } = {}) {
  const context=await browser.newContext({viewport,deviceScaleFactor:dpr,reducedMotion:'no-preference',serviceWorkers:'block',...(recordVideo?{recordVideo}:{})});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const begin=Date.now(); await page.goto(ORIGIN); await page.locator('.game-selector__choice').first().waitFor();
  const homeUsableMs=Date.now()-begin;
  await page.addScriptTag({type:'module',url:`${ORIGIN}/ambient-probe.js`});
  await page.waitForFunction(()=>window.ambientProbe);
  await page.evaluate(on=>window.ambientProbe.setMeteorEffectsEnabled(on),enabled);
  if(scenario.kind!=='home') {
    await page.evaluate(game=>window.ambientProbe.map(game),scenario.game);
    await page.locator(`#menu-container.${scenario.game}-menu[data-map-ready="true"]`).waitFor();
    await page.waitForFunction(game=>document.documentElement.dataset.activeGame===game,scenario.game);
  }
  if(scenario.kind==='game') {
    await page.evaluate(({game,mode})=>window.ambientProbe.start(game,mode),scenario);
    if(scenario.game==='memory-match') await page.locator('#grid-container:not(.is-locked) .tile').first().waitFor();
    await expect(page.locator('.progression-wave-notice,.level-reward-overlay')).toHaveCount(0,{timeout:15000});
    const guide=page.locator('.tutorial-guide');
    if(await guide.isVisible()){await guide.getByRole('button',{name:'Đã hiểu'}).click();await expect(guide).toHaveCount(0);}
    if(scenario.mode!=='endless') {
      if(scenario.game==='memory-match') for(let i=0;i<(soak?12:4);i++) {
        await page.evaluate(()=>window.ambientProbe.memoryTime());
        await page.locator('.quick-assist__choice').filter({hasText:'+60 giây'}).click();
        await expect(page.locator('.app-modal-overlay')).toHaveCount(0);
      }
      else if(scenario.game==='link-connect') for(let i=0;i<(soak?24:6);i++) {
        const count=await page.evaluate(()=>window.ambientProbe.linkItemCount());
        await page.evaluate(()=>window.ambientProbe.linkFreeze());
        await page.waitForFunction(before=>window.ambientProbe.linkItemCount()===before-1&&window.ambientProbe.linkUnlocked(),count);
      }
      else for(let i=0;i<(soak?24:6);i++) await page.evaluate(()=>window.ambientProbe.tripleTime());
    }
  }
  let mapPose=null;
  if(scenario.kind==='map'&&scenario.maximumPose){
    await page.evaluate(()=>window.ambientProbe.setMeteorEffectsEnabled(true));
    await expect.poll(()=>page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().preparing)).toBe(0);
    await expect.poll(()=>page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().blockers)).toBe(0);
    const scroll=page.locator('.adventure-map-scroll'),bottom=await scroll.evaluate(n=>n.scrollHeight-n.clientHeight);
    for(let step=0;step<96;step++){
      const top=Math.max(0,bottom-step*120);await scroll.evaluate((n,y)=>{n.scrollTop=y;},top);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await expect.poll(()=>page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().blockers)).toBe(0);
      const data=await page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics());
      if(!mapPose||data.handles>mapPose.handles)mapPose={top,handles:data.handles,kinds:data.kinds};
      if(data.handles===5||top===0)break;
    }
    await scroll.evaluate((n,y)=>{n.scrollTop=y;},mapPose.top);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await expect.poll(()=>page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().blockers)).toBe(0);
    await page.evaluate(on=>window.ambientProbe.setMeteorEffectsEnabled(on),enabled);
  }
  await expect.poll(()=>page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().preparing)).toBe(0);
  await expect.poll(()=>page.evaluate(()=>window.ambientProbe.getAmbientDiagnostics().blockers)).toBe(0);
  // Warm native timelines for two seconds; readiness above is event/state based.
  await page.waitForTimeout(2000);
  const cdp=await context.newCDPSession(page); await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
  return {context,page,cdp,errors,homeUsableMs,mapPose};
}

export async function ownedLayers(cdp) {
  await cdp.send('DOM.getDocument',{depth:-1,pierce:true});
  let layers=[],resolveFirst;
  const first=new Promise(resolve=>{resolveFirst=resolve;});
  const update=event=>{if(event.layers&&event.layers.length){layers=event.layers;resolveFirst();}};
  cdp.on('LayerTree.layerTreeDidChange',update);await cdp.send('LayerTree.enable');
  let deadline;
  try { await Promise.race([first,new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('LayerTree snapshot unavailable')),5000);})]); }
  finally { clearTimeout(deadline); }
  const owned=[],all=[];
  for(const layer of layers){
    if(!layer.backendNodeId){all.push(layer);continue;}
    const {object}=await cdp.send('DOM.resolveNode',{backendNodeId:layer.backendNodeId});
    try{
      const result=await cdp.send('Runtime.callFunctionOn',{objectId:object.objectId,functionDeclaration:"function(){return {ambient:this.nodeType===1&&this.isConnected&&Boolean(this.closest('.ambient-bg-host')),tag:this.nodeName,className:this.nodeType===1?this.getAttribute('class'):null,id:this.nodeType===1?this.id:null};}",returnByValue:true});
      const data={...layer,dom:result.result.value};all.push(data);
      if(result.result.value.ambient)owned.push({...data,owner:result.result.value.className,reasons:(await cdp.send('LayerTree.compositingReasons',{layerId:layer.layerId})).compositingReasons});
    }finally{await cdp.send('Runtime.releaseObject',{objectId:object.objectId});}
  }
  cdp.off('LayerTree.layerTreeDidChange',update);return {owned,all};
}
