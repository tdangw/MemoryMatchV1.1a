import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
let fixture=readFileSync('tests/ui/events-festival.spec.js','utf8').match(/const fixture = `([\s\S]*?)`;/)[1];
fixture="import {committedRewardsForTransition} from '/js/liveops/rewardFeedbackModel.js';\n"+fixture.replace('const result=transitionSpark(state,cmd','const previous=structuredClone(state);const result=transitionSpark(state,cmd').replace('state=result.state;','state=result.state;result.committedRewards=committedRewardsForTransition(previous,result);');
async function ready(page){await page.route('**/js/liveops/service.js*',route=>route.fulfill({contentType:'text/javascript',body:fixture}));await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();await page.evaluate(async()=>{(await import('/js/gameState.js')).gameState.settings.sound=false;});}
async function open(page,kind='missions'){await page.evaluate(async kind=>{window.missionModal?.destroy();window.missionModal=(await import('/js/liveops/presentation.js')).openLiveopsPage(kind);},kind);await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');}
async function finishOpening(page){await expect(page.locator('.wheel-gift-opening')).toBeVisible();await page.locator('.wheel-gift-opening').evaluate(node=>[...node.querySelectorAll('*')].flatMap(child=>child.getAnimations()).forEach(a=>a.finish()));await expect(page.locator('.wheel-gift-opening')).toHaveCount(0);}
test('mission and event tabs fit entirely; login tiles are direct locked controls and reset stays below tabs',async({page},info)=>{
 test.setTimeout(90000);await ready(page);
 for(const skin of ['default','woodland','papercut','starship','storybook'])for(const width of [320,412,844,1024]){
  await page.setViewportSize({width,height:width===844?390:915});await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);
  for(const kind of ['missions','events']){
   await open(page,kind);
   // Skin ornaments may extend past the border; the label itself must fit.
   const tabs=page.locator('.liveops__tabs'),geometry=await tabs.evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,children:[...node.children].map(child=>{const range=document.createRange();range.selectNodeContents(child);const text=range.getBoundingClientRect(),box=child.getBoundingClientRect();return {text:child.textContent,fits:text.left>=box.left&&text.right<=box.right,font:getComputedStyle(child).fontSize};})}));expect(geometry.scroll<=geometry.width+1&&geometry.children.every(child=>child.fits),`${skin}/${width}/${kind}: ${JSON.stringify(geometry)}`).toBe(true);
   if(kind==='missions'){
    await expect(page.locator('.liveops__status')).toBeEmpty();await expect(page.locator('.liveops__guidance,.liveops__login-action')).toHaveCount(0);
    await expect(page.locator('.liveops__day')).toHaveCount(7);await expect(page.locator('.liveops__day:enabled')).toHaveCount(1);await expect(page.locator('.liveops__day[data-state="locked"]:disabled')).toHaveCount(4);await expect(page.locator('.liveops__day-status')).toHaveText(['','','','','','','']);
    expect(await page.locator('.liveops__day-rewards').evaluateAll(nodes=>nodes.every(node=>node.scrollWidth<=node.clientWidth+1))).toBe(true);
    expect((await page.locator('.liveops__day-rewards').allTextContents()).every(text=>!/Xu|Memory|Link|Triple|Hỗ trợ/.test(text))).toBe(true);
    await expect(page.locator('.liveops__day-prize > .ui-icon')).toHaveCount(14);
    const timer=await page.locator('.liveops__countdown').boundingBox(),heading=await page.locator('.liveops__login .liveops__timed-heading').boundingBox();expect(timer.y).toBeGreaterThanOrEqual(heading.y);expect(timer.y+timer.height).toBeLessThanOrEqual(heading.y+heading.height+1);
    await expect(page.locator('.liveops__countdown')).toHaveAttribute('aria-label',/^Làm mới sau:/);
    if(width===412&&skin==='default')await page.screenshot({path:info.outputPath('missions-412.png')});
   }
  }
 }
});
test('mission counts sit inside bars and completed actions claim the displayed coin amount with loot and audio',async({page})=>{
 await page.addInitScript(()=>{window.missionAudio=[];HTMLMediaElement.prototype.play=function(){missionAudio.push(this.src.split('/').at(-1));return Promise.resolve();};});
 await ready(page);await page.evaluate(async()=>{(await import('/js/gameState.js')).gameState.settings.sound=true;});await page.emulateMedia({reducedMotion:'no-preference'});await open(page);
 await expect(page.locator('.liveops__mission-reward')).toHaveCount(0);await expect(page.locator('.liveops__mission-body h3').last()).toHaveText('Thắng không dùng gợi ý');
 const centered=await page.locator('.liveops__mission .liveops__progress-row').evaluateAll(nodes=>nodes.every(node=>{const bar=node.querySelector('progress').getBoundingClientRect(),count=node.querySelector('span').getBoundingClientRect();return Math.abs(bar.x+bar.width/2-count.x-count.width/2)<1&&Math.abs(bar.y+bar.height/2-count.y-count.height/2)<1;}));expect(centered).toBe(true);
 const claim=page.locator('[data-focus-key="mission-win-three"]');await expect(claim).toHaveText('5');await expect(claim.locator('.ui-icon--coin')).toHaveCount(1);await expect(claim).toHaveAttribute('aria-label','Nhận 5 Xu');await claim.click();
 await expect(page.locator('.liveops-reward-feedback__particle[data-reward-kind="coins"]')).toHaveCount(5);await expect(page.locator('.liveops-reward-feedback__toast')).toHaveText('Đã nhận 5 Xu');
 await page.locator('.liveops-reward-feedback__particle').evaluateAll(nodes=>nodes.forEach(node=>node.getAnimations().forEach(a=>a.finish())));await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
 expect(await page.evaluate(()=>missionAudio)).toEqual(expect.arrayContaining(['reward.ogg','coin_drop.mp3','coin-collect.mp3']));await expect(claim).toBeDisabled();
});
test('the no-hint mission and daily chest remain locked below three wins',async({page})=>{
 await ready(page);
 for(const count of [1,2,3]){
  await page.evaluate(count=>eventsFixture.state.daily.noHint=count,count);await open(page);
  await expect(page.locator('.liveops__mission').last().locator('.liveops__progress-row > span')).toHaveText(`${count}/3`);
  await expect(page.locator('[data-focus-key="mission-win-without-hint"]')).toHaveText(count<3?'Chơi':'10');
  if(count<3)await expect(page.locator('.liveops__bonus-art')).toBeDisabled();else await expect(page.locator('.liveops__bonus-art')).toBeEnabled();
 }
});
test('seven daily tiles show and grant their exact new rewards including the opened support pack',async({page})=>{
 test.setTimeout(60000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{eventsFixture.state.loginNext=0;for(const key of ['daily','weekly'])Object.assign(eventsFixture.state[key],{wins:0,matches:0,noHint:0,visits:0,claimed:[]});});
 for(let day=0;day<7;day++){
  if(day)await page.evaluate(()=>eventsFixture.advance(86400000));await open(page);
  await page.locator(`.liveops__day[data-focus-key="login-day-${day}"]`).click();
  if(day===6)await finishOpening(page);
  const toast=page.locator('.liveops-reward-feedback__toast');await expect(toast).toContainText(`${[10,10,15,15,20,25,50][day]} Xu`);
  await expect(page.locator('.liveops__status')).toBeEmpty();
  expect(await page.locator('.liveops-reward-feedback__particle[data-reward-kind="support"]').count()).toBe(day===6?3:1);
  await expect(page.locator('.liveops__day:enabled')).toHaveCount(0);
 }
});
test('daily and weekly chests unlock on completion before individual claims; opening is finite and replay stays clean',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await open(page);
 for(const [tab,key,tickets]of [['Hôm nay','daily',1],['Tuần này','weekly',2]]){
  await page.getByRole('tab',{name:tab,exact:true}).click();const chest=page.locator('.liveops__bonus-art');await expect(chest).toBeEnabled();await chest.click();await finishOpening(page);
  await expect(page.locator('.liveops-reward-feedback__toast')).toContainText(`${tickets} Vé quay`);await expect(chest).toBeDisabled();
  expect(await page.evaluate(key=>eventsFixture.state[key].claimed,key)).toEqual(['bonus']);
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');
 }
 await page.evaluate(()=>missionModal.destroy());await expect(page.locator('.wheel-gift-opening,.liveops-reward-feedback')).toHaveCount(0);
});
test('incomplete chest stays locked and closing or reducing motion during an opening leaves no detached animations',async({page})=>{
 await ready(page);await page.evaluate(()=>{eventsFixture.state.daily.wins=0;});await open(page);await expect(page.locator('.liveops__bonus-art')).toBeDisabled();
 await page.evaluate(()=>{eventsFixture.state.daily.wins=3;});await open(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('.liveops__bonus-art').click();await expect(page.locator('.wheel-gift-opening')).toBeVisible();await page.evaluate(()=>missionModal.destroy());await expect(page.locator('.wheel-gift-opening,.liveops-reward-feedback')).toHaveCount(0);
 await open(page);await page.getByRole('tab',{name:'Tuần này',exact:true}).click();await page.locator('.liveops__bonus-art').click();await expect(page.locator('.wheel-gift-opening')).toBeVisible();await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.wheel-gift-opening')).toHaveCount(0);await page.evaluate(()=>missionModal.destroy());
 expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target.closest('.wheel-gift-opening')).length)).toBe(0);
});

