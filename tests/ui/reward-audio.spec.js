import {test,expect} from '@playwright/test';
import {seed,open,snapshot} from './helpers/treasureFixtures.js';

async function spy(page) {
  await page.addInitScript(() => {
    window.rewardAudioEvents=[];
    const cue = audio => /\/(star_[123]|reward|open_box|explosion)\.ogg$/.test(audio.src);
    HTMLMediaElement.prototype.play=function(){
      if(cue(this)) {
        window.rewardAudioEvents.push({file:this.src.split('/').pop(),kind:'play',volume:this.volume,time:performance.now()});
        window.lastRewardAudio=this;
      }
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause=function(){
      if(cue(this)) window.rewardAudioEvents.push({file:this.src.split('/').pop(),kind:'pause',time:performance.now()});
    };
  });
}
const played=page=>page.evaluate(()=>window.rewardAudioEvents.filter(e=>e.kind==='play').map(e=>e.file));
async function summary(page,stars=3,coinsEarned=12) {
  await page.evaluate(async ({stars,coinsEarned})=>{
    (await import('/js/ui.js')).showLevelSummaryOverlay({level:1,stars,coinsEarned,score:200,remainingTime:30});
  },{stars,coinsEarned});
  await expect(page.locator('#level-summary-modal')).toBeVisible();
}
for(const reducedMotion of ['reduce','no-preference']) test(`summary plays only earned star cues (${reducedMotion})`,async({page})=>{
  await spy(page);await page.emulateMedia({reducedMotion});await page.goto('/');
  await page.locator('#app-loading').waitFor({state:'detached'});
  await summary(page);
  await expect.poll(()=>played(page)).toEqual(['star_1.ogg','star_2.ogg','star_3.ogg']);
  const events=await page.evaluate(()=>window.rewardAudioEvents.filter(e=>e.kind==='play'));
  expect(events[1].time-events[0].time).toBeGreaterThan(270);
  expect(events.every(e=>e.volume===.4)).toBe(true);
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await expect(page.locator('#level-summary-modal')).toHaveCount(0);
  expect(await page.evaluate(()=>window.rewardAudioEvents.filter(e=>e.kind==='pause').length)).toBe(3);
});

test('unearned stars and zero rewards stay silent; replacing summary cancels old cues',async({page})=>{
  await spy(page);await page.goto('/');await page.locator('#app-loading').waitFor({state:'detached'});
  await summary(page,3);await summary(page,1,0);
  await expect.poll(()=>played(page)).toEqual(['star_1.ogg']);
  await page.waitForTimeout(1800);
  expect(await played(page)).toEqual(['star_1.ogg']);
});

test('live volume, mute and owner disposal control every reward voice without resource growth',async({page})=>{
  await spy(page);await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {playOwnedRewardCue,applyEffectsSettings,pauseGameAudio}=await import('/js/sound.js');
    const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js');
    const owner=createGameShellLifecycle();const settings={sound:true,soundVolume:.25};
    for(let i=0;i<30;i++)playOwnedRewardCue('reward',owner,settings);
    const bounded=owner.diagnostics().cleanup;
    applyEffectsSettings({sound:true,soundVolume:.6});const volume=window.lastRewardAudio.volume;
    applyEffectsSettings({sound:false});const muted=owner.diagnostics().cleanup;
    playOwnedRewardCue('openBox',owner,{sound:false});
    playOwnedRewardCue('star1',owner,{sound:true,soundVolume:0});
    playOwnedRewardCue('openBox',owner,settings);pauseGameAudio();
    const paused=owner.diagnostics().cleanup;owner.dispose();
    playOwnedRewardCue('star2',owner,settings);
    return{bounded,volume,muted,paused,resources:owner.diagnostics()};
  });
  expect(result.bounded).toBe(1);expect(result.volume).toBe(.6);expect(result.muted).toBe(0);expect(result.paused).toBe(0);
  expect((await played(page)).length).toBe(31);expect(result.resources.cleanup).toBe(0);
});

for(const reducedMotion of ['reduce','no-preference']) test(`real chest sounds only after successful grant (${reducedMotion})`,async({page})=>{
  await spy(page);await page.emulateMedia({reducedMotion});await seed(page,'memory-match');await open(page);
  expect(await played(page)).toEqual([]);
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();
  await expect.poll(()=>played(page)).toEqual(['open_box.ogg','reward.ogg']);
  expect((await snapshot(page,'memory-match')).coins).toBe(30);
  await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','success');
  await page.getByRole('button',{name:'Xong',exact:true}).click();
  await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);
  await open(page);expect(await played(page)).toEqual(['open_box.ogg','reward.ogg']);
});

