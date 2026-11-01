import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
let fixture=readFileSync('tests/ui/events-festival.spec.js','utf8').match(/const fixture = `([\s\S]*?)`;/)[1];
fixture="import {committedRewardsForTransition} from '/js/liveops/rewardFeedbackModel.js';\n"+fixture.replace('const result=transitionSpark(state,cmd', 'const previous=structuredClone(state);const result=transitionSpark(state,cmd').replace('state=result.state;', 'state=result.state;result.committedRewards=committedRewardsForTransition(previous,result);');
async function ready(page){await page.route('**/js/liveops/service.js*',r=>r.fulfill({contentType:'text/javascript',body:fixture}));await page.addInitScript(()=>{window.rewardAudioPlayed=[];HTMLMediaElement.prototype.play=function(){rewardAudioPlayed.push(this.src.split('/').at(-1));return Promise.resolve();};});await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();await page.evaluate(async()=>{const {gameState}=await import('/js/gameState.js');gameState.settings.sound=true;gameState.settings.soundVolume=.4;await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');});}
async function finish(page){await page.evaluate(()=>document.querySelectorAll('.liveops-reward-feedback__particle').forEach(n=>n.getAnimations().forEach(a=>a.finish())));await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);}
async function open(page,kind){await page.getByRole('button',{name:kind==='missions'?'Nhiệm vụ':'Sự kiện',exact:true}).click();await expect(page.locator('.liveops__status')).not.toHaveText('Đang kết nối…');}
test('mission grants show bounded loot and all three owned audio phases; replay/status/close never repeats them',async({page},info)=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await open(page,'missions');
 await page.locator('[data-focus-key="claim-login"]').click();await expect(page.locator('.liveops-reward-feedback__particle')).toHaveCount(15);
 expect(await page.evaluate(()=>rewardAudioPlayed)).toEqual(expect.arrayContaining(['reward.ogg','coin_drop.mp3']));await page.locator('.liveops-reward-feedback__particle').evaluateAll(nodes=>nodes.forEach(n=>n.getAnimations().forEach(a=>{a.pause();a.currentTime=1300;})));await page.screenshot({path:info.outputPath('mission-loot.png')});await finish(page);
 expect(await page.evaluate(()=>rewardAudioPlayed)).toContain('coin-collect.mp3');
 await page.getByRole('tab',{name:'Tuần này',exact:true}).click();await page.locator('[data-focus-key="claim-weekly"]').click();
 await expect(page.locator('.liveops-reward-feedback__particle[data-reward-kind="ticket"]')).toHaveCount(2);expect(await page.locator('.liveops-reward-feedback__particle').count()).toBeLessThanOrEqual(44);await finish(page);
 const count=await page.evaluate(()=>rewardAudioPlayed.filter(n=>['reward.ogg','coin_drop.mp3','coin-collect.mp3'].includes(n)).length);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);expect(await page.evaluate(()=>rewardAudioPlayed.filter(n=>['reward.ogg','coin_drop.mp3','coin-collect.mp3'].includes(n)).length)).toBe(count);
 await page.locator('.adventure-screen > .adventure-exit').click();await expect(page.locator('.adventure-screen')).toHaveCount(0);await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
});
test('wheel waits for its outcome; festival gives coin/chest particles; failure and interruption stay clean',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await open(page,'events');
 await page.getByRole('button',{name:'Quay miễn phí',exact:true}).click();await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
 await page.locator('.liveops__rotor').evaluate(n=>n.getAnimations().forEach(a=>a.finish()));await expect(page.locator('.liveops-reward-feedback__particle')).toHaveCount(25);await finish(page);
 await page.getByRole('tab',{name:'Sưu tập huy hiệu',exact:true}).click();await page.locator('[data-focus-key="festival-50"]').click();
 await expect(page.locator('.liveops-reward-feedback__particle[data-reward-kind="chest"]')).toHaveCount(1);await page.locator('.adventure-screen > .adventure-exit').click();await expect(page.locator('.adventure-screen')).toHaveCount(0);await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
 await open(page,'missions');await page.evaluate(()=>eventsFixture.fail=true);await page.locator('[data-focus-key="claim-login"]').click();await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
});


