import {test,expect} from '@playwright/test';

import {seed,open,snapshot} from './helpers/treasureFixtures.js';
for(const id of ['memory-match','link-connect','triple-connect']) test(`${id} opens each exact tier through real marker and buttons`,async({page})=>{
  await page.setViewportSize({width:412,height:915});await seed(page,id);await open(page);
  const position=await page.locator('.adventure-map-scroll').evaluate(el=>el.scrollTop);
  for(const [i,tier] of ['C','B','A','S'].entries()){
    if(i) await page.getByRole('button',{name:'Xem rương tiếp',exact:true}).click();
    await expect(page.locator('.treasure-detail')).toHaveAttribute('data-selected-tier',tier);
    await page.getByRole('button',{name:'Mở rương',exact:true}).dblclick();
    await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','success');
    await expect(page.locator('.treasure-status')).toContainText('Bạn đã mở');
    await expect(page.locator('.treasure-detail')).toHaveAttribute('data-selected-tier',tier);
    const state=await snapshot(page,id);expect(state.coins).toBe([30,90,190,350][i]);expect(state.hints).toBe([1,3,6,10][i]);expect(state.receipt.tiers[tier]).toBeTruthy();
    expect(await page.locator('.adventure-map-scroll').evaluate(el=>el.scrollTop)).toBe(position);
  }
  await page.getByRole('button',{name:'Xong',exact:true}).click();await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);
  await open(page);await expect(page.locator('.treasure-card.is-claimed')).toHaveCount(4);await expect(page.locator('.treasure-status')).toContainText('Đã mở trọn bộ');
  await page.reload();await page.evaluate(async id=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id),id);await open(page);
  await expect(page.locator('.treasure-card.is-claimed')).toHaveCount(4);expect((await snapshot(page,id)).coins).toBe(350);
});

test('incomplete chest navigates to the unlocked preview and inventory failure stays retryable',async({page})=>{
  await seed(page,'memory-match',{count:7,all:false});await open(page);
  await expect(page.locator('.treasure-status')).toContainText('Còn 3 màn Dễ');
  await page.getByRole('button',{name:'Chơi tiếp',exact:true}).click();
  await expect(page.locator('#adventure-level-modal .app-modal__title')).toContainText('Màn 8 · Dễ');
  await expect(page.locator('#adventure-level-modal input[value="easy"]')).toBeChecked();
  await page.locator('#adventure-level-modal .app-modal__close').click();
  await seed(page,'memory-match',{hints:999});await open(page);
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();
  await expect(page.locator('.treasure-error')).toContainText('Hãy dùng bớt Gợi ý');
  expect((await snapshot(page,'memory-match')).coins).toBe(0);
  await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeEnabled();
});

test('the tenth first win shows the real EXP delta and opens treasure without forcing the next level',async({page})=>{
  await seed(page,'memory-match',{count:9,all:false});
  await page.evaluate(async()=>{
    const {gameState,recordMemoryMatchResult}=await import('/js/gameState.js');
    const {createWaveProgress,completeWave,activateNextWave}=await import('/js/progression/waveProgress.js');
    let wave=createWaveProgress({attemptId:'summary-tenth',gameId:'memory-match',mode:'easy',level:10,groupsPerWave:6});
    wave=activateNextWave(completeWave(wave,{score:60,moves:12,misses:0,matchedGroups:6}).progress);
    wave=completeWave(wave,{score:120,moves:24,misses:0,matchedGroups:6}).progress;
    const result=recordMemoryMatchResult({mode:'easy',level:10,score:120,stars:1,wave});
    await (await import('/js/persistence.js')).savePersistentGameData({progress:gameState.progress});
    (await import('/js/ui.js')).showLevelSummaryOverlay({level:10,remainingTime:30,moves:24,misses:0,coinsEarned:24,score:120,stars:1,timeBonus:0,mastery:result.mastery,
      onMenu:()=>(import('/js/gameSelector.js').then(module=>module.openGameMenu('memory-match')))});
  });
  await expect(page.locator('.mastery-win-reward')).toContainText('+10 kinh nghiệm');
  await expect(page.locator('.mastery-win-reward')).toContainText('Rương Mầm Non · 90 → 100/100');
  await page.getByRole('button',{name:'Xem kho báu',exact:true}).click();
  await expect(page.locator('.treasure-card')).toHaveCount(4);
  await expect(page.getByRole('button',{name:'Mở rương',exact:true})).toBeVisible();
});

for(const stale of [false,true]) test(`summary treasure navigation rejection is handled${stale?' without feedback on a newer page':''}`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await seed(page,'memory-match',{count:10,all:false});
  await page.evaluate(async()=>{
    (await import('/js/ui.js')).showLevelSummaryOverlay({level:10,remainingTime:30,moves:24,misses:0,coinsEarned:24,score:120,stars:1,timeBonus:0,
      mastery:{expGained:10,fragmentGained:false,gameId:'memory-match',block:1,tier:'C',beforeExp:90,afterExp:100},
      onMenu:()=>new Promise((resolve,reject)=>{window.rejectTreasureNavigation=()=>reject(Error('Navigation unavailable'));})});
  });
  await expect(page.locator('.mastery-win-status')).toHaveText('Rương Mầm Non đã sẵn sàng!');
  await page.getByRole('button',{name:'Xem kho báu',exact:true}).click();
  await page.waitForFunction(()=>typeof window.rejectTreasureNavigation==='function');
  if(stale)await page.evaluate(async()=> (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect'));
  await page.evaluate(()=>window.rejectTreasureNavigation());
  if(stale)await expect(page.locator('.app-toast')).toHaveCount(0);
  else await expect(page.locator('.app-toast')).toContainText('Chưa mở được kho báu');
  expect(errors).toEqual([]);expect((await snapshot(page,'memory-match')).coins).toBe(0);
});
