import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const fixture=`
import {transitionSpark} from '/js/liveops/sparkModel.js';
import {creditChestSupport} from '/js/liveops/supportInventory.js';
import {gameState} from '/js/gameState.js';
let now=Date.now(),state=transitionSpark(null,{type:'status'},{uid:'gift-test',now}).state;
window.hourlyFixture={kind:'coins',gameId:'memory-match',key:'hint',claims:0,fail:false,delay:false,advance(ms){now+=ms}};
export const bindLiveopsAccount=()=>()=>{};
export const trustedRewardPeriod=()=>null;
export async function requestLiveops(command={type:'status'}){
 if(hourlyFixture.fail)throw Error('network');
 if(hourlyFixture.delay)await new Promise(resolve=>hourlyFixture.resolve=resolve);
 const cmd={...command};
 if(cmd.type==='claimHourlyGift'){hourlyFixture.claims++;cmd.operation=crypto.randomUUID();cmd.sequence=(state.hourlyGift?.sequence||0)+1;cmd.candidate=hourlyFixture.kind==='support'?{kind:'support',coins:0,gameId:hourlyFixture.gameId,key:hourlyFixture.key}:{kind:hourlyFixture.kind,coins:hourlyFixture.kind==='coins'?100:0,gameId:null,key:null};}
 const result=transitionSpark(state,cmd,{uid:'gift-test',now});state=result.state;
 for(const receipt of result.receipts){gameState.coins+=receipt.coins;if(receipt.support)creditChestSupport(gameState.progress,receipt.support);}
 return result;
}`;
async function ready(page){await page.route('**/js/liveops/service.js*',route=>route.fulfill({contentType:'text/javascript',body:fixture}));await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();await page.evaluate(async()=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));}
async function open(page){await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await expect(page.getByRole('button',{name:'Mở quà',exact:true})).toBeEnabled();}
for(const [width,height] of [[320,640],[412,915],[844,390]])test(`hourly gift minimal popup and countdown fit ${width}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height});await ready(page);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const skin of ['default','woodland','papercut','starship','storybook']){
  await page.evaluate(async name=>(await import('/js/uiSkin.js')).selectUiSkin(name),skin);await open(page);const popup=page.locator('#hourly-gift-modal');
  await expect(popup.locator('h2')).toHaveText('Quà tặng bất ngờ');await expect(popup.getByRole('button',{name:'Mở quà',exact:true})).toHaveCSS('color','rgb(255, 251, 220)');await expect(popup.locator('.app-modal__body button')).toHaveCount(1);await expect(popup.locator('.app-modal__body p')).toHaveCount(0);
  const b=await popup.locator('.app-modal').boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width);expect(b.y+b.height).toBeLessThanOrEqual(height-49);
  if(['default','storybook'].includes(skin)){mkdirSync('runtime/qa/hourly-gift',{recursive:true});await page.screenshot({path:`runtime/qa/hourly-gift/${skin}-${width}.png`});}
  await popup.getByRole('button',{name:'Mở quà',exact:true}).evaluate(el=>{el.click();el.click();});await expect(popup).toHaveCount(0);await expect(page.locator('.hourly-gift-reveal .hourly-gift__result')).toContainText('100 Xu');await expect(page.locator('.adventure-gift-countdown')).toHaveText(/^(59|60):/);
  await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0);await expect(page.getByRole('button',{name:'Quà tặng',exact:true})).toBeFocused();
  const hit=await page.getByRole('button',{name:'Quà tặng',exact:true}).boundingBox();expect(hit.width).toBe(48);expect(hit.height).toBe(48);
  await page.evaluate(()=>hourlyFixture.advance(3600000));
 }
 expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(5);expect(errors).toEqual([]);
});
test('outside popup effects, cooldown, retry and owner interruption preserve one grant',async({page})=>{
 test.setTimeout(90000);await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 const baseline=await page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics());
 for(const kind of ['ticket','support','coins']){
  await page.evaluate(kind=>{hourlyFixture.kind=kind;hourlyFixture.advance(3600000);},kind);await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await expect(page.locator('.hourly-gift-reveal')).toBeVisible();
  await page.locator('#menu-container .adventure-header .adventure-exit').click();await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0);
  await page.evaluate(async()=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  expect(await page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
  await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await expect(page.getByRole('button',{name:'Mở quà',exact:true})).toBeDisabled();await page.keyboard.press('Escape');await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);
 }
 expect(await page.evaluate(async()=>(await import('/js/gameState.js')).gameState.progress.memoryMatch.items.hint)).toBe(1);
 await page.evaluate(()=>hourlyFixture.fail=true);await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeVisible();
 await page.evaluate(()=>{hourlyFixture.fail=false;hourlyFixture.advance(3600000);});await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.getByRole('button',{name:'Mở quà',exact:true})).toBeEnabled();await page.keyboard.press('Escape');await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);
 await page.evaluate(()=>hourlyFixture.delay=true);await page.getByRole('button',{name:'Quà tặng',exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await page.evaluate(()=>{hourlyFixture.delay=false;hourlyFixture.resolve();});await expect(page.locator('.hourly-gift-particles')).toHaveCount(0);
 await page.evaluate(()=>hourlyFixture.advance(3600000));await open(page);await page.getByRole('button',{name:'Mở quà',exact:true}).click();await expect(page.locator('#hourly-gift-modal')).toHaveCount(0);await expect(page.locator('.hourly-gift-particle')).toHaveCount(6);await expect(page.locator('.hourly-gift-reveal,.hourly-gift-particles')).toHaveCount(0);
 expect(await page.evaluate(()=>hourlyFixture.claims)).toBe(4);
 expect(await page.evaluate(async()=>(await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
});
