import {test,expect} from '@playwright/test';
const fixture=`
import {transitionSpark} from '/js/liveops/sparkModel.js';
import {createWheelCandidate,WHEEL_SLOTS} from '/js/liveops/wheelRewards.js';
import {committedRewardsForTransition,committedWheelRewardsForTransition} from '/js/liveops/rewardFeedbackModel.js';
import {gameState} from '/js/gameState.js';
import {creditChestSupport} from '/js/liveops/supportInventory.js';
let now=Date.now(),state,owned=[],lastCommand=null,recovery=null;
function reset(){state=transitionSpark(null,{type:'status'},{uid:'wheel-ui',now,festivalEnabled:true}).state;state.tickets=1;state.ticketEarned=1;owned=[];lastCommand=null;recovery=null;}
reset();
window.wheelFixture={sector:0,full:false,replay:false,legacy:false,fail:false,delay:false,calls:[],get state(){return state},reset,rollover(){state.week-=7;state.weekly={wins:12,matches:120,noHint:3,visits:3,claimed:[]};},get owned(){return owned}};
export const bindLiveopsAccount=()=>()=>{};export const trustedRewardPeriod=()=>null;
export async function requestLiveops(command={type:'status'}){
 wheelFixture.calls.push(command.type);if(wheelFixture.fail)throw Error('network');if(wheelFixture.delay)await new Promise(resolve=>wheelFixture.resolve=resolve);
 let cmd={...command};if(cmd.type==='spin'){
  if(wheelFixture.replay&&lastCommand)cmd={...lastCommand};else{
   cmd.operation=crypto.randomUUID();cmd.day=state.day;cmd.sequence=state.ticketSpent+1;if(cmd.source==='ad'){cmd.earned=true;cmd.ordinal=state.spins.ads.length+1;}
   if(!wheelFixture.legacy){const first=WHEEL_SLOTS.slice(0,wheelFixture.sector).reduce((n,s)=>n+s.weight,0);cmd.wheelVersion=2;cmd.wheelCandidate=createWheelCandidate([(first+.01)/100,.2,.2,.2,.2,.2],owned);}
   lastCommand=structuredClone(cmd);
  }
 }
 const previous=structuredClone(state),result=transitionSpark(state,cmd,{uid:'wheel-ui',now,festivalEnabled:true,fireflyEarned:state.festival.earnedTotal,ticketEarned:state.ticketEarned,letterEarned:state.letters.earned,ownedWheelItemIds:owned,supportCount:wheelFixture.full?9999:0,sector:7});state=result.state;
 for(const receipt of result.receipts){gameState.coins+=receipt.coins;if(receipt.acquisition)owned.push(...receipt.acquisition.items);if(receipt.support)creditChestSupport(gameState.progress,receipt.support);}
 result.committedRewards=committedRewardsForTransition(previous,result);result.committedWheelRewards=committedWheelRewardsForTransition(result);result.appliedCoins=result.receipts.reduce((n,r)=>n+r.coins,0);if(wheelFixture.loseResponse&&command.type==='spin'){wheelFixture.loseResponse=false;recovery={prizes:result.committedWheelRewards,wheel:result.wheelReward};throw Error('response lost');}if(command.type==='status'&&recovery){result.committedWheelRewards=recovery.prizes;result.wheelReward=recovery.wheel;recovery=null;}return result;
}`;
const ads=`import {requestLiveops} from '/js/liveops/service.js';export const rewardedSpinAvailable=()=>true;export const requestRewardedSpin=()=>requestLiveops({type:'spin',source:'ad',earned:true});`;
async function ready(page){
 await page.route('**/js/liveops/service.js*',r=>r.fulfill({contentType:'text/javascript',body:fixture}));await page.route('**/js/ads/rewarded.js*',r=>r.fulfill({contentType:'text/javascript',body:ads}));
 await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();await page.evaluate(async()=>{(await import('/js/gameState.js')).gameState.settings.sound=false;});await open(page);
}
async function open(page){await page.evaluate(async()=>{window.wheelModal?.destroy();window.wheelModal=(await import('/js/liveops/presentation.js')).openLiveopsPage('events');});await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');}
async function reset(page,sector=0){await page.evaluate(sector=>{wheelFixture.reset();wheelFixture.sector=sector;wheelFixture.full=false;wheelFixture.replay=false;wheelFixture.legacy=false;wheelFixture.fail=false;},sector);await open(page);}
async function finishSpin(page){await page.locator('.liveops__rotor').evaluate(node=>node.getAnimations().forEach(animation=>animation.finish()));}
async function finishOpening(page){await page.locator('.wheel-gift-opening').evaluate(node=>[...node.querySelectorAll('*')].flatMap(child=>child.getAnimations()).forEach(animation=>animation.finish()));await expect(page.locator('.wheel-gift-opening')).toHaveCount(0);}
async function finishRewards(page){await page.locator('.liveops-reward-feedback__particle').evaluateAll(nodes=>nodes.forEach(node=>node.getAnimations().forEach(animation=>animation.finish())));await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');}
const center=page=>page.locator('.liveops__spin-primary');

test('ten slots reuse paired chest images for eight named chests in five skins and four viewports',async({page},info)=>{
 test.setTimeout(120000);await ready(page);
 for(const skin of ['default','woodland','papercut','starship','storybook'])for(const viewport of [{width:320,height:740},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]){
  await page.setViewportSize(viewport);await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);await reset(page);
  await expect(page.locator('.liveops__sector')).toHaveCount(10);await expect(page.locator('.liveops__sector .wheel-gift-art')).toHaveCount(8);await expect(page.locator('.liveops__sector > .ui-icon--coin')).toHaveCount(2);
  await expect(page.locator('[data-wheel-sector="2"]')).toContainText('Rương Xu');
  const images=await page.locator('.liveops__sector .wheel-gift__image').evaluateAll(async nodes=>{await Promise.all(nodes.map(node=>node.decode()));return nodes.map(node=>({src:node.src,width:node.naturalWidth}));});expect(images).toHaveLength(16);expect(images.every(image=>image.width>0&&image.src.includes('chest'))).toBe(true);
  expect(new Set(images.filter((_,index)=>index%2===0).map(image=>image.src)).size).toBe(4);
  const mini=page.locator('.liveops__letter-mini');await expect(mini.locator('.liveops__letter-slots')).toHaveCount(4);await expect(mini.locator('h3,strong,button')).toHaveCount(0);
  expect(await mini.evaluate(node=>node.getBoundingClientRect().height)).toBeLessThan(130);
  expect(await mini.evaluate(node=>[...node.children].every(row=>{const cells=[...row.querySelectorAll('[data-space="false"]')];return cells.every(cell=>Math.abs(cell.getBoundingClientRect().top-cells[0].getBoundingClientRect().top)<1)&&row.scrollWidth<=row.clientWidth+1;}))).toBe(true);
  const bad=await page.locator('.liveops__wheel').evaluate(root=>[...root.querySelectorAll('.liveops__sector,.liveops__spin-primary')].filter(node=>{const r=node.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(node=>node.textContent));expect(bad).toEqual([]);
  const paths=await page.locator('.liveops__sector .wheel-gift-art').evaluateAll(nodes=>nodes.map(node=>node.querySelector('.wheel-gift__badge .ui-icon').classList.value));expect(new Set(paths).size).toBe(8);
  if(viewport.width===412&&['default','storybook'].includes(skin))await page.screenshot({path:info.outputPath(`${skin}-wheel-412.png`)});
 }
});

test('all ten outcomes reveal only their actual reward after the wheel stops, with finite opening and bounded particles',async({page})=>{
 test.setTimeout(120000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 for(let sector=0;sector<10;sector++){
  await reset(page,sector);await center(page).click();await expect(page.locator('.liveops-reward-feedback,.wheel-gift-opening')).toHaveCount(0);await expect.poll(()=>page.locator('.liveops__rotor').evaluate(node=>node.getAnimations().length)).toBe(1);
  await finishSpin(page);
  if(sector>=2){await expect(page.locator('.wheel-gift-opening')).toBeVisible();await expect(page.locator('.wheel-gift-opening img')).toHaveCount(2);await finishOpening(page);}
  await expect(page.locator('.liveops-reward-feedback__toast')).toBeVisible();
  const toast=await page.locator('.liveops-reward-feedback__toast').boundingBox(),viewport=page.viewportSize();expect(Math.abs(toast.y+toast.height/2-viewport.height/2)).toBeLessThan(2);
  const expected=await page.evaluate(async()=>{const receipt=wheelFixture.state.spins.free,wheel=receipt.wheel;if(wheel.kind==='coins')return wheel.coins+' Xu';if(wheel.kind==='support')return (await import('/js/liveops/chestConfig.js')).CHEST_SUPPORTS[wheel.gameId].find(item=>item.key===wheel.key).label;return (await import('/js/liveops/wheelCatalog.js')).wheelItem(wheel.itemId).name;});
  await expect(page.locator('.liveops-reward-feedback__toast')).toContainText(expected);expect(await page.locator('.liveops-reward-feedback__particle').count()).toBeLessThanOrEqual(44);expect(await page.locator('.liveops-reward-feedback__particle[data-reward-kind="coins"]').count()).toBeLessThanOrEqual(32);await finishRewards(page);
 }
});

test('center keeps free then ticket then ad; a full support chest is held and claimed once without another spin',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'reduce'});
 for(const [name,spent]of [['Quay miễn phí',0],['Dùng 1 vé',1],['Xem quảng cáo · Thêm 1 lượt',1]]){
  await expect(center(page)).toHaveAttribute('aria-label',name);await center(page).click();await expect(page.locator('.liveops-reward-feedback__toast')).toContainText('5 Xu');await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);expect(await page.evaluate(()=>wheelFixture.state.ticketSpent)).toBe(spent);
 }
 expect(await page.evaluate(()=>wheelFixture.state.spins.ads.length)).toBe(1);
 await reset(page,9);await page.evaluate(()=>wheelFixture.full=true);await center(page).click();await expect(center(page)).toHaveAttribute('aria-label','Nhận quà');await expect(page.locator('.liveops__wheel-pending')).toContainText('đang được giữ');await expect(page.locator('.liveops-reward-feedback,.wheel-gift-opening')).toHaveCount(0);
 const pending=await page.evaluate(()=>structuredClone(wheelFixture.state.pendingWheel));await center(page).click();await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');expect(await page.evaluate(()=>wheelFixture.state.pendingWheel)).toEqual(pending);await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
 await page.evaluate(()=>wheelFixture.full=false);await center(page).click();await expect(page.locator('.liveops-reward-feedback__toast')).toContainText('Memory Match');await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);expect(await page.evaluate(()=>wheelFixture.state.pendingWheel)).toBeNull();expect(await page.evaluate(()=>wheelFixture.state.ticketSpent)).toBe(0);expect(await page.evaluate(()=>wheelFixture.calls.filter(type=>type==='spin').length)).toBe(4);
});

