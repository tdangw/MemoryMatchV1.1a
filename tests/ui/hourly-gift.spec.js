import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const fixture=`
import {transitionSpark} from '/js/liveops/sparkModel.js';
import {creditChestSupport} from '/js/liveops/supportInventory.js';
import {gameState} from '/js/gameState.js';
import {HOURLY_GIFT_MS} from '/js/liveops/hourlyGift.js';
import {publishHourlyGiftView} from '/js/liveops/hourlyGiftViewState.js';
let offset=0,now=Date.now(),state=transitionSpark(null,{type:'status'},{uid:'gift-test',now}).state;
window.hourlyFixture={kind:'coins',coins:5,gameId:'memory-match',key:'hint',claims:0,fail:false,delay:false,advance(ms=HOURLY_GIFT_MS){offset+=ms;now=Date.now()+offset;publishHourlyGiftView({state,serverNow:now});}};
export const bindLiveopsAccount=()=>()=>{};
export const trustedRewardPeriod=()=>null;
export async function requestLiveops(command={type:'status'}){
 if(hourlyFixture.fail)throw Error('network');
 if(hourlyFixture.delay)await new Promise(resolve=>hourlyFixture.resolve=resolve);
 now=Date.now()+offset;const cmd={...command};
 if(cmd.type==='claimHourlyGift'){hourlyFixture.claims++;cmd.operation=crypto.randomUUID();cmd.sequence=(state.hourlyGift?.sequence||0)+1;cmd.candidate=hourlyFixture.kind==='support'?{kind:'support',coins:0,gameId:hourlyFixture.gameId,key:hourlyFixture.key}:{kind:hourlyFixture.kind,coins:hourlyFixture.kind==='coins'?hourlyFixture.coins:0,gameId:null,key:null,...(hourlyFixture.kind==='ticket'?{tickets:10}:hourlyFixture.kind==='chest'?{chestType:hourlyFixture.chestType}:{})};}
 const result=transitionSpark(state,cmd,{uid:'gift-test',now});state=result.state;
 for(const receipt of result.receipts){gameState.coins+=receipt.coins;if(receipt.support)creditChestSupport(gameState.progress,receipt.support);}
 return result;
}`;
async function ready(page){await page.route('**/js/liveops/service.js*',route=>route.fulfill({contentType:'text/javascript',body:fixture}));await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();await page.evaluate(async()=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));}
async function advance(page){await page.evaluate(()=>hourlyFixture.advance());await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeEnabled();await expect(page.locator('.adventure-gift-countdown')).toHaveText('');await expect(page.locator('.adventure-gift-ready-dot')).toBeVisible();}
async function indicatorBounds(page){
 const geometry=await page.getByRole('button',{name:'Quà tặng',exact:true}).evaluate(control=>{
  const button=control.getBoundingClientRect(),dot=control.querySelector('.adventure-gift-ready-dot').getBoundingClientRect();
  return {button:{left:button.left,right:button.right,top:button.top,bottom:button.bottom},dot:{left:dot.left,right:dot.right,top:dot.top,bottom:dot.bottom}};
 });
 expect(geometry.dot.left).toBeGreaterThanOrEqual(geometry.button.left);expect(geometry.dot.right).toBeLessThanOrEqual(geometry.button.right);
 expect(geometry.dot.top).toBeGreaterThanOrEqual(geometry.button.top);expect(geometry.dot.bottom).toBeLessThanOrEqual(geometry.button.bottom);
}
async function rewardCard(page,width,height){
 const metrics=await page.locator('.hourly-gift-reveal').evaluate(card=>{
  const rgba=color=>{const values=color.match(/[\d.]+/g).map(Number);return [values[0],values[1],values[2],values[3]??1];};
  const composite=(top,bottom)=>{const a=top[3]+bottom[3]*(1-top[3]);return [0,1,2].map(i=>(top[i]*top[3]+bottom[i]*bottom[3]*(1-top[3]))/a).concat(a);};
  const background=node=>{const chain=[];for(let n=node;n;n=n.parentElement)chain.unshift(rgba(getComputedStyle(n).backgroundColor));return chain.reduce((base,color)=>composite(color,base),[255,255,255,1]);};
  const luminance=color=>color.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  const contrast=node=>{const bg=background(node),fg=composite(rgba(getComputedStyle(node).color),bg),a=luminance(bg),b=luminance(fg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
  const title=card.querySelector('.hourly-gift-reveal__title'),label=card.querySelector('.hourly-gift__result strong'),rect=card.getBoundingClientRect(),text=label.getBoundingClientRect();
  return {title:Boolean(title),background:getComputedStyle(card).backgroundColor,labelHeight:text.height,label:label.textContent,labelContrast:contrast(label),x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom,textLeft:text.left,textRight:text.right,overflow:card.scrollWidth>card.clientWidth};
 });
 expect(metrics.title).toBe(false);expect(metrics.background).toBe('rgba(0, 0, 0, 0)');expect(metrics.labelHeight).toBeLessThanOrEqual(18);expect(metrics.label).toBe('5 Xu');expect(metrics.labelContrast).toBeGreaterThanOrEqual(4.5);
 expect(metrics.x).toBeGreaterThanOrEqual(0);expect(metrics.y).toBeGreaterThanOrEqual(0);expect(metrics.right).toBeLessThanOrEqual(width);expect(metrics.bottom).toBeLessThanOrEqual(height);expect(metrics.textLeft).toBeGreaterThanOrEqual(metrics.x);expect(metrics.textRight).toBeLessThanOrEqual(metrics.right);expect(metrics.overflow).toBe(false);
}
async function open(page){await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await expect(page.getByRole('button',{name:'Mở quà',exact:true})).toBeEnabled();}
for(const [width,height] of [[320,640],[412,915],[844,390]])test(`hourly gift minimal popup and countdown fit ${width}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height});await ready(page);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const skin of ['default','woodland','papercut','starship','storybook']){
  const captureReward=width===412&&['default','storybook'].includes(skin);await page.emulateMedia({reducedMotion:captureReward?'no-preference':'reduce'});await page.evaluate(async name=>(await import('/js/uiSkin.js')).selectUiSkin(name),skin);await indicatorBounds(page);await open(page);const popup=page.locator('#hourly-gift-modal');
  await expect(popup.locator('h2')).toHaveText('Quà tặng bất ngờ');await expect(popup.getByRole('button',{name:'Mở quà',exact:true})).toHaveCSS('color','rgb(255, 251, 220)');await expect(popup.locator('.app-modal__body button')).toHaveCount(1);await expect(popup.locator('.app-modal__body p')).toHaveCount(0);
  const claimBox=await popup.getByRole('button',{name:'Mở quà',exact:true}).boundingBox();const dialog=await popup.locator('.app-modal').boundingBox();expect(claimBox.width).toBeLessThanOrEqual(200);expect(Math.abs((claimBox.x+claimBox.width/2)-(dialog.x+dialog.width/2))).toBeLessThanOrEqual(2);const b=await popup.locator('.app-modal').boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width);expect(b.y+b.height).toBeLessThanOrEqual(height-49);
  if(['default','storybook'].includes(skin)){mkdirSync('runtime/qa/hourly-gift',{recursive:true});await page.screenshot({path:`runtime/qa/hourly-gift/${skin}-${width}.png`});}
  await popup.getByRole('button',{name:'Mở quà',exact:true}).evaluate(el=>{el.click();el.click();});await expect(popup).toHaveCount(0);await expect(page.locator('.hourly-gift-reveal .hourly-gift__result')).toContainText('5 Xu');await rewardCard(page,width,height);if(captureReward){await page.waitForFunction(()=>document.querySelector('.hourly-gift-particle')?.getAnimations()[0]?.currentTime>=1900);await page.screenshot({path:`runtime/qa/hourly-gift/${skin}-reward-hold-${width}.png`});}await expect(page.locator('.adventure-gift-countdown')).toHaveText(/^00:(?:0[1-9]|10)$/);await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeDisabled();await expect(page.locator('.adventure-gift-ready-dot')).toBeHidden();await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toHaveAttribute('data-gift-cooling','true');
  await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0,{timeout:7000});await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeDisabled();
  const hit=await page.getByRole('button',{name:'Quà tặng',exact:true}).boundingBox();expect(hit.width).toBe(48);expect(hit.height).toBe(48);
  await advance(page);
 }
 expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(5);expect(errors).toEqual([]);
});
test('outside popup effects, cooldown, retry and owner interruption preserve one grant',async({page})=>{
 test.setTimeout(90000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 const baseline=await page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics());
 for(const kind of ['ticket','support','coins']){
  await page.evaluate(kind=>hourlyFixture.kind=kind,kind);await advance(page);await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await expect(page.locator('.hourly-gift-reveal')).toBeVisible();if(kind==='ticket'){await expect(page.locator('.hourly-gift__result')).toContainText('10 Vé quay');await expect(page.locator('.hourly-gift-particle')).toHaveCount(10);}
  await page.locator('#menu-container .adventure-header .adventure-exit').click();await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0,{timeout:7000});
  await page.evaluate(async()=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  await expect.poll(()=>page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
  await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeDisabled();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);
 }
 expect(await page.evaluate(async()=>(await import('/js/gameState.js')).gameState.progress.memoryMatch.items.hint)).toBe(1);
 await advance(page);await page.evaluate(()=>hourlyFixture.fail=true);await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeVisible();
 await page.evaluate(()=>{hourlyFixture.fail=false;hourlyFixture.advance();});await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.getByRole('button',{name:'Mở quà',exact:true})).toBeEnabled();await page.keyboard.press('Escape');await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);
 await page.evaluate(()=>hourlyFixture.delay=true);await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await page.evaluate(()=>{hourlyFixture.delay=false;hourlyFixture.resolve();});await expect(page.locator('.hourly-gift-particles')).toHaveCount(0);
 await advance(page);await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await expect(page.locator('.hourly-gift-particle')).toHaveCount(5);await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0,{timeout:7000});
 expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(4);
 await expect.poll(()=>page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
});


test('ten-second gift cooldown blocks repeat opening, dims icon and returns only a ready dot',async({page})=>{
 test.setTimeout(45000);await ready(page);
 expect(await page.evaluate(async()=>(await import('/js/liveops/hourlyGift.js')).HOURLY_GIFT_MS)).toBe(10000);
 const shortcut=page.getByRole('button',{name:'Quà tặng',exact:true});
 await expect(page.locator('.adventure-gift-ready-dot')).toBeVisible();await expect(page.locator('.adventure-gift-countdown')).toHaveText('');
 await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);
 await expect(shortcut).toBeDisabled();await expect(shortcut.locator('.adventure-action-art')).toHaveCSS('opacity','0.4');await expect(page.locator('.adventure-gift-ready-dot')).toBeHidden();
 await shortcut.evaluate(node=>node.click());await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(1);
 await expect(shortcut).toBeEnabled({timeout:12000});await expect(page.locator('.adventure-gift-ready-dot')).toBeVisible();await expect(page.locator('.adventure-gift-countdown')).toHaveText('');
 await expect(shortcut).not.toContainText('Sẵn sàng');await expect(shortcut.locator('.adventure-action-art')).toHaveCSS('opacity','1');
 await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(2);
});


test('gift particles share gameplay drop hold and collection timing and clean hidden or reduced interruption',async({page})=>{
 test.setTimeout(45000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 const baseline=await page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics());
 await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('.hourly-gift-particle')).toHaveCount(5);
 const timing=await page.locator('.hourly-gift-particle').evaluateAll(async particles=>{
  const {GIFT_LOOT_TIMING}=await import('/js/liveops/hourlyGiftPresentation.js');
  return {policy:GIFT_LOOT_TIMING,particles:particles.map(node=>{
   const animation=node.getAnimations()[0],options=animation.effect.getTiming(),frames=animation.effect.getKeyframes();
   return {duration:options.duration,delay:options.delay,land:frames[2].offset,collect:frames[3].offset,landTransform:frames[2].transform,collectTransform:frames[3].transform};
  })};
 });
 await expect(page.locator('.hourly-gift-reveal > .adventure-action-art')).toHaveCSS('opacity','0',{timeout:2000});
 expect(timing.policy).toEqual({dropMs:900,holdMs:900,flightMs:850,revealDelayMs:700});
 for(const [index,particle]of timing.particles.entries()){
  expect(particle.duration).toBe(2650);expect(particle.delay).toBe(700+index*24);
  expect((particle.collect-particle.land)*particle.duration).toBeCloseTo(900,5);expect(particle.landTransform).toBe(particle.collectTransform);
 }
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0,{timeout:7000});await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await expect.poll(()=>page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
 await advance(page);await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('.hourly-gift-particle')).toHaveCount(5);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0,{timeout:7000});
 await expect.poll(()=>page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(2);
});


test('support reward toast stays on one compact line for every item at narrow size',async({page},info)=>{
 test.setTimeout(60000);await ready(page);await page.setViewportSize({width:320,height:640});
 for(const skin of ['default','woodland','papercut','starship','storybook']){
  await page.evaluate(async skin=>{
   await (await import('/js/uiSkin.js')).selectUiSkin(skin);
   await import('/js/liveops/hourlyGiftPresentation.js');
   const {CHEST_SUPPORTS}=await import('/js/liveops/chestConfig.js');
   const names={'memory-match':'Memory Match','link-connect':'Link Connect','triple-connect':'Triple Connect'};
   const root=document.createElement('div');root.className='hourly-gift-reveal';root.style.left='160px';root.style.top='260px';
   const toast=document.createElement('div');toast.className='hourly-gift__result';
   const {createIcon}=await import('/js/icons.js');toast.append(createIcon('timer'));const label=document.createElement('strong');toast.append(label);root.append(toast);document.body.append(root);
   try {for(const [game,items] of Object.entries(CHEST_SUPPORTS))for(const item of items){
    label.textContent=`${item.label} ×1 · ${names[game]}`;
    const r=toast.getBoundingClientRect();
    if(label.scrollWidth>label.clientWidth+1||r.left<0||r.right>innerWidth||label.getBoundingClientRect().height>18)throw Error(`Reward toast overflow: ${skin}/${game}/${item.key}`);
   }}finally{root.remove();}
  },skin);
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{hourlyFixture.kind='support';hourlyFixture.key='time30';});await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.hourly-gift-particle')?.getAnimations()[0]?.currentTime>=1900);
 await page.screenshot({path:info.outputPath('compact-support-toast.png')});
 await expect(page.locator('.hourly-gift-reveal > .adventure-action-art')).toHaveCSS('opacity','0');
});

test('gift chest renders matching artwork, credits storage and cleans up',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{hourlyFixture.kind='chest';hourlyFixture.chestType='badge';});
 await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();
 await expect(page.locator('.hourly-gift__result [data-chest-type="badge"]')).toBeVisible();
 await expect(page.locator('.hourly-gift-particle')).toHaveCount(1);
 await expect(page.locator('.hourly-gift-reveal')).toHaveCount(0,{timeout:10000});
 await expect(page.locator('.hourly-gift-particle')).toHaveCount(0);
 expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(1);
});
