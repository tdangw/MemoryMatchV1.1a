import { test,expect } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
const fixture = `
import {transitionSpark} from '/js/liveops/sparkModel.js';
import {createLoginCandidate} from '/js/liveops/missionRewards.js';
import {LETTER_ALPHABET} from '/js/liveops/config.js';
import {chestCandidate} from '/js/liveops/chests.js';
let now=Date.now(), state=transitionSpark(null,{type:'status'},{uid:'ui-owner',now,festivalEnabled:true,fireflyEarned:130}).state;
state.daily={wins:3,matches:30,noHint:3,visits:0,claimed:[]};state.weekly={wins:12,matches:120,noHint:3,visits:3,claimed:[]};
state.loginNext=2;state.loginDay=state.day-1;
state.letters.earned=Object.fromEntries(LETTER_ALPHABET.map(k=>[k,10]));state.letters.counts={...state.letters.earned};
state.chests.earned={c:1,frame:0,avatar:10000,badge:1};let calls=0;
window.eventsFixture={fail:false,fullSupport:false,get state(){return state},get calls(){return calls},advance:n=>{now+=n},get now(){return now}};
export const bindLiveopsAccount=()=>()=>{};
export const trustedRewardPeriod=()=>null;
export async function requestLiveops(command={type:'status'}){
calls++;if(command.type==='openChest'&&window.eventsFixture.fullSupport)throw Object.assign(new Error('Kho hỗ trợ đã đầy.'),{pendingChest:{chestType:'c',gameId:'memory-match'},code:'rewards/inventory-full'});if(window.eventsFixture.fail)throw new Error('Chưa kết nối được.');const cmd={...command};if(['sellLetter','fuseLetter','exchangeLetterSet'].includes(cmd.type)){cmd.sequence=state.letters.sequence+1;cmd.operation=crypto.randomUUID();}
if(cmd.type==='spin'){cmd.operation=crypto.randomUUID();cmd.day=state.day;cmd.sequence=state.ticketSpent+1;}
if(cmd.type==='login'&&cmd.loginVersion===2){cmd.operation=crypto.randomUUID();cmd.loginCandidate=createLoginCandidate(state.loginNext,[.2,.5,.8]);}
if(cmd.type==='openChest'){cmd.sequence=state.chests.sequence+1;cmd.operation=crypto.randomUUID();cmd.candidate=chestCandidate(cmd.chestType,cmd.gameId,[],()=>.9);}
const result=transitionSpark(state,cmd,{uid:'ui-owner',now,festivalEnabled:true,fireflyEarned:state.festival.earnedTotal,letterEarned:state.letters.earned,ticketEarned:state.ticketEarned,loginSupportCounts:cmd.loginCandidate?.supports.map(()=>0)||[],sector:7,randomLetter:'M'});state=result.state;
result.appliedCoins=result.receipts.reduce((sum,item)=>sum+item.coins,0);await Promise.resolve();return result;
}`;
async function ready(page) {
  await page.route('**/js/liveops/service.js*',route=>route.fulfill({contentType:'text/javascript',body:fixture}));
  await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();
}
async function open(page,kind='missions') {
  await page.evaluate(async kind=>{window.eventsModal?.destroy();window.eventsModal=(await import('/js/liveops/presentation.js')).openLiveopsPage(kind);},kind);
  await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');
}
async function noOverflow(page) {
  const bad=await page.locator('.liveops').evaluate(root=>[...root.querySelectorAll('button,section,select,input')].filter(el=>el.getClientRects().length&&!el.closest('[role=tablist]')).filter(el=>el.getBoundingClientRect().right>innerWidth+1||el.getBoundingClientRect().left< -1).map(el=>el.outerHTML.slice(0,140)));
  expect(bad).toEqual([]);
  const small=await page.locator('.liveops button:visible').evaluateAll(nodes=>nodes.filter(el=>{const r=el.getBoundingClientRect(),min=el.closest('.liveops__set-choices')?36:el.closest('.liveops__recipe-reward,.liveops__letter-grid,.liveops__letter-tools,.liveops__tabs')?44:48,minWidth=el.closest('.liveops__letter-grid')?28:min;return r.width<minWidth-.5||r.height<min-.5;}).map(el=>({text:el.textContent,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
  expect(small).toEqual([]);
}
for(const width of [320,360,412,844,1024])test(`five skins and both pages fit ${width}`,async({page})=>{
  test.setTimeout(150000);const loginMetrics=[];await page.setViewportSize({width,height:width===1024?900:width===844?390:915});await ready(page);if(width===844)await page.evaluate(()=>document.documentElement.style.fontSize='24px');
  for(const skin of ['default','woodland','papercut','starship','storybook']){
    await page.evaluate(async skin=>{await(await import('/js/uiSkin.js')).selectUiSkin(skin);},skin);
    const shot=async name=>{if(width===412&&['default','storybook','papercut'].includes(skin)){mkdirSync('runtime/qa/events-visual-v2',{recursive:true});await page.screenshot({path:`runtime/qa/events-visual-v2/${skin}-${name}-412.png`,fullPage:true});}};
    await open(page);expect(await page.locator('.liveops__day').count()).toBe(7);await noOverflow(page);await shot('missions');
    const login=await page.locator('.liveops__login').evaluate(root=>({height:root.getBoundingClientRect().height,status:[...root.querySelectorAll('.liveops__day-status')].map(node=>({text:node.textContent,width:node.clientWidth,scrollWidth:node.scrollWidth,height:node.clientHeight,scrollHeight:node.scrollHeight}))}));
    for(const status of login.status){expect(status.scrollWidth).toBeLessThanOrEqual(status.width+1);expect(status.scrollHeight).toBeLessThanOrEqual(status.height+1);}
    loginMetrics.push({skin,...login});mkdirSync('runtime/qa/events-visual-v2',{recursive:true});writeFileSync(`runtime/qa/events-visual-v2/login-height-${width}.json`,JSON.stringify(loginMetrics,null,2));
    await page.getByRole('tab',{name:'Tuần này',exact:true}).click();await noOverflow(page);
    expect(await page.locator('.liveops__card').count()).toBe(6);
    await open(page,'events');await expect(page.locator('.liveops__wheel')).toBeVisible();await noOverflow(page);await shot('wheel');
    await page.getByRole('tab',{name:'Sưu tập chữ',exact:true}).click();expect(await page.locator('.liveops__letter-grid button').count()).toBe(17);await noOverflow(page);await shot('letters');
    await page.getByRole('tab',{name:'Sưu tập huy hiệu',exact:true}).click();await expect(page.getByText('Vòng 1',{exact:true})).toBeVisible();await noOverflow(page);await shot('festival');
  }
});
test('claims login, fixed recipes, sale confirmation, keyboard and shared four-card inventory',async({page})=>{
  test.setTimeout(60000);await ready(page);await open(page);
  await page.locator('[data-focus-key="login-day-2"]').click();await expect(page.locator('.liveops__day[data-state="received"]')).toHaveCount(3);await expect(page.locator('.liveops__day[data-state="available"]')).toHaveCount(0);
  for(const name of ['Nhận 5 Xu','Nhận 5 Xu','Nhận 10 Xu'])await page.getByRole('button',{name,exact:true}).first().click();
  await page.locator('[data-focus-key="claim-daily-bonus"]').click();await expect(page.locator('[data-focus-key="claim-daily-bonus"]')).toBeDisabled();
  const weekly=page.getByRole('tab',{name:'Tuần này',exact:true});await weekly.focus();await weekly.press('ArrowLeft');await expect(page.getByRole('tab',{name:'Hôm nay',exact:true})).toBeFocused();
  await open(page,'events');await page.getByRole('tab',{name:'Sưu tập chữ',exact:true}).click();
  await page.getByRole('tab',{name:'MEMORY MATCH',exact:true}).click();await page.getByRole('button',{name:'Đổi MEMORY MATCH',exact:true}).click();await expect(page.locator('.liveops__status')).toContainText('Rương Avatar');
  await page.getByRole('button',{name:/^Chữ A, \d+ chữ$/}).click();await page.locator('#letter-action-modal').getByRole('button',{name:'Bán',exact:true}).click();await page.getByRole('slider',{name:'Số chữ muốn bán',exact:true}).press('End'); await expect(page.locator('#letter-sale')).toContainText('Xu');await page.getByRole('button',{name:'Xác nhận bán',exact:true}).click();await expect(page.locator('#letter-sale')).toHaveCount(0);
  await page.getByRole('tab',{name:'Sưu tập huy hiệu',exact:true}).click();
  for(const points of [100,25,75,50])await page.locator('.liveops__card').filter({has:page.getByRole('heading',{name:points+' huy hiệu',exact:true})}).getByRole('button',{name:'Nhận',exact:true}).click();
  await expect(page.getByText('Vòng 2',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Xem quà & Kho rương',exact:true}).click();
  await expect(page.locator('.liveops__chest-grid > .liveops__card')).toHaveCount(4);
  await page.locator('[data-focus-key="details-avatar"]').click();await expect(page.locator('figure')).toHaveCount(12);await page.getByRole('combobox',{name:'Trò nhận hỗ trợ'}).selectOption('link-connect');await expect(page.locator('.liveops__support-pool')).toContainText('Đóng băng 30 giây');
  await page.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(page.locator('figure')).toHaveCount(12);
  await page.locator('[data-focus-key="confirm-open"]').click();await expect(page.locator('.liveops__status')).toContainText('Đã nhận');await expect(page.locator('.liveops__chest-grid > .liveops__card')).toHaveCount(4);
});
test('thirty mount/tab/close cycles release owners and timer; countdown does not poll',async({page})=>{
  test.setTimeout(60000);await ready(page);
  const sample=await page.evaluate(async()=>{
    const owner=(await import('/js/appPageLifecycle.js')).getAppPageScope(),before=owner.diagnostics();
    const {openLiveopsPage}=await import('/js/liveops/presentation.js');
    for(let i=0;i<30;i++){
      const modal=openLiveopsPage(i%2?'events':'missions');await Promise.resolve();await Promise.resolve();
      const tabs=modal.panel.querySelectorAll('[role="tab"]');for(const tab of tabs)tab.click();modal.destroy();
    }
    return {before,after:owner.diagnostics(),nodes:document.querySelectorAll('.liveops').length};
  });
  expect(sample.after).toEqual(sample.before);expect(sample.nodes).toBe(0);
  await page.clock.install();await open(page);const calls=await page.evaluate(()=>eventsFixture.calls);
  await page.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));document.dispatchEvent(new Event('visibilitychange'));});
  expect(await page.evaluate(()=>eventsFixture.calls)).toBe(calls);
  await page.evaluate(()=>eventsFixture.advance(86400000));await page.clock.fastForward(86400000);
  await expect.poll(()=>page.evaluate(()=>eventsFixture.calls)).toBe(calls+1);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));expect(await page.evaluate(()=>eventsFixture.calls)).toBe(calls+1);
  await page.setViewportSize({width:844,height:390});await page.evaluate(()=>document.documentElement.style.fontSize='24px');await noOverflow(page);
});
test('offline disables grants and thirty full-motion cycles keep DOM and listeners bounded',async({page,context})=>{
  test.setTimeout(60000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await open(page);
  await context.setOffline(true);await expect(page.locator('[data-focus-key="login-day-2"]')).toBeDisabled();
  const calls=await page.evaluate(()=>eventsFixture.calls);await context.setOffline(false);
  await expect.poll(()=>page.evaluate(()=>eventsFixture.calls)).toBe(calls+1);
  await page.evaluate(()=>{eventsModal.destroy();eventsModal=null;});
  const cdp=await context.newCDPSession(page);
  // Warm all participating owners before comparing retained nodes/listeners.
  await page.evaluate(async()=>{const {openLiveopsPage}=await import('/js/liveops/presentation.js');for(const kind of ['missions','events']){const modal=openLiveopsPage(kind);await new Promise(requestAnimationFrame);modal.destroy();}});
  await cdp.send('HeapProfiler.collectGarbage');const before=await cdp.send('Memory.getDOMCounters');
  const sample=await page.evaluate(async()=>{
    const durations=[],frames=[],tasks=[];const observer=new PerformanceObserver(list=>{for(const task of list.getEntries())tasks.push(task.duration);});observer.observe({entryTypes:['longtask']});
    const {openLiveopsPage}=await import('/js/liveops/presentation.js');let previous=performance.now();
    for(let cycle=0;cycle<30;cycle++){
      const start=performance.now(),modal=openLiveopsPage(cycle%2?'missions':'events');await Promise.resolve();await Promise.resolve();
      for(const tab of modal.panel.querySelectorAll('[role="tab"]'))tab.click();durations.push(performance.now()-start);
      await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-previous);previous=now;modal.destroy();
    }
    await new Promise(requestAnimationFrame);observer.disconnect();durations.sort((a,b)=>a-b);frames.sort((a,b)=>a-b);
    return {mountP95:durations[Math.floor(durations.length*.95)],frameP95:frames[Math.floor(frames.length*.95)],longTasks:tasks,cycles:30,platform:'desktop Chrome, fixture UI; not phone FPS'};
  });
  await cdp.send('HeapProfiler.collectGarbage');const after=await cdp.send('Memory.getDOMCounters');
  expect(after.jsEventListeners).toBeLessThanOrEqual(before.jsEventListeners+8);expect(after.nodes).toBeLessThanOrEqual(before.nodes+50);
  mkdirSync('runtime/qa/events',{recursive:true});writeFileSync('runtime/qa/events/performance.json',JSON.stringify({before,after,...sample},null,2));
});