test('replay and reconciliation never fake an extra reward; legacy receipt never uses a ten-slot angle',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>wheelFixture.rollover());await center(page).click();await expect(page.locator('.liveops-reward-feedback__toast')).toHaveText('Đã nhận 5 Xu');await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
 await page.evaluate(()=>wheelFixture.replay=true);await center(page).click();await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');await expect(page.locator('.liveops-reward-feedback,.wheel-gift-opening')).toHaveCount(0);expect(await page.locator('.liveops__rotor').evaluate(node=>node.getAnimations().length)).toBe(0);
 await reset(page);await page.evaluate(()=>wheelFixture.legacy=true);await page.emulateMedia({reducedMotion:'no-preference'});await center(page).click();await expect(page.locator('.liveops-reward-feedback__toast')).toHaveText('Đã nhận 25 Xu');expect(await page.locator('.liveops__rotor').evaluate(node=>node.getAnimations().length)).toBe(0);await expect(page.locator('.liveops__rotor')).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');await finishRewards(page);
});

test('hidden and reduced changes finish the wheel and opening; twenty interrupted owners release all feedback',async({page})=>{
 test.setTimeout(120000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 await reset(page,4);await center(page).click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');await expect(page.locator('.wheel-gift-opening')).toHaveCount(0);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
 await reset(page,4);await center(page).click();await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');await expect(page.locator('.wheel-gift-opening')).toHaveCount(0);await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(let i=0;i<20;i++){
  await reset(page,4);await center(page).click();if(i%2){await finishSpin(page);await expect(page.locator('.wheel-gift-opening')).toBeVisible();}
  await page.evaluate(()=>wheelModal.destroy());await expect(page.locator('.wheel-gift-opening,.liveops-reward-feedback,.liveops')).toHaveCount(0);
 }
 expect(await page.evaluate(()=>document.getAnimations().filter(animation=>animation.effect?.target.closest('.wheel-gift-opening,.liveops__rotor,.liveops__pointer,.liveops-reward-feedback')).length)).toBe(0);
});