test('bonus states distinguish locked, eligible, failed claim and received in both tabs',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 for(const [tab,key,wins]of [['Hôm nay','daily',3],['Tuần này','weekly',12]]){
  await page.evaluate(key=>{eventsFixture.state[key].wins=0;eventsFixture.state[key].claimed=[];},key);await open(page);await page.getByRole('tab',{name:tab,exact:true}).click();
  const chest=page.locator('.liveops__bonus-art');await expect(chest).toHaveAttribute('data-state','locked');await expect(chest).toBeDisabled();await expect(chest.locator('.ui-icon--lock')).toHaveCount(1);await expect(chest.locator('.ui-icon--check')).toHaveCount(0);
  await page.evaluate(({key,wins})=>eventsFixture.state[key].wins=wins,{key,wins});await open(page);await page.getByRole('tab',{name:tab,exact:true}).click();
  await expect(chest).toHaveAttribute('data-state','available');await expect(chest).toBeEnabled();await expect(chest.locator('.liveops__bonus-state')).toHaveCount(0);
  await page.evaluate(()=>eventsFixture.fail=true);await chest.click();await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');await expect(chest).toHaveAttribute('data-state','available');await expect(chest.locator('.ui-icon--check')).toHaveCount(0);
  expect(await page.evaluate(key=>eventsFixture.state[key].claimed.includes('bonus'),key)).toBe(false);
  await page.evaluate(()=>{eventsFixture.fail=false;window.dispatchEvent(new Event('online'));});await expect(chest).toBeEnabled();await chest.click();await finishOpening(page);
  await expect(chest).toHaveAttribute('data-state','received');await expect(chest).toBeDisabled();await expect(chest.locator('.ui-icon--check')).toHaveCount(1);expect(await chest.evaluate(n=>Number(getComputedStyle(n).opacity))).toBeLessThan(1);
  await open(page);await page.getByRole('tab',{name:tab,exact:true}).click();await expect(chest).toHaveAttribute('data-state','received');expect(await page.evaluate(key=>eventsFixture.state[key].claimed.filter(id=>id==='bonus').length,key)).toBe(1);
 }
});

