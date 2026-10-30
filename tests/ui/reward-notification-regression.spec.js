import { test, expect } from '@playwright/test';
const accountFixture = `
const listeners=new Set();
const service={getIdentity:()=>window.rewardIdentity||null,getState:()=>({phase:'synced',bound:true}),subscribe(fn){listeners.add(fn);fn(service.getState());return()=>listeners.delete(fn);}};
window.rewardAccountChange=()=>{for(const fn of listeners)fn(service.getState());};
export const getAccountService=()=>service;
export const initializeAccountService=()=>service;
`;
const serviceFixture = `
export const bindLiveopsAccount=()=>()=>{};
export const trustedRewardPeriod=()=>window.rewardPeriod||null;
export const requestLiveops=async()=>({state:window.rewardState,serverNow:Date.now(),appliedCoins:0});
`;
async function ready(page) {
  await page.route('**/js/accountService.js*',route=>route.fulfill({contentType:'text/javascript',body:accountFixture}));
  await page.route('**/js/liveops/service.js*',route=>route.fulfill({contentType:'text/javascript',body:serviceFixture}));
  await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible();
  await page.evaluate(async()=>{
    const {gameState}=await import('/js/gameState.js');
    const {initialSparkState,normalizeSparkSave}=await import('/js/liveops/sparkModel.js');
    const {setRankingOwner}=await import('/js/rankingOwner.js');
    window.rewardIdentity={uid:'notification-owner',profileId:'notification-profile'};
    setRankingOwner({id:rewardIdentity.profileId,uid:rewardIdentity.uid});
    const state=initialSparkState(Date.now()); state.tickets=2;state.ticketEarned=2;state.daily.matches=30;
    gameState.appearance.spark={...normalizeSparkSave(),ownerUid:rewardIdentity.uid,ticketEarned:2,state};
    window.rewardState=state;window.rewardPeriod=null;
    (await import('/js/gameSelector.js')).showGameSelector();
  });
}
const home = (page,name)=>page.locator('#menu-container.game-selector [data-dock-action="'+name+'"]');
async function publish(page) { await page.evaluate(async()=>(await import('/js/liveops/rewardPeriodViewState.js')).publishRewardPeriod()); }

for (const viewport of [{width:320,height:640},{width:412,height:915},{width:1024,height:900}]) test(`HOME and map reward dots use the right source before/after clock confirmation ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport); await ready(page);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  // Durable tickets must be visible even before a daily clock is available.
  await expect(home(page,'events').locator('.adventure-reward-dot')).toBeVisible();
  await expect(home(page,'missions').locator('.adventure-reward-dot')).toBeHidden();
  await page.evaluate(()=>{window.rewardPeriod={uid:rewardIdentity.uid,day:rewardState.day};}); await publish(page);
  for (const action of ['missions','events']) {
    const control=home(page,action);await expect(control.locator('.adventure-reward-dot')).toBeVisible();
    const a=await control.boundingBox(),b=await control.locator('.adventure-reward-dot').boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(a.x);expect(b.x+b.width).toBeLessThanOrEqual(a.x+a.width);expect(b.y).toBeGreaterThanOrEqual(a.y);expect(b.y+b.height).toBeLessThanOrEqual(a.y+a.height);
  }
  // A function-page dock gets the same owner/source, then closes back to HOME.
  await home(page,'settings').click();
  await expect(page.locator('.adventure-screen [data-dock-action="missions"] .adventure-reward-dot')).toBeVisible();
  await page.locator('.adventure-screen > .adventure-exit').click();
  await expect(page.locator('.adventure-screen')).toHaveCount(0);
  await page.evaluate(async()=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  for(const action of ['missions','events'])await expect(page.locator(`[data-map-destination="${action}"] .adventure-reward-dot`)).toBeVisible();
  // The free spin also keeps the event indicator on after tickets are consumed.
  await page.evaluate(()=>{rewardState.tickets=0;});await publish(page);
  await expect(page.locator('[data-map-destination="events"] .adventure-reward-dot')).toBeVisible();
  await page.evaluate(()=>{rewardState.spins.free={};rewardState.loginDay=rewardState.day;rewardState.daily.claimed=['match-thirty'];});await publish(page);
  for(const action of ['missions','events'])await expect(page.locator(`[data-map-destination="${action}"] .adventure-reward-dot`)).toBeHidden();
  // A different account cannot inherit a previous owner's notifications.
  await page.evaluate(()=>{rewardState.tickets=2;rewardIdentity={uid:'other-owner',profileId:'other-profile'};rewardAccountChange();});
  for(const action of ['missions','events'])await expect(page.locator(`[data-map-destination="${action}"] .adventure-reward-dot`)).toBeHidden();
  expect(errors).toEqual([]);
});

test('twenty HOME/map transitions release notification owners and do not fetch on local updates',async({page})=>{
  await ready(page);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(let cycle=0;cycle<20;cycle++){
    const old=await page.evaluate(async()=>{
      const {getAppPageScope}=await import('/js/appPageLifecycle.js');window.previousNotificationOwner=getAppPageScope();
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
      return previousNotificationOwner.diagnostics();
    });
    for(const [key,value]of Object.entries(old))expect(value).toBe(key==='active'?false:0);
    await expect(page.locator('[data-map-destination="events"] .adventure-reward-dot')).toBeVisible();
    await page.locator('#menu-container .adventure-header .adventure-exit').click();
    await expect(home(page,'events').locator('.adventure-reward-dot')).toBeVisible();
    expect(await page.locator('.adventure-reward-dot').count()).toBe(2);
  }
  expect(errors).toEqual([]);
});
