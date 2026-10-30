import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('letter atlas and feedback stay bounded at four sizes, both motion settings, and twenty owners',async({page})=>{
  await page.goto('/');
  for(const width of [320,412,844,1024])for(const reduced of ['reduce','no-preference']){
    await page.setViewportSize({width,height:width===844?390:915});await page.emulateMedia({reducedMotion:reduced});
    const result=await page.evaluate(async()=>{
      const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js');
      const {showLetterDropFeedback,prepareLetterDropFeedback}=await import('/js/liveops/letterDropFeedback.js');
      const {LETTER_ALPHABET}=await import('/js/liveops/config.js');
      const baseline=document.getAnimations().length;
      for(let cycle=0;cycle<20;cycle++){
        const scope=createGameShellLifecycle();
        for(const letter of LETTER_ALPHABET)showLetterDropFeedback(letter,{x:40,y:220},scope);
        if(document.querySelectorAll('.letter-drop-feedback__entry').length!==5)throw Error('Unbounded letter presentation');
        scope.dispose();scope.dispose();
        if(document.querySelector('.letter-drop-feedback'))throw Error('Detached letter owner remains');
        if(document.getAnimations().length!==baseline)throw Error('Letter animation survived disposal');
      }
      const closed=createGameShellLifecycle();const callback=prepareLetterDropFeedback(document.body,closed);closed.dispose();callback({letter:'M'});
      if(document.querySelector('.letter-drop-feedback'))throw Error('Stale callback painted new scene');
      window.letterFeedbackScope=createGameShellLifecycle();
      for(const letter of ['M','A','T','C','H'])showLetterDropFeedback(letter,{x:40,y:220},window.letterFeedbackScope);
      return [...document.querySelectorAll('.letter-drop-feedback__entry')].map(node=>{
        const r=node.getBoundingClientRect();return{left:r.left,right:r.right};
      });
    });
    for(const rect of result){expect(rect.left).toBeGreaterThanOrEqual(0);expect(rect.right).toBeLessThanOrEqual(width);}
    if(width===412&&reduced==='no-preference'){
      await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target.closest('.letter-drop-feedback')).forEach(a=>{a.pause();a.currentTime=900;}));
      mkdirSync('design/rewards-letters/drop/review',{recursive:true});
      await page.screenshot({path:'design/rewards-letters/drop/review/feedback-mobile.png'});
      await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target.closest('.letter-drop-feedback')).forEach(a=>a.play()));
    }
    await expect(page.locator('.letter-drop-feedback__entry')).toHaveCount(0);
    await page.evaluate(()=>window.letterFeedbackScope.dispose());
  }
});

test('only a newly durable letter creates feedback; duplicate and aborted writes never replay it',async({page})=>{
 test.skip(process.env.VITE_LIVEOPS_ENABLED!=='1','Explicit letter runtime flag required for persistence integration');
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
  const p=await import('/js/persistence.js');await p.loadPersistentGameData();
  const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js');
  const {prepareLetterDropFeedback}=await import('/js/liveops/letterDropFeedback.js');
  const scope=createGameShellLifecycle(),feedback=prepareLetterDropFeedback(document.body,scope);
  const ticketDrop={gameId:'memory-match',mode:'easy',attempt:'feedback-attempt',wave:1,group:'card-a|card-b',special:true};
  const originalRandom=crypto.getRandomValues.bind(crypto);
  crypto.getRandomValues=array=>{if(array instanceof Uint32Array&&array.length===1){array[0]=0;return array;}return originalRandom(array);};
  let callbacks=0;
  const onSpecialDrop=value=>{if(value.letter)callbacks++;feedback(value);};
  const first=await p.savePersistentGameData({ticketDrop,onSpecialDrop});
  const visible=document.querySelectorAll('.letter-drop-feedback__entry').length;
  await p.savePersistentGameData({ticketDrop,onSpecialDrop});
  const aborted=await p.savePersistentGameData({ticketDrop:{...ticketDrop,group:'card-c|card-d'},onSpecialDrop,isCurrent:()=>false});
  const counts=(await p.loadPersistentGameData()).appearance.spark.letterEarned;
  crypto.getRandomValues=originalRandom;
  scope.dispose();return {first,visible,aborted,callbacks,total:Object.values(counts).reduce((a,b)=>a+b,0)};
 });
 expect(result).toEqual({first:true,visible:1,aborted:false,callbacks:1,total:1});
});