test('ticker follows sector crossings and spin audio stops with the rotor or page owner',async({page})=>{
 await page.addInitScript(()=>{window.spinAudio=[];HTMLMediaElement.prototype.play=function(){if(this.src.includes('wheel-spin.mp3'))spinAudio.push('play');return Promise.resolve();};HTMLMediaElement.prototype.pause=function(){if(this.src.includes('wheel-spin.mp3'))spinAudio.push('pause');};});
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 for(const interrupt of [false,true]){
  await reset(page);await page.evaluate(async()=>{(await import('/js/gameState.js')).gameState.settings.sound=true;spinAudio.length=0;});await center(page).click();
  const pointer=page.locator('.liveops__pointer');await expect.poll(()=>pointer.evaluate(node=>node.getAnimations().length)).toBe(1);
  const frames=await pointer.evaluate(node=>node.getAnimations()[0].effect.getKeyframes());expect(frames.length).toBeLessThanOrEqual(202);expect(frames.some(frame=>frame.transform==='rotate(-38deg)')).toBe(true);expect(frames.some(frame=>frame.transform==='rotate(8deg)')).toBe(true);
  expect(await page.evaluate(()=>spinAudio.filter(cue=>cue==='play').length)).toBe(1);
  await page.evaluate(()=>window.dispatchEvent(new Event('offline')));expect(await pointer.evaluate(node=>node.getAnimations().length)).toBe(1);
  if(interrupt)await page.evaluate(()=>wheelModal.destroy());else await finishSpin(page);
  await expect.poll(()=>page.evaluate(()=>spinAudio.filter(cue=>cue==='pause').length)).toBe(1);
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target.classList.contains('liveops__pointer')).length)).toBe(0);
 }
});

