import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {openCase,ORIGIN} from './production-helpers.mjs';
const browser=await chromium.launch({channel:'chrome'}),results=[],states={};
try {
  const fixture=await openCase(browser,{kind:'home'},false);
  for(const enabled of [false,true]){
    await fixture.page.evaluate(on=>window.ambientProbe.saveSetting('meteorEffects',on),enabled);
    states[enabled]=await fixture.context.storageState({indexedDB:true});
  }
  await fixture.context.close();
  for(let pair=0;pair<3;pair++)for(const enabled of pair%2?[true,false]:[false,true]){
    const context=await browser.newContext({storageState:states[enabled],viewport:{width:900,height:1024},reducedMotion:'no-preference',serviceWorkers:'block'});
    try {
      const page=await context.newPage(),cdp=await context.newCDPSession(page),requests=[],warnings=[];
      await cdp.send('Network.enable');await cdp.send('Network.clearBrowserCache');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
      page.on('request',r=>requests.push({url:r.url(),at:Date.now()}));page.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
      const start=Date.now();await page.goto(ORIGIN);await page.locator('.game-selector__choice').first().waitFor();
      await page.locator('#app-loading').waitFor({state:'detached'});
      await page.locator('.game-selector__choice.is-selected').click({trial:true});
      const usable=Date.now();
      const disabled=await page.locator('body').evaluate(b=>b.classList.contains('meteor-effects-disabled'));
      if(disabled===enabled)throw new Error('Cold fixture did not restore preference');
      await page.waitForTimeout(3500);
      results.push({pair,enabled,usableMs:usable-start,requests:requests.map(r=>({...r,relativeMs:r.at-start,beforeUsable:r.at<=usable})),warnings});
      console.log(JSON.stringify({pair,enabled,usableMs:usable-start}));
      await writeFile('docs/design/animated-backgrounds/qa/g4-cold.json',JSON.stringify(results,null,2));
    }finally{await context.close();}
  }
}finally{await browser.close();}