test('Triple special match presents the actual persisted letter from its board position',async({page})=>{
 test.skip(process.env.VITE_LIVEOPS_ENABLED!=='1','Explicit letter runtime flag required');
 test.setTimeout(90000);await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
 const commands=await page.evaluate(async()=>{
  await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect');
  const {gameState}=await import('/js/gameState.js');gameState.settings.sound=gameState.settings.music=false;
  window.letterSeen=[];window.ticketSeen=0;
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)
   {if(node.classList?.contains('letter-drop-feedback__entry')&&node.dataset.rewardKind==='letter')window.letterSeen.push(node.textContent);
   if(node.classList?.contains('game-loot-drop')&&node.querySelector('.ui-icon--ticket'))window.ticketSeen++;}
  }).observe(document.body,{subtree:true,childList:true});
  window.letterTripleRun=await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({mode:'challenge',level:1,seed:'lucky-ui',skipIntro:true});
  const originalRandom=crypto.getRandomValues.bind(crypto);
  crypto.getRandomValues=array=>{if(array instanceof Uint32Array&&array.length===1){array[0]=0;return array;}return originalRandom(array);};
  return window.letterTripleRun.generated.witness;
 });
 let found=false;
 for(const command of commands){
  const moves=await page.evaluate(()=>window.letterTripleRun.getState().moves);
  await page.locator(`.triple-connect__board [data-tile-id="${command.tileId}"]`).click();
  await expect.poll(()=>page.evaluate(()=>window.letterTripleRun.getState().moves)).toBeGreaterThan(moves);
  await page.waitForFunction(()=>!document.querySelector('.triple-connect__tray-flight, .triple-connect__ghost'));
  found=await page.evaluate(()=>window.letterSeen.length>0);if(found)break;
 }
 expect(found).toBe(true);
 const saved=await page.evaluate(async()=>{
  const counts=(await (await import('/js/persistence.js')).loadPersistentGameData()).appearance.spark.letterEarned;
  return {letters:Object.keys(counts),seen:window.letterSeen};
 });
 expect(saved.seen).toEqual([`Đã nhận chữ ${saved.letters[0]}`]);
 expect(await page.evaluate(()=>window.ticketSeen)).toBe(1);
 expect(await page.evaluate(async()=>(await (await import('/js/persistence.js')).loadPersistentGameData()).appearance.spark.ticketEarned)).toBe(1);
 await page.screenshot({path:'design/rewards-letters/drop/review/triple-connect-gameplay.png'});
});

test('tickets use ordinary item loot and never enter the central letter presentation',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
 const result=await page.evaluate(async()=>{
  await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
  const {createGameShellLifecycle,activateGameScope}=await import('/js/gameShell/gameShellLifecycle.js');
  const {prepareLetterDropFeedback}=await import('/js/liveops/letterDropFeedback.js');
  for(let cycle=0;cycle<20;cycle++){
   const scope=createGameShellLifecycle();activateGameScope(scope);
   const feedback=prepareLetterDropFeedback(document.body,scope);
   feedback({ticket:true});
   if(document.querySelectorAll('.game-loot-drop .ui-icon--ticket').length!==1)throw Error('Ticket loot not rendered');
   if(document.querySelector('.letter-drop-feedback'))throw Error('Ticket entered letter stage');
   scope.dispose();feedback({ticket:true});
   if(document.querySelector('.game-loot-drop'))throw Error('Ticket outlived its round');
  }
  return true;
 });expect(result).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.evaluate(async()=>{
  const {createGameShellLifecycle,activateGameScope}=await import('/js/gameShell/gameShellLifecycle.js');
  const {prepareLetterDropFeedback}=await import('/js/liveops/letterDropFeedback.js');
  const scope=createGameShellLifecycle();activateGameScope(scope);prepareLetterDropFeedback(document.body,scope)({ticket:true});
  const count=document.querySelectorAll('.game-loot-drop,.letter-drop-feedback').length;scope.dispose();return count;
 })).toBe(0);
});
