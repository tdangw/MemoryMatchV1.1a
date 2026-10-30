import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const fixture=`
import {transitionSpark} from '/js/liveops/sparkModel.js';
import {creditChestSupport} from '/js/liveops/supportInventory.js';
import {gameState} from '/js/gameState.js';
import {HOURLY_GIFT_MS} from '/js/liveops/hourlyGift.js';
import {publishHourlyGiftView} from '/js/liveops/hourlyGiftViewState.js';
let offset=0,now=Date.now(),state=transitionSpark(null,{type:'status'},{uid:'gift-test',now}).state;
window.hourlyFixture={kind:'coins',gameId:'memory-match',key:'hint',claims:0,fail:false,delay:false,advance(ms=HOURLY_GIFT_MS){offset+=ms;now=Date.now()+offset;publishHourlyGiftView({state,serverNow:now});}};
export const bindLiveopsAccount=()=>()=>{};
export const trustedRewardPeriod=()=>null;
export async function requestLiveops(command={type:'status'}){
 if(hourlyFixture.fail)throw Error('network');
 if(hourlyFixture.delay)await new Promise(resolve=>hourlyFixture.resolve=resolve);
 now=Date.now()+offset;const cmd={...command};
 if(cmd.type==='claimHourlyGift'){hourlyFixture.claims++;cmd.operation=crypto.randomUUID();cmd.sequence=(state.hourlyGift?.sequence||0)+1;cmd.candidate=hourlyFixture.kind==='support'?{kind:'support',coins:0,gameId:hourlyFixture.gameId,key:hourlyFixture.key}:{kind:hourlyFixture.kind,coins:hourlyFixture.kind==='coins'?100:0,gameId:null,key:null};}
 const result=transitionSpark(state,cmd,{uid:'gift-test',now});state=result.state;
 for(const receipt of result.receipts){gameState.coins+=receipt.coins;if(receipt.support)creditChestSupport(gameState.progress,receipt.support);}
 return result;
}`;
async function ready(page){await page.route('**/js/liveops/service.js*',route=>route.fulfill({contentType:'text/javascript',body:fixture}));await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();await page.evaluate(async()=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));}
async function advance(page){await page.evaluate(()=>hourlyFixture.advance());await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeEnabled();await expect(page.locator('.adventure-gift-countdown')).toHaveText('');await expect(page.locator('.adventure-gift-ready-dot')).toBeVisible();}
async function open(page){await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await expect(page.getByRole('button',{name:'Mở quà',exact:true})).toBeEnabled();}
for(const [width,height] of [[320,640],[412,915],[844,390]])test(`hourly gift minimal popup and countdown fit ${width}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height});await ready(page);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const skin of ['default','woodland','papercut','starship','storybook']){
  await page.evaluate(async name=>(await import('/js/uiSkin.js')).selectUiSkin(name),skin);await open(page);const popup=page.locator('#hourly-gift-modal');
  await expect(popup.locator('h2')).toHaveText('Quà tặng bất ngờ');await expect(popup.getByRole('button',{name:'Mở quà',exact:true})).toHaveCSS('color','rgb(255, 251, 220)');await expect(popup.locator('.app-modal__body button')).toHaveCount(1);await expect(popup.locator('.app-modal__body p')).toHaveCount(0);
  const claimBox=await popup.getByRole('button',{name:'Mở quà',exact:true}).boundingBox();const dialog=await popup.locator('.app-modal').boundingBox();expect(claimBox.width).toBeLessThanOrEqual(200);expect(Math.abs((claimBox.x+claimBox.width/2)-(dialog.x+dialog.width/2))).toBeLessThanOrEqual(2);const b=await popup.locator('.app-modal').boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width);expect(b.y+b.height).toBeLessThanOrEqual(height-49);
  if(['default','storybook'].includes(skin)){mkdirSync('runtime/qa/hourly-gift',{recursive:true});await page.screenshot({path:`runtime/qa/hourly-gift/${skin}-${width}.png`});}
  await popup.getByRole('button',{name:'Mở quà',exact:true}).evaluate(el=>{el.click();el.click();});await expect(popup).toHaveCount(0);await expect(page.locator('.hourly-gift-reveal .hourly-gift__result')).toContainText('100 Xu');await expect(page.locator('.adventure-gift-countdown')).toHaveText(/^00:(?:0[1-9]|10)$/);await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeDisabled();await expect(page.locator('.adventure-gift-ready-dot')).toBeHidden();await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toHaveAttribute('data-gift-cooling','true');
  await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0);await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeDisabled();
  const hit=await page.getByRole('button',{name:'Quà tặng',exact:true}).boundingBox();expect(hit.width).toBe(48);expect(hit.height).toBe(48);
  await advance(page);
 }
 expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(5);expect(errors).toEqual([]);
});
test('outside popup effects, cooldown, retry and owner interruption preserve one grant',async({page})=>{
 test.setTimeout(90000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 const baseline=await page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics());
 for(const kind of ['ticket','support','coins']){
  await page.evaluate(kind=>hourlyFixture.kind=kind,kind);await advance(page);await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await expect(page.locator('.hourly-gift-reveal')).toBeVisible();
  await page.locator('#menu-container .adventure-header .adventure-exit').click();await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0);
  await page.evaluate(async()=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  expect(await page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
  await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeDisabled();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);
 }
 expect(await page.evaluate(async()=>(await import('/js/gameState.js')).gameState.progress.memoryMatch.items.hint)).toBe(1);
 await advance(page);await page.evaluate(()=>hourlyFixture.fail=true);await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeVisible();
 await page.evaluate(()=>{hourlyFixture.fail=false;hourlyFixture.advance();});await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.getByRole('button',{name:'Mở quà',exact:true})).toBeEnabled();await page.keyboard.press('Escape');await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);
 await page.evaluate(()=>hourlyFixture.delay=true);await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await page.evaluate(()=>{hourlyFixture.delay=false;hourlyFixture.resolve();});await expect(page.locator('.hourly-gift-particles')).toHaveCount(0);
 await advance(page);await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await expect(page.locator('.hourly-gift-particle')).toHaveCount(6);await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0);
 expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(4);
 expect(await page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
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
