import {writeFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
import {seed,open,snapshot} from './helpers/treasureFixtures.js';

// Seeded cleared levels can also open achievement acknowledgements on the map.
// Acknowledge them through the real UI while exercising treasure lifecycle.
test.beforeEach(async({page})=>{
  await page.addLocatorHandler(page.locator('#achievement-notice-modal'),async()=>{
    const notice=await page.locator('#achievement-notice-modal').elementHandle();
    await page.locator('#achievement-notice-modal').getByRole('button',{name:'Tiếp tục',exact:true}).click();
    await expect.poll(()=>notice.evaluate(node=>node.isConnected)).toBe(false);
  },{noWaitAfter:true});
});


async function ownerCounts(page) { return page.evaluate(async()=> (await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics()); }

test('thirty real treasure screen cycles release resources and record one finite opening separately from commit',async({page},testInfo)=>{
  test.setTimeout(90000);await page.emulateMedia({reducedMotion:'no-preference'});await seed(page,'memory-match');
  await open(page);await page.locator('.adventure-screen[data-screen=treasure] > .adventure-exit').click();await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  const metrics=async()=>{await cdp.send('HeapProfiler.collectGarbage');return Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));};
  await expect(page.locator('.adventure-touch-particle')).toHaveCount(0);
  const baseline=await metrics(),counts=await ownerCounts(page);
  for(let i=0;i<30;i++) {await open(page);await page.locator('.adventure-screen[data-screen=treasure] > .adventure-exit').click();await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);}
  await expect(page.locator('.adventure-touch-particle')).toHaveCount(0);
  expect(await ownerCounts(page)).toEqual(counts);
  const after=await metrics();expect(after.JSEventListeners-baseline.JSEventListeners).toBeLessThanOrEqual(4);expect(after.Nodes-baseline.Nodes).toBeLessThanOrEqual(20);expect(after.JSHeapUsedSize-baseline.JSHeapUsedSize).toBeLessThan(2*1024*1024);
  await open(page);
  await page.evaluate(()=>{
    window.treasureTrace={frames:[],longTasks:[],running:true};let previous=performance.now();
    const frame=now=>{window.treasureTrace.frames.push(now-previous);previous=now;if(window.treasureTrace.running)window.treasureTrace.handle=requestAnimationFrame(frame);};
    window.treasureTrace.handle=requestAnimationFrame(frame);
    window.treasureTrace.observer=new PerformanceObserver(list=>window.treasureTrace.longTasks.push(...list.getEntries().map(e=>e.duration)));window.treasureTrace.observer.observe({type:'longtask'});
  });
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();
  await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','success');
  const trace=await page.evaluate(()=>{
    const t=window.treasureTrace;t.running=false;cancelAnimationFrame(t.handle);t.observer.disconnect();
    const values=[...t.frames].sort((a,b)=>a-b),panel=document.querySelector('.treasure-dialog');
    return {frames:t.frames.length,frameP95:values[Math.floor(values.length*.95)],longTasks:t.longTasks,busyMs:Number(panel.dataset.treasureBusyMs),commitMs:Number(panel.dataset.treasureCommitMs),presentationMs:Number(panel.dataset.treasurePresentationMs)};
  });
  expect(trace.busyMs).toBeLessThan(100);expect(trace.presentationMs).toBeGreaterThanOrEqual(750);expect(trace.presentationMs).toBeLessThan(2000);
  await writeFile('docs/qa/gameplay-progression/treasure-desktop-metrics.json',JSON.stringify({baseline,after,trace,counts},null,2));
  await testInfo.attach('treasure-desktop-timings-and-resource-delta',{body:JSON.stringify({baseline,after,trace,counts},null,2),contentType:'application/json'});
  await page.getByRole('button',{name:'Xong',exact:true}).click();await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);await expect(page.locator('.adventure-touch-particle')).toHaveCount(0);
  expect(await ownerCounts(page)).toEqual(counts);
});