test('failed chest grant plays no opening or reward sound',async({page})=>{
  await spy(page);await seed(page,'memory-match',{hints:999});await open(page);
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();
  await expect(page.locator('.treasure-error')).toBeVisible();
  expect(await played(page)).toEqual([]);
});

test('all supplied OGG assets decode in browser',async({page})=>{
  await page.goto('/');
  const durations=await page.evaluate(async()=>{
    const context=new AudioContext();
    try{return await Promise.all(['star_1','star_2','star_3','reward','open_box','explosion'].map(async name=>{
      const response=await fetch(`/assets/sounds/${name}.ogg`);if(!response.ok)throw Error(name);
      return(await context.decodeAudioData(await response.arrayBuffer())).duration;
    }));}finally{await context.close();}
  });
  expect(durations.every(value=>value>0 && value<10)).toBe(true);
});


test('native playback starts after a real gesture for all six cues',async({page})=>{
  await page.goto('/');await page.locator('#app-loading').waitFor({state:'detached'});
  await page.getByRole('button',{name:'Trò sau',exact:true}).click();
  const outcomes=await page.evaluate(async()=>{
    const {playOwnedRewardCue}=await import('/js/sound.js');
    const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js');
    const owner=createGameShellLifecycle();
    const original=HTMLMediaElement.prototype.play;
    const outcomes=[];
    HTMLMediaElement.prototype.play=function(){
      const audio=this;const file=audio.src.split('/').pop();
      if(!file.endsWith('.ogg'))return original.call(this);
      const promise=original.call(this);
      outcomes.push(promise.then(()=>({file,started:!audio.paused,duration:audio.duration})));
      return promise;
    };
    try {
      for(const cue of ['star1','star2','star3','reward','openBox','thunder'])playOwnedRewardCue(cue,owner,{sound:true,soundVolume:.2});
      return await Promise.all(outcomes);
    } finally {owner.dispose();HTMLMediaElement.prototype.play=original;}
  });
  expect(outcomes).toHaveLength(6);expect(outcomes.every(item=>item.started && item.duration>0)).toBe(true);
});

test('rejected play promises and backgrounding release audio ownership',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {playOwnedRewardCue}=await import('/js/sound.js');
    const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js');
    const owner=createGameShellLifecycle();const native=HTMLMediaElement.prototype.play;
    let rejectOld;
    HTMLMediaElement.prototype.play=()=>new Promise((resolve,reject)=>{rejectOld=reject;});
    playOwnedRewardCue('reward',owner,{sound:true,soundVolume:.4});
    HTMLMediaElement.prototype.play=()=>Promise.resolve();
    playOwnedRewardCue('reward',owner,{sound:true,soundVolume:.4});
    rejectOld(new DOMException('Blocked','NotAllowedError'));await Promise.resolve();
    const afterStaleRejection=owner.diagnostics().cleanup;
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
    const afterHidden=owner.diagnostics().cleanup;
    playOwnedRewardCue('star1',owner,{sound:true,soundVolume:.4});
    const hiddenPlay=owner.diagnostics().cleanup;
    delete document.hidden;
    HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('Blocked','NotAllowedError'));
    playOwnedRewardCue('openBox',owner,{sound:true,soundVolume:.4});await Promise.resolve();
    const afterRejection=owner.diagnostics().cleanup;
    owner.dispose();HTMLMediaElement.prototype.play=native;
    return{afterStaleRejection,afterHidden,hiddenPlay,afterRejection};
  });
  expect(result).toEqual({afterStaleRejection:1,afterHidden:0,hiddenPlay:0,afterRejection:0});
});

test('account changes cancel delayed summary cues',async({page})=>{
  await spy(page);await page.goto('/');await page.locator('#app-loading').waitFor({state:'detached'});
  await summary(page);
  await page.evaluate(async()=> (await import('/js/rankingOwner.js')).setRankingOwner({id:'changed',uid:'changed'}));
  await page.waitForTimeout(1900);expect(await played(page)).toEqual([]);
});

test('picture completion plays reward only once after claim',async({page})=>{
  await spy(page);await seed(page,'memory-match');
  await page.evaluate(async()=> (await import('/js/mainmenu.js')).showCollectionModal({gameId:'memory-match'}));
  await page.getByRole('tab',{name:'Tranh',exact:true}).click();
  await page.getByRole('button',{name:'Trước',exact:true}).click();
  await page.getByRole('button',{name:'Nhận 300 xu',exact:true}).click();
  await expect(page.locator('.mastery-collection')).toContainText('Đã nhận 300 xu');
  expect(await played(page)).toEqual(['reward.ogg']);
  await page.locator('#collection-modal .app-modal__close').click();
  await expect(page.locator('#collection-modal')).toHaveCount(0);
  expect(await page.evaluate(()=>window.rewardAudioEvents.filter(e=>e.kind==='pause').length)).toBe(1);
});