test('cached progress cannot grant when reconnect status fails',async({page,context})=>{
  await ready(page);await open(page);await context.setOffline(true);
  await expect(page.locator('[data-focus-key="login-day-2"]')).toBeDisabled();
  await page.evaluate(()=>eventsFixture.fail=true);await context.setOffline(false);
  await expect(page.locator('.liveops__status')).toContainText('Chưa thể cập nhật');
  await expect(page.locator('[data-focus-key="login-day-2"]')).toBeDisabled();
  await page.evaluate(()=>eventsFixture.fail=false);await page.getByRole('button',{name:'Thử lại',exact:true}).click();
  await expect(page.locator('[data-focus-key="login-day-2"]')).toBeEnabled();
});

test('pending full-support chest locks type confirmation while other pools remain viewable',async({page})=>{
  await ready(page);await open(page,'events');await page.getByRole('button',{name:'Xem Kho rương',exact:true}).click();
  await page.locator('[data-focus-key="details-c"]').click();await page.evaluate(()=>eventsFixture.fullSupport=true);
  await page.locator('[data-focus-key="confirm-open"]').click();await expect(page.locator('.liveops__status')).toContainText('Kho hỗ trợ đã đầy');
  await page.locator('[data-focus-key="details-avatar"]').click();await expect(page.locator('[data-focus-key="confirm-open"]')).toBeDisabled();
  await expect(page.getByRole('combobox',{name:'Trò nhận hỗ trợ'})).toBeDisabled();
  await page.locator('[data-focus-key="details-c"]').click();await page.evaluate(()=>eventsFixture.fullSupport=false);
  await page.locator('[data-focus-key="confirm-open"]').click();await expect(page.locator('.liveops__last-result')).toContainText('Lần mở gần nhất:');
});