test('gameplay item audio shares phases, batches simultaneous drops and respects mute and scope cancellation',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 for(let cycle=0;cycle<10;cycle++){
  const before=await page.evaluate(()=>rewardAudioPlayed.filter(n=>['reward.ogg','coin_drop.mp3','coin-collect.mp3'].includes(n)).length);
  await page.evaluate(async()=>{
   const lifecycle=await import('/js/gameShell/gameShellLifecycle.js');window.itemSoundScope=lifecycle.createGameShellLifecycle();lifecycle.activateGameScope(itemSoundScope);
   const {playLootDrop}=await import('/js/lootEffects.js');
   for(let i=0;i<2;i++)playLootDrop(document.body,{icon:'wand',holdMs:0,timing:{dropMs:10,flightMs:10}});
  });
  await expect(page.locator('.game-loot-drop')).toHaveCount(0);
  expect(await page.evaluate(n=>rewardAudioPlayed.slice(n),before)).toEqual(['reward.ogg','coin_drop.mp3','coin-collect.mp3']);
  await page.evaluate(()=>itemSoundScope.dispose());
 }
 const muted=await page.evaluate(async()=>{
  const {gameState}=await import('/js/gameState.js');gameState.settings.sound=false;
  const {createGameShellLifecycle,activateGameScope}=await import('/js/gameShell/gameShellLifecycle.js');const scope=createGameShellLifecycle();activateGameScope(scope);
  const {playLootDrop}=await import('/js/lootEffects.js'),n=rewardAudioPlayed.length;playLootDrop(document.body);scope.dispose();return {n,after:rewardAudioPlayed.length,left:document.querySelectorAll('.game-loot-drop').length,diagnostics:scope.diagnostics()};
 });expect(muted.after).toBe(muted.n);expect(muted.left).toBe(0);for(const [key,n]of Object.entries(muted.diagnostics))expect(n).toBe(key==='active'?false:0);
});


test('reward batches clean twenty cycles at mobile and landscape sizes in five skins and both motion settings',async({page})=>{
 test.setTimeout(90000);await ready(page);await page.evaluate(async()=>{(await import('/js/gameState.js')).gameState.settings.sound=false;});
 for(const viewport of [{width:320,height:640},{width:412,height:915},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  for(const skin of ['default','woodland','papercut','starship','storybook']){
   await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);
   for(const motion of ['reduce','no-preference']){
    await page.emulateMedia({reducedMotion:motion});
    expect(await page.evaluate(async()=>{
     const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js');const {createRewardFeedback}=await import('/js/liveops/rewardFeedback.js');
     const {CHEST_POOLS}=await import('/js/liveops/chestConfig.js');
     for(let i=0;i<20;i++){
      const scope=createGameShellLifecycle(),host=document.createElement('section');host.innerHTML='<header class="app-modal__header">Thưởng</header>';document.body.append(host);
      const feedback=createRewardFeedback({owner:scope,host});feedback.present([{kind:'coins',amount:50},{kind:'ticket',amount:2},{kind:'chest',chestType:'c',amount:1},{kind:'letter',letter:'M',amount:1},{kind:'support',gameId:'memory-match',key:'hint',amount:1},{kind:'item',itemId:CHEST_POOLS.avatar[0],amount:1}],{x:innerWidth/2,y:innerHeight/2});
      if(document.querySelectorAll('.liveops-reward-feedback__particle[data-reward-kind="coins"]').length>32||document.querySelectorAll('.liveops-reward-feedback__particle:not([data-reward-kind="coins"])').length>12)throw Error('Loot cap exceeded');
      scope.dispose();scope.dispose();feedback.present([{kind:'coins',amount:1}],{x:30,y:30});host.remove();
      if(document.querySelector('.liveops-reward-feedback'))throw Error('Reward node survived');
      if(Object.entries(scope.diagnostics()).some(([k,v])=>k==='active'?v!==false:v!==0))throw Error('Reward resources survived');
     }return true;
    })).toBe(true);
   }
  }
 }
});


test('letter fusion, exchange and sale present their actual committed letter, chest and coins',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});await open(page,'events');
 await page.getByRole('tab',{name:'Sưu tập chữ',exact:true}).click();
 await page.getByRole('button',{name:/^Chữ A, \d+ chữ$/}).click();await page.locator('#letter-action-modal').getByRole('button',{name:'Ghép',exact:true}).click();
 for(let i=0;i<2;i++)await page.locator('#letter-fusion-modal').getByRole('button',{name:/^Chọn chữ A, còn \d+$/}).click();await page.locator('#letter-fusion-modal').getByRole('button',{name:'Ghép',exact:true}).click();
 await expect(page.locator('.liveops-reward-feedback__particle[data-reward-kind="letter"]')).toHaveCount(1);await expect(page.locator('#letter-fusion-modal')).toContainText('Đã ghép được chữ M');await finish(page);await page.locator('#letter-fusion-modal .app-modal__close').click();
 await page.locator('[data-focus-key="exchange-adventure"]').click();await expect(page.locator('.liveops-reward-feedback__particle[data-reward-kind="chest"]')).toHaveCount(1);await finish(page);
 await page.getByRole('button',{name:/^Chữ A, \d+ chữ$/}).click();await page.locator('#letter-action-modal').getByRole('button',{name:'Bán',exact:true}).click();await page.getByRole('button',{name:'Xác nhận bán',exact:true}).click();await expect(page.locator('.liveops-reward-feedback__particle[data-reward-kind="coins"]')).toHaveCount(10);await expect(page.locator('.liveops-reward-feedback__toast')).toContainText('10 Xu');await finish(page);
});