test('rules show current probabilities, chest names, instant opening and owned conversion',async({page})=>{
 await ready(page);await page.getByRole('button',{name:'Thể lệ vòng quay',exact:true}).click();const rules=page.locator('#wheel-rules-modal');await expect(rules).toContainText('Rương Xu: 15%');await expect(rules).toContainText('Rương Hỗ trợ: 10%');await expect(rules).toContainText('Rương mở ngay sau khi quay');await expect(rules).toContainText('100 Xu');await expect(rules).not.toContainText('12,5%');await expect(rules).not.toContainText('Giftbox');
});


test('a confirmed lost response is presented once on status without re-spinning or granting twice',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await reset(page,2);
 await page.evaluate(()=>wheelFixture.loseResponse=true);await center(page).click();await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');
 const receipt=await page.evaluate(()=>structuredClone(wheelFixture.state.spins.free));await expect(page.locator('.liveops-reward-feedback,.wheel-gift-opening')).toHaveCount(0);
 await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.locator('.wheel-gift-opening')).toBeVisible();expect(await page.locator('.liveops__rotor').evaluate(node=>node.getAnimations().length)).toBe(0);await finishOpening(page);await expect(page.locator('.liveops-reward-feedback__toast')).toHaveText(`Đã nhận ${receipt.coins} Xu`);await finishRewards(page);
 await open(page);await expect(page.locator('.liveops-reward-feedback,.wheel-gift-opening')).toHaveCount(0);expect(await page.evaluate(()=>wheelFixture.calls.filter(type=>type==='spin').length)).toBe(1);expect(await page.evaluate(()=>wheelFixture.state.spins.free)).toEqual(receipt);
});