test('mission scroll restores while collection tabs keep one scrolling panel',async({page})=>{
  await page.setViewportSize({width:412,height:700});await ready(page);await open(page);
  const tabs=await page.evaluate(async()=>{
    const modal=eventsModal,body=modal.body;body.scrollTop=300;const before=body.scrollTop;
    modal.panel.querySelector('#missions-weekly').click();await new Promise(requestAnimationFrame);body.scrollTop=100;
    modal.panel.querySelector('#missions-daily').click();await new Promise(requestAnimationFrame);return {before,after:body.scrollTop};
  });
  expect(tabs.before).toBeGreaterThan(0);expect(tabs.after).toBe(tabs.before);
  await page.evaluate(async()=>{eventsModal.destroy();window.collectionModal=await(await import('/js/mainmenu.js')).showCollectionModal({gameId:'memory-match'});});
  await expect(page.locator('.achievement-collection .storybook-achievement-row').first()).toBeVisible();
  await page.getByRole('tab',{name:'Kho rương',exact:true}).click();
  await expect(page.locator('.liveops__chest-grid > .liveops__card')).toHaveCount(4);
  const collection=await page.locator('.collection-chest-panel').evaluate(panel=>{
    panel.scrollTop=panel.scrollHeight;return {top:panel.scrollTop,outer:collectionModal.body.scrollTop};
  });
  expect(collection.top).toBeGreaterThan(0);expect(collection.outer).toBe(0);
  await expect(page.locator('.collection-tabs')).toBeInViewport();
  await page.getByRole('tab',{name:'Thành tích',exact:true}).click();
  await expect(page.locator('.liveops--chests')).toHaveCount(0);
  await expect(page.locator('.achievement-collection .storybook-achievement-row').first()).toBeVisible();
});