test('daily and weekly reward layout stays aligned across skins and viewports',async({page})=>{
 test.setTimeout(120000);await ready(page);
 for(const skin of ['default','woodland','papercut','starship','storybook'])for(const width of [320,412,1024]){
  await page.setViewportSize({width,height:915});await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);await open(page);
  for(const tab of ['Hôm nay','Tuần này']){
   await page.getByRole('tab',{name:tab,exact:true}).click();
   const metrics=await page.locator('.liveops__mission,.liveops__bonus').evaluateAll(rows=>rows.map(row=>{
    const bar=row.querySelector('progress').getBoundingClientRect(),reward=row.querySelector('.liveops__mission-action,.liveops__bonus-art').getBoundingClientRect();
    return {barX:bar.x,barWidth:bar.width,barHeight:bar.height,rewardX:reward.x,rewardWidth:reward.width,overflow:row.scrollWidth>row.clientWidth+1};
   }));
   for(const m of metrics){expect(m.overflow,`${skin}/${width}/${tab}`).toBe(false);expect(m.barHeight).toBe(16);expect(m.rewardWidth).toBe(64);expect(Math.abs(m.barX-metrics[0].barX)).toBeLessThan(2);expect(Math.abs(m.barWidth-metrics[0].barWidth)).toBeLessThan(2);expect(Math.abs(m.rewardX-metrics[0].rewardX)).toBeLessThan(2);}
   if(skin==='default'&&width===412)await page.screenshot({path:`runtime/qa/mission-${tab==='Hôm nay'?'daily':'weekly'}-412.png`});
  }
 }
});

