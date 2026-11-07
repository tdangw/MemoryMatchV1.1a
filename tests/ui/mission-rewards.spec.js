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
    const timer=await page.locator('.liveops__countdown').boundingBox(),login=await page.locator('.liveops__login').boundingBox();expect(timer.y+timer.height).toBeLessThanOrEqual(login.y);
    await expect(page.locator('.liveops__countdown')).toContainText('Làm mới sau:');
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
test('seven daily tiles show and grant their exact new rewards including the opened support pack',async({page})=>{
 test.setTimeout(60000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{eventsFixture.state.loginNext=0;for(const key of ['daily','weekly'])Object.assign(eventsFixture.state[key],{wins:0,matches:0,noHint:0,visits:0,claimed:[]});});
 for(let day=0;day<7;day++){
  if(day)await page.evaluate(()=>eventsFixture.advance(86400000));await open(page);
  await page.locator(`.liveops__day[data-focus-key="login-day-${day}"]`).click();
  if(day===6)await finishOpening(page);
  const toast=page.locator('.liveops-reward-feedback__toast');await expect(toast).toContainText(`${[10,10,15,15,20,25,50][day]} Xu`);
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