test('offline keeps Play and login navigation available while grants stay locked',async({page,context})=>{
  await ready(page);await open(page);
  await page.evaluate(()=>{eventsFixture.state.daily.wins=0;eventsFixture.state.weekly.visits=0;});await context.setOffline(true);
  await expect(page.locator('[data-focus-key="login-day-2"]')).toBeDisabled();
  await expect(page.getByRole('button',{name:'Chơi',exact:true}).first()).toBeEnabled();
  await page.getByRole('tab',{name:'Tuần này',exact:true}).click();await expect(page.getByRole('button',{name:'Điểm danh',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Điểm danh',exact:true}).click();await expect(page.getByRole('tab',{name:'Hôm nay',exact:true})).toHaveAttribute('aria-selected','true');
});

test('achievement preview names the chest while legacy durable cosmetics retain their art',async({page})=>{
  await ready(page);await page.evaluate(async()=>{window.collectionModal=await(await import('/js/mainmenu.js')).showCollectionModal({gameId:'memory-match'});});
  const first=page.locator('.storybook-achievement-row__reward').first();await expect(first).toContainText('Rương Avatar');await expect(first.locator('.ui-icon--chest')).toHaveCount(1);
  const name=await page.evaluate(async()=>{
    collectionModal.destroy();const {gameState}=await import('/js/gameState.js'),{ACHIEVEMENT_ITEMS}=await import('/js/progression/achievementModel.js');
    const item=ACHIEVEMENT_ITEMS.find(item=>item.gameId==='memory-match'&&item.level===1);
    gameState.appearance.achievements.grants['memory-match:1']={itemId:item.id,catalogVersion:1,grantedAt:1,announced:false};
    window.collectionModal=await(await import('/js/mainmenu.js')).showCollectionModal({gameId:'memory-match'});return item.name;
  });
  await expect(page.locator('.storybook-achievement-row__reward').first()).toContainText(name);await expect(page.locator('.storybook-achievement-row__reward').first().locator('img')).toHaveCount(1);
});

test('dock screens retain one visible header wallet close and dock owner',async({page})=>{
  test.setTimeout(60000);await page.setViewportSize({width:412,height:915});await ready(page);
  mkdirSync('runtime/qa/events-visual-v2',{recursive:true});
  for(const skin of ['default','storybook','papercut']){
    await page.evaluate(async skin=>{await(await import('/js/uiSkin.js')).selectUiSkin(skin);},skin);
    await page.locator('[data-dock-action="missions"]:visible').click();
    await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');
    await expect(page.locator('.adventure-screen:visible')).toHaveCount(1);
    await expect(page.locator('.liveops-surface > .app-modal__header:visible')).toHaveCount(1);
    await expect(page.locator('.adventure-screen .app-wallet:visible')).toHaveCount(1);
    await expect(page.getByRole('button',{name:'Đóng, về trang chủ',exact:true})).toHaveCount(1);
    await expect(page.locator('.adventure-dock:visible')).toHaveCount(1);await noOverflow(page);
    await page.screenshot({path:`runtime/qa/events-visual-v2/${skin}-screen-missions-412.png`,fullPage:true});
    await page.setViewportSize({width:320,height:915});await noOverflow(page);await page.screenshot({path:`runtime/qa/events-visual-v2/${skin}-screen-missions-320.png`,fullPage:true});await page.setViewportSize({width:412,height:915});
    await page.locator('[data-dock-action="events"]:visible').click();
    await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');await noOverflow(page);
    await page.screenshot({path:`runtime/qa/events-visual-v2/${skin}-screen-wheel-412.png`,fullPage:true});
    for(const [tab,name]of [['Sưu tập chữ','letters'],['Sưu tập huy hiệu','festival']]){
      await page.getByRole('tab',{name:tab,exact:true}).click();await noOverflow(page);
      await page.screenshot({path:`runtime/qa/events-visual-v2/${skin}-screen-${name}-412.png`,fullPage:true});
    }
    await expect(page.locator('.adventure-screen:visible')).toHaveCount(1);await expect(page.locator('.adventure-screen .app-wallet:visible')).toHaveCount(1);await expect(page.locator('.adventure-dock:visible')).toHaveCount(1);
    if(skin==='default'){
      await page.setViewportSize({width:320,height:915});await page.getByRole('tab',{name:'Sưu tập chữ',exact:true}).click();await noOverflow(page);
      await page.screenshot({path:'runtime/qa/events-visual-v2/default-screen-letters-320.png',fullPage:true});
      await page.setViewportSize({width:844,height:390});await page.evaluate(()=>document.documentElement.style.fontSize='24px');await noOverflow(page);
      await page.screenshot({path:'runtime/qa/events-visual-v2/default-screen-letters-844-large.png',fullPage:true});
      await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width:412,height:915});
    }
    await page.getByRole('button',{name:'Đóng, về trang chủ',exact:true}).click();await expect(page.locator('.game-selector__choice').first()).toBeVisible();
  }
});

test('unknown festival keeps four milestones disabled without fabricating cycle or points',async({page})=>{
  await ready(page);await open(page,'events');
  await page.evaluate(()=>{eventsFixture.state.festival=undefined;});
  await page.getByRole('tab',{name:'Sưu tập huy hiệu',exact:true}).click();
  await expect(page.getByText('Hành trình huy hiệu',{exact:true})).toBeVisible();
  await expect(page.getByText('Vòng 1',{exact:true})).toHaveCount(0);
  await expect(page.locator('.liveops__festival-hero progress')).toHaveCount(0);
  await expect(page.locator('.liveops__festival-hero')).not.toContainText('0 huy hiệu');
  const claims=page.getByRole('button',{name:'Nhận',exact:true});await expect(claims).toHaveCount(4);
  for(const button of await claims.all())await expect(button).toBeDisabled();
});

test('lower mission bonus and letter actions remain reachable on the actual screen',async({page})=>{
  await page.setViewportSize({width:412,height:915});await ready(page);
  mkdirSync('runtime/qa/events-visual-v2',{recursive:true});
  await page.locator('[data-dock-action="missions"]:visible').click();await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');
  await page.locator('.liveops-surface .app-modal__body').evaluate(body=>{body.scrollTop=body.scrollHeight;});
  await page.screenshot({path:'runtime/qa/events-visual-v2/default-screen-missions-bottom-412.png',fullPage:true});
  await page.locator('[data-dock-action="events"]:visible').click();await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');
  await page.getByRole('tab',{name:'Sưu tập chữ',exact:true}).click();
  await page.locator('.liveops-surface .app-modal__body').evaluate(body=>{body.scrollTop=body.scrollHeight;});
  await page.screenshot({path:'runtime/qa/events-visual-v2/default-screen-letters-bottom-412.png',fullPage:true});
  await expect(page.getByRole('button',{name:'Bán chữ',exact:true})).toBeVisible();
});