test('countdowns populate immediately on every tab render and continue with the shared clock',async({page})=>{
 await ready(page);await page.clock.install();await open(page);
 const value=page.locator('.liveops__countdown [data-countdown-value]');
 for(let i=0;i<12;i++){
  const weekly=i%2===1;await page.getByRole('tab',{name:weekly?'Tuần này':'Hôm nay',exact:true}).click();
  expect(await value.textContent()).toMatch(/^\d{2,3}:\d{2}$/);
  await expect(page.locator('.liveops__timed-heading .liveops__countdown')).toHaveAttribute('data-period',weekly?'weekly':'daily');
 }
 await page.getByRole('tab',{name:'Hôm nay',exact:true}).click();const before=await value.textContent();
 await page.clock.fastForward(61000);expect(await value.textContent()).not.toBe(before);
 await page.getByRole('tab',{name:'Tuần này',exact:true}).click();expect(await value.textContent()).toMatch(/^\d{2,3}:\d{2}$/);
});

test('weekly journey uses chest milestones with actual automatically granted reward states',async({page})=>{
 await ready(page);
 await page.evaluate(()=>{eventsFixture.state.event.points=20;eventsFixture.state.event.claimed=[20];});await open(page);await page.getByRole('tab',{name:'Tuần này',exact:true}).click();
 const journey=page.locator('.liveops__journey');await expect(journey.locator('p')).toHaveCount(0);await expect(journey.locator('[data-chest-type="coins"]')).toHaveCount(3);await expect(journey.locator('.liveops__festival-point')).toHaveText(['20','50','80']);
 await expect(journey.locator('.liveops__journey-amount,h3')).toHaveCount(0);await expect(journey).not.toContainText('Xu');
 for(const points of [20,49,50,79,80,100]){
  await page.evaluate(points=>eventsFixture.state.event.points=points,points);await open(page);await page.getByRole('tab',{name:'Tuần này',exact:true}).click();
  const milestones=journey.locator('.liveops__journey-reward');
  for(const [i,threshold]of [20,50,80].entries()){
   await expect(milestones.nth(i)).toHaveAttribute('data-state',points>=threshold?'claimed':'locked');
   await expect(milestones.nth(i).locator('.ui-icon--check')).toHaveCount(points>=threshold?1:0);await expect(milestones.nth(i).locator('.ui-icon--lock')).toHaveCount(points<threshold?1:0);
  }
  await expect(journey.getByRole('progressbar')).toHaveAttribute('aria-valuenow',String(Math.min(points,80)));
 }
});

test('timed headings and journey rewards fit all mission skins and screen sizes',async({page})=>{
 test.setTimeout(120000);await ready(page);
 for(const skin of ['default','woodland','papercut','starship','storybook'])for(const size of [{width:320,height:740},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]){
  await page.setViewportSize(size);await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);await open(page);
  for(const tab of ['Hôm nay','Tuần này']){
   await page.getByRole('tab',{name:tab,exact:true}).click();
   const metrics=await page.locator('.liveops__timed-heading').evaluate(header=>{const title=header.querySelector('h3').getBoundingClientRect(),timer=header.querySelector('.liveops__countdown').getBoundingClientRect(),value=header.querySelector('[data-countdown-value]'),box=header.getBoundingClientRect();return {overlap:title.right>timer.left+1,overflow:timer.right>box.right+1||header.scrollWidth>header.clientWidth+1,valueOverflow:value.scrollWidth>value.clientWidth+1,text:value.textContent};});
   expect(metrics.overlap,`${skin}/${size.width}/${tab}`).toBe(false);expect(metrics.overflow).toBe(false);expect(metrics.valueOverflow).toBe(false);expect(metrics.text).toMatch(/^\d{2,3}:\d{2}$/);
   if(tab==='Tuần này')expect(await page.locator('.liveops__journey').evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);
   if(skin==='default'&&size.width===412)await page.screenshot({path:`runtime/qa/mission-timer-${tab==='Hôm nay'?'daily':'weekly'}.png`});
  }
 }
});