for(const interrupt of ['close','switch','reload','background','reduce']) test(`opening survives ${interrupt} after commit without granting twice`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await seed(page,'memory-match');await open(page);
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','opening');
  expect((await snapshot(page,'memory-match')).coins).toBe(30);
  if(interrupt==='close') {await page.locator('.adventure-screen[data-screen=treasure] > .adventure-exit').click();await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);}
  if(interrupt==='switch') {await page.evaluate(async()=> (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect'));await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);}
  if(interrupt==='reload') await page.reload();
  if(interrupt==='background') await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;});
  if(interrupt==='reduce') await page.emulateMedia({reducedMotion:'reduce'});
  if(['background','reduce'].includes(interrupt)) {await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','success');await page.getByRole('button',{name:'Xong',exact:true}).click();}
  await page.evaluate(async()=> (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  await open(page);await expect(page.locator('[data-treasure-tier="C"]')).toHaveClass(/is-claimed/);expect((await snapshot(page,'memory-match')).coins).toBe(30);
});

test('rapid retry after a read failure cannot let an old read destroy the current modal',async({page})=>{
  await page.route(url=>url.pathname==='/js/persistence.js',async route=>{
    const response=await route.fetch();const body=await response.text();
    const signature='export async function loadPersistentChapter(game, number) {';expect(body).toContain(signature);
    await route.fulfill({response,body:body.replace(signature,signature+`\nconst fault=globalThis.__treasureReadFault;if(fault){fault.calls++;if(fault.throwOnce){fault.throwOnce=false;throw Error('Read unavailable');}if(fault.hold)await new Promise(resolve=>fault.resume=resolve);}\n`)});
  });
  await seed(page,'memory-match');await page.evaluate(()=>window.__treasureReadFault={throwOnce:true,hold:true,calls:0});
  await page.locator('[data-chest="1"]').click();await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Thử lại',exact:true}).dblclick();
  expect(await page.evaluate(()=>window.__treasureReadFault.calls)).toBe(2);
  await page.evaluate(()=>{window.__treasureReadFault.hold=false;window.__treasureReadFault.resume();});
  await expect(page.locator('.treasure-card')).toHaveCount(4);await expect(page.locator('#adventure-chest-modal')).toHaveCount(1);
});

test('a replacement treasure modal cancels the old opening and releases its own scope',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await seed(page,'memory-match');await open(page);
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','opening');
  await page.evaluate(async()=>{
    window.replacementTreasure=(await import('/js/progression/treasureModal.js')).openJourneyTreasure({gameId:'memory-match',block:1,owner:(await import('/js/appPageLifecycle.js')).getAppPageScope()});
  });
  await expect(page.locator('#adventure-chest-modal')).toHaveCount(1);await expect(page.locator('.treasure-hero')).toHaveCount(1);
  await expect(page.locator('[data-treasure-tier="C"]')).toHaveClass(/is-claimed/);expect((await snapshot(page,'memory-match')).coins).toBe(30);
  const disposed=await page.evaluate(()=>{window.replacementTreasure.destroy();return window.replacementTreasure.diagnostics();});
  expect(disposed).toEqual({active:false,listener:0,timeout:0,interval:0,frame:0,animation:0,node:0,cleanup:0});
});

test('changing account during the committed opening cannot update the old modal',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await seed(page,'memory-match');await open(page);
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','opening');
  await page.evaluate(async()=> (await import('/js/rankingOwner.js')).setRankingOwner({id:'other-profile',uid:'other-user'}));
  await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);expect((await snapshot(page,'memory-match')).coins).toBe(30);
});

test('a failed save shows a generic retry and never opens or partially grants the chest',async({page})=>{
  await page.route(url=>url.pathname==='/js/persistence.js',async route=>{
    const response=await route.fetch(),body=await response.text(),signature='export function savePersistentGameData(';
    expect(body).toContain(signature);
    await route.fulfill({response,body:body.replace(signature,'function originalTreasureSave(')+`\nexport function savePersistentGameData(...args){return globalThis.__treasureWriteFail?Promise.resolve(false):originalTreasureSave(...args);}\n`});
  });
  await seed(page,'memory-match');await open(page);await page.evaluate(()=>window.__treasureWriteFail=true);
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();
  await expect(page.locator('.treasure-error')).toHaveText('Chưa nhận được thưởng. Hãy thử lại.');
  expect((await snapshot(page,'memory-match')).coins).toBe(0);expect((await snapshot(page,'memory-match')).hints).toBe(0);
  await expect(page.locator('.treasure-hero .is-open')).toHaveCount(0);
  await page.evaluate(()=>window.__treasureWriteFail=false);await page.getByRole('button',{name:'Thử lại',exact:true}).click();
  await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','success');expect((await snapshot(page,'memory-match')).coins).toBe(30);
});