for(const motion of ['reduce','no-preference']) test(`thunder destruction uses explosion sound (${motion})`,async({page})=>{
  await spy(page);await page.emulateMedia({reducedMotion:motion});await page.goto('/');
  await page.evaluate(async()=>{
    await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    await(await import('/js/linkConnect/linkController.js')).startLinkLevel({mode:'easy',skipIntro:true});
    const {gameState}=await import('/js/gameState.js');gameState.progress.linkConnect.items.thunder=1;gameState.settings.sound=true;
  });
  await page.locator('#link-tools-toggle').click();await page.locator('[data-item="thunder"]').click();
  await expect.poll(()=>played(page)).toContain('explosion.ogg');
  await expect.poll(()=>page.evaluate(async()=>(await import('/js/linkConnect/linkState.js')).linkGameState.matchedPairs)).toBeGreaterThan(0);
});

for(const id of ['memory-match','link-connect']) for(const fail of [false,true]) test(`${id} special item reward sounds only after commit (failure=${fail})`,async({page})=>{
  await spy(page);await page.goto('/');
  await page.evaluate(async({id,fail})=>{
    await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const {gameState}=await import('/js/gameState.js');gameState.settings.mode='challenge';gameState.settings.sound=true;
    if(id==='memory-match')await(await import('/js/gameController.js')).startNewMemoryRun(1,{skipIntro:true});
    else await(await import('/js/linkConnect/linkController.js')).startLinkLevel({mode:'challenge',level:1,skipIntro:true});
    if(fail) {
      const key=(await import('/js/gameCatalog.js')).getGameProgressKey(id),original=IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put=function(value,...args){
        if(this.name==='profile' && (id==='memory-match' ? value.data?.progress[key]?.sessionsByMode.challenge?.specialProgress>=3 : value.data?.progress[key]?.sessionsByMode.challenge?.pairSnapshot?.matchedPairs>0))throw new DOMException('Test failure','QuotaExceededError');
        return original.call(this,value,...args);
      };
    }
    window.rewardAudioEvents=[];
    Math.random=()=>0;
    if(id==='memory-match') {
      const source=document.querySelector('#grid-container .tile');
      gameState.specialProgress=2;gameState.isLocked=false;
      await(await import('/js/memorySpecial.js')).handleMemorySpecialMatch(source,gameState.roundId);
    } else {
      const {linkGameState:s}=await import('/js/linkConnect/linkState.js');
      const connection=(await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(s.board.grid).find(({start,end})=>!s.board.grid[start.row][start.column].frozen && !s.board.grid[end.row][end.column].frozen);
      s.specialProgress=1;s.isLocked=false;
      for(const p of [connection.start,connection.end])s.board.grid[p.row][p.column]={...s.board.grid[p.row][p.column],special:true,premiumType:'blue',frozen:false};
      for(const p of [connection.start,connection.end])document.querySelector(`.link-board__cell[data-row="${p.row}"][data-column="${p.column}"] .link-tile`).click();
    }
  },{id,fail});
  if(fail) {
    await expect.poll(()=>page.evaluate(async()=>(await import('/js/persistence.js')).isPersistenceBlocked())).toBe(true);
    expect(await played(page)).toEqual([]);
  } else {
    await expect.poll(()=>played(page)).toEqual(['reward.ogg']);
    await page.waitForTimeout(500);expect(await played(page)).toEqual(['reward.ogg']);
  }
});

test('Triple milestone item reward has audio with reduced motion',async({page})=>{
  await spy(page);await page.goto('/');
  const witness=await page.evaluate(async()=>{
    await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect');
    const {gameState}=await import('/js/gameState.js');gameState.settings.sound=true;
    window.rewardRun=await(await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({mode:'easy',skipIntro:true});
    gameState.progress.tripleConnect.milestones={version:2,progress:5,cycleId:0,claimedIds:[]};
    window.rewardAudioEvents=[];
    return(await import('/js/tripleConnect/tripleSolver.js')).solveTripleState({initialState:window.rewardRun.getState(),maxNodes:10000,maxMemo:5000,deadlineMs:500}).witness;
  });
  for(const command of witness.slice(0,3)) {
    await page.locator(`.triple-connect__board [data-tile-id="${command.tileId}"]`).click();
    await page.evaluate(()=>window.rewardRun.whenIdle());
  }
  await expect.poll(()=>played(page)).toContain('reward.ogg');
});