test('weekly tasks show their own prizes, claim once and retain the shared chest',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await open(page);await page.getByRole('tab',{name:'Tuần này',exact:true}).click();
 const catalog=[['weekly-wins',20],['weekly-matches',20],['weekly-no-hint',10],['weekly-visits',10]];
 await expect(page.locator('.liveops__bonus-art')).toBeEnabled();
 for(const [id,coins]of catalog){
  const claim=page.locator(`[data-focus-key="mission-${id}"]`);await expect(claim).toHaveAttribute('aria-label',`Nhận ${coins} Xu`);await expect(claim).toHaveText(String(coins));
  const before=await page.evaluate(()=>eventsFixture.calls);await claim.evaluate(n=>{n.click();n.click();});await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');
  await expect(claim).toHaveText('Đã nhận');await expect(claim).toBeDisabled();expect(await page.evaluate(()=>eventsFixture.calls)).toBe(before+1);
  expect(await page.evaluate(id=>eventsFixture.state.weekly.claimed.filter(x=>x===id).length,id)).toBe(1);await expect(page.locator('.wheel-gift-opening')).toHaveCount(0);
 }
 await expect(page.locator('.liveops__bonus-art')).toBeEnabled();expect(await page.evaluate(()=>eventsFixture.state.weekly.claimed.includes('bonus'))).toBe(false);
 await page.locator('.liveops__bonus-art').click();await finishOpening(page);expect(await page.evaluate(()=>eventsFixture.state.tickets)).toBe(2);
 await open(page);await page.getByRole('tab',{name:'Tuần này',exact:true}).click();
 for(const [id]of catalog)await expect(page.locator(`[data-focus-key="mission-${id}"]`)).toBeDisabled();
 await expect(page.locator('.liveops__bonus-art')).toHaveAttribute('data-state','received');
});

for(const touch of [false,true])test(`chest info is separate from claiming, works in every state and leaves layout unchanged (${touch?'touch':'mouse'})`,async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:320,height:740},hasTouch:touch}),page=await context.newPage();
 try{
  await ready(page);
  const reveal=async button=>{if(touch)await button.tap();else await button.hover();};
  for(const state of ['available','locked','received']){
   await page.evaluate(state=>{eventsFixture.state.daily.wins=state==='locked'?0:3;eventsFixture.state.daily.claimed=state==='received'?['bonus']:[];},state);await open(page);
   const chest=page.locator('.liveops__bonus-art'),info=page.getByRole('button',{name:'Thông tin rương nhiệm vụ ngày',exact:true}),tip=page.locator('#app-tooltip');
   const before=await page.evaluate(()=>({calls:eventsFixture.calls,state:JSON.stringify(eventsFixture.state),width:document.querySelector('.liveops__bonus-art').offsetWidth,height:document.querySelector('.liveops__bonus-art').offsetHeight}));
   await reveal(info);await expect(tip).toBeVisible();await expect(tip).toHaveText('10 Xu và 1 Vé quay');
   const after=await page.evaluate(()=>({calls:eventsFixture.calls,state:JSON.stringify(eventsFixture.state),width:document.querySelector('.liveops__bonus-art').offsetWidth,height:document.querySelector('.liveops__bonus-art').offsetHeight}));expect(after).toEqual(before);
   await expect(chest).toHaveAttribute('data-state',state);expect(await page.locator('.liveops__bonus-art button').count()).toBe(0);
  }
  await page.getByRole('tab',{name:'Tuần này',exact:true}).click();await expect(page.locator('#app-tooltip')).toBeHidden();
  const calls=await page.evaluate(()=>eventsFixture.calls);await reveal(page.getByRole('button',{name:'Thông tin rương nhiệm vụ tuần',exact:true}));await expect(page.locator('#app-tooltip')).toHaveText('50 Xu và 2 Vé quay');
  for(const [points,coins]of [[20,5],[50,10],[80,10]]){await reveal(page.getByRole('button',{name:`Thông tin rương mốc ${points}`,exact:true}));await expect(page.locator('#app-tooltip')).toBeVisible();await expect(page.locator('#app-tooltip')).toHaveText(`${coins} Xu`);}
  expect(await page.evaluate(()=>eventsFixture.calls)).toBe(calls);
  if(!touch)await page.screenshot({path:'runtime/qa/mission-chest-info-320.png'});
  await page.evaluate(()=>missionModal.destroy());await expect(page.locator('#app-tooltip')).toBeHidden();await expect(page.locator('#app-tooltip')).toHaveCount(1);
  for(let i=0;i<3;i++){
   await open(page);const info=page.getByRole('button',{name:'Thông tin rương nhiệm vụ ngày',exact:true});await info.focus();await info.press('Enter');await expect(page.locator('#app-tooltip')).toBeVisible();
   await page.evaluate(()=>missionModal.destroy());await expect(page.locator('#app-tooltip')).toBeHidden();
  }
 }finally{await context.close();}
});
