import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
let fixture=readFileSync('tests/ui/events-festival.spec.js','utf8').match(/const fixture = `([\s\S]*?)`;/)[1];
fixture="import {committedRewardsForTransition} from '/js/liveops/rewardFeedbackModel.js';\n"+fixture.replace('let calls=0;', 'state.tickets=2;state.ticketEarned=2;window.wheelCommands=[];let calls=0;').replace('const cmd={...command};', "const cmd={...command};if(cmd.type==='spin')wheelCommands.push(cmd.source);").replace('const result=transitionSpark(state,cmd', 'const previous=structuredClone(state);const result=transitionSpark(state,cmd').replace('state=result.state;', 'state=result.state;result.committedRewards=committedRewardsForTransition(previous,result);');
const ads=`import {requestLiveops} from '/js/liveops/service.js';export const rewardedSpinAvailable=()=>!window.wheelAdUnavailable;export async function requestRewardedSpin(){if(window.cancelWheelAd)throw Error('Quảng cáo chưa hoàn tất.');return requestLiveops({type:'spin',source:'ad',earned:true,ordinal:eventsFixture.state.spins.ads.length+1});}`;
async function ready(page){await page.route('**/js/liveops/service.js*',r=>r.fulfill({contentType:'text/javascript',body:fixture}));await page.route('**/js/ads/rewarded.js*',r=>r.fulfill({contentType:'text/javascript',body:ads}));await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();await page.evaluate(async()=>{await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');(await import('/js/gameState.js')).gameState.settings.sound=false;});await open(page);await page.locator('.liveops-surface').evaluate(async n=>{await Promise.all(n.getAnimations().map(a=>a.finished));await document.fonts.ready;});}
async function open(page){await page.getByRole('button',{name:'Sự kiện',exact:true}).click();await expect(page.locator('.liveops__spin-primary')).toBeEnabled();}
async function finish(page){await page.locator('.liveops-reward-feedback__particle').evaluateAll(ns=>ns.forEach(n=>n.getAnimations().forEach(a=>a.finish())));await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);}
test('single center action and information icon fit all five skins and four viewports',async({page},info)=>{
 test.setTimeout(90000);await ready(page);
 for(const viewport of [{width:320,height:640},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]){await page.setViewportSize(viewport);
  for(const skin of ['default','woodland','papercut','starship','storybook']){await page.evaluate(async s=>(await import('/js/uiSkin.js')).selectUiSkin(s),skin);
   const wheel=await page.locator('.liveops__wheel').boundingBox(),button=await page.locator('.liveops__spin-primary').boundingBox();
   expect(Math.abs(button.x+button.width/2-wheel.x-wheel.width/2)).toBeLessThan(1);expect(Math.abs(button.y+button.height/2-wheel.y-wheel.height/2)).toBeLessThan(1);expect(button.width).toBeGreaterThanOrEqual(48);expect(button.height).toBeGreaterThanOrEqual(48);
   const tickets=await page.locator('.liveops__ticket-balance').boundingBox();expect(tickets.x).toBeLessThan(wheel.x+wheel.width/2);expect(tickets.y+tickets.height).toBeLessThanOrEqual(wheel.y);
   await expect(page.locator('.liveops__spin-primary')).toHaveCount(1);await expect(page.getByRole('heading',{name:'Vòng quay may mắn'})).toHaveCount(0);await expect(page.locator('.liveops__spin-secondary')).toHaveCount(0);await expect(page.locator('.liveops__status')).toHaveText('');
   if(viewport.width===412&&['default','storybook'].includes(skin))await page.screenshot({path:info.outputPath(`center-${skin}.png`)});
  }
 }
 await page.getByRole('button',{name:'Thể lệ vòng quay',exact:true}).click();await expect(page.locator('#wheel-rules-modal')).toContainText('12,5%');await page.locator('#wheel-rules-modal .app-modal__close').click();await expect(page.locator('#wheel-rules-modal')).toHaveCount(0);
});
test('center consumes free then tickets then earned ad; coins start at the winning sector and only toast reports result',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 for(const source of ['free','ticket','ticket','ad']){
  const trigger=page.locator('.liveops__spin-primary');await expect(trigger).toHaveAttribute('data-spin-source',source);await expect(trigger).toBeEnabled();
  await trigger.focus();await trigger.evaluate(n=>{n.click();n.click();});await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
  await expect.poll(()=>page.locator('.liveops__rotor').evaluate(n=>n.getAnimations().length)).toBeGreaterThan(0);
  await page.locator('.liveops__rotor').evaluate(n=>n.getAnimations().forEach(a=>a.finish()));await expect(page.locator('.liveops-reward-feedback__particle')).toHaveCount(25);
  const origin=await page.evaluate(()=>{const box=document.querySelector('[data-wheel-sector="7"]').getBoundingClientRect();const m=new DOMMatrix(document.querySelector('.liveops-reward-feedback__particle').getAnimations()[0].effect.getKeyframes()[0].transform);return {x:m.m41+18,y:m.m42+18,targetX:box.x+box.width/2,targetY:box.y+box.height/2};});
  expect(origin.x).toBeCloseTo(origin.targetX,1);expect(origin.y).toBeCloseTo(origin.targetY,1);await expect(page.locator('.liveops__status')).toHaveText('');await expect(page.locator('.liveops-reward-feedback__toast')).toContainText('25 Xu');await finish(page);await expect(page.locator('.liveops__spin-primary')).toBeFocused();
 }
 expect(await page.evaluate(()=>wheelCommands)).toEqual(['free','ticket','ticket','ad']);expect(await page.evaluate(()=>eventsFixture.state.tickets)).toBe(0);
 await page.evaluate(()=>{const s=eventsFixture.state;s.spins.ads=Array.from({length:10},(_,i)=>({source:'ad',day:s.day,sector:0,coins:5,operation:`cap-${i}`,ordinal:i+1}));});await page.locator('.adventure-screen > .adventure-exit').click();await page.getByRole('button',{name:'Sự kiện',exact:true}).click();await expect(page.locator('.liveops__spin-primary')).toBeDisabled();await expect(page.locator('.liveops__spin-primary')).toContainText('Hết lượt');
});
test('closing during wheel motion cancels visuals while keeping the committed spin and next source',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Quay miễn phí',exact:true}).click();await expect.poll(()=>page.locator('.liveops__rotor').evaluate(n=>n.getAnimations().length)).toBeGreaterThan(0);
 await page.locator('.adventure-screen > .adventure-exit').click();await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);await open(page);await expect(page.locator('.liveops__spin-primary')).toHaveAttribute('data-spin-source','ticket');
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Dùng 1 vé',exact:true}).click();await expect(page.locator('.liveops__spin-primary')).toBeEnabled();expect(await page.locator('.liveops__rotor').evaluate(n=>n.getAnimations().length)).toBe(0);
});
