const {test,expect}=require('@playwright/test');
const path=require('node:path'),fs=require('node:fs/promises');
const{ready,homeSkin,geometry,disableRemoteServices,installModuleAccess,freezeDevelopmentReloads,verificationContext}=require('./helpers.cjs');
const{startNatural,startMapLevel,solveNatural}=require('./natural-play.cjs');
test.setTimeout(180000);
for(const skin of ['default','woodland'])for(const game of ['memory-match','link-connect','triple-connect'])test(`natural rewards ${skin} ${game}`,async({page})=>{
  await freezeDevelopmentReloads(page);await disableRemoteServices(page);await installModuleAccess(page);await page.setViewportSize({width:412,height:915});await ready(page);await homeSkin(page,skin);
  await startNatural(page,game);await solveNatural(page,game);
  await expect(page.locator('.mastery-win-reward')).toContainText('+10 kinh nghiệm');await expect(page.locator('.mastery-win-reward')).toContainText('0 → 10/100');await geometry(page);
  await page.screenshot({path:path.join(__dirname,'qa',`natural-${skin}-${game}.png`),animations:'disabled'});
  const before=await page.evaluate(async game=>{const{gameState:s}=await window.productModule('/js/gameState.js');const key=(await window.productModule('/js/gameCatalog.js')).getGameProgressKey(game);return{coins:s.coins,best:s.progress[key].bestByLevel['easy:1']};},game);
  expect(before.best.completedWaves).toBe(2);expect(before.coins).toBeGreaterThan(0);
  await page.locator('#level-summary-modal').getByRole('button',{name:'Menu',exact:true}).click();await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  await startMapLevel(page);await solveNatural(page,game);await expect(page.locator('.mastery-win-reward')).toHaveCount(0);
  await page.reload();await page.locator('#app-loading').waitFor({state:'detached'});
  const after=await page.evaluate(async game=>{const{gameState:s}=await window.productModule('/js/gameState.js');const key=(await window.productModule('/js/gameCatalog.js')).getGameProgressKey(game);const {getMasteryRewards}=await window.productModule('/js/progression/masteryRewards.js');return {coins:s.coins,best:s.progress[key].bestByLevel['easy:1'],exp:getMasteryRewards({completed:s.progress[key].bestByLevel,level:1}).exp};},game);
  expect(after.exp).toBe(10);expect(after.best.completedWaves).toBe(2);await fs.writeFile(path.join(__dirname,'qa',`natural-${skin}-${game}.json`),JSON.stringify({verification:verificationContext(),before,after,scope:'real generated boards and DOM clicks; no completion or grant fixture'},null,2));
});
for(const skin of ['default','woodland'])for(const viewport of [{width:320,height:568},{width:412,height:915},{width:844,height:390},{width:1024,height:900}])test(`treasure presentation ${skin} ${viewport.width}`,async({page})=>{
  await freezeDevelopmentReloads(page);await disableRemoteServices(page);await installModuleAccess(page);await page.setViewportSize(viewport);await ready(page);await homeSkin(page,skin);
  for(const game of ['memory-match','link-connect','triple-connect']){
    await page.evaluate(async game=>{const{gameState:s}=await window.productModule('/js/gameState.js');const key=(await window.productModule('/js/gameCatalog.js')).getGameProgressKey(game);const profile=s.progress[key];const best=Object.fromEntries(['easy','normal','hard','superHard'].flatMap(mode=>Array.from({length:10},(_,i)=>[`${mode}:${i+1}`,{score:100,stars:1,cleared:true,rulesVersion:1,completedWaves:2}])));profile.bestByLevel=best;profile.claimedChests={};profile.items.hint=0;profile.adventure=(await window.productModule('/js/adventureProgress.js')).getAdventureSummary(best);s.coins=0;if(!await(await window.productModule('/js/persistence.js')).savePersistentGameData({progress:s.progress,coins:0}))throw Error('Fixture save failed');},game);
    await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();await page.locator('[data-chest="1"]').click();await expect(page.locator('.treasure-card')).toHaveCount(4);
    if(skin==='woodland')await expect(page.locator('#adventure-chest-modal .treasure-skin-image')).toHaveCount(10);else await expect(page.locator('#adventure-chest-modal .treasure-skin-image')).toHaveCount(0);
    await page.locator('[data-treasure-tier="S"]').click();await expect(page.locator('.treasure-status')).toContainText('Mở Rương Mầm Non trước');await geometry(page);
    await page.screenshot({path:path.join(__dirname,'qa',`treasure-${skin}-${viewport.width}-${game}-waiting.png`),animations:'disabled'});
    let coins=0,hints=0;
    for(const [tier,grant,count]of[['C',30,1],['B',60,2],['A',100,3],['S',160,4]]){
      await page.locator(`[data-treasure-tier="${tier}"]`).click();await page.getByRole('button',{name:'Mở rương',exact:true}).click();await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','success');coins+=grant;hints+=count;
      expect(await page.evaluate(async game=>{const{gameState:s}=await window.productModule('/js/gameState.js');const key=(await window.productModule('/js/gameCatalog.js')).getGameProgressKey(game);return{coins:s.coins,hints:s.progress[key].items.hint};},game)).toEqual({coins,hints});
      await geometry(page);await page.screenshot({path:path.join(__dirname,'qa',`treasure-${skin}-${viewport.width}-${game}-${tier}.png`),animations:'disabled'});
    }
    await page.getByRole('button',{name:'Bộ sưu tập tranh',exact:true}).click();await expect(page.getByRole('button',{name:'Nhận 300 xu',exact:true})).toBeVisible();await page.getByRole('button',{name:'Xem tranh',exact:true}).click();await expect(page.locator('.mastery-painting')).toBeVisible();await expect.poll(()=>page.locator('.mastery-painting').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);await geometry(page);await page.screenshot({path:path.join(__dirname,'qa',`painting-${skin}-${viewport.width}-${game}.png`),animations:'disabled'});await page.keyboard.press('Escape');await expect(page.locator('#mastery-painting-modal')).toHaveCount(0);
    await page.getByRole('button',{name:'Nhận 300 xu',exact:true}).click();await expect(page.locator('.mastery-collection')).toContainText('Đã nhận 300 xu');expect(await page.evaluate(async()=> (await window.productModule('/js/gameState.js')).gameState.coins)).toBe(650);
    await page.locator('#treasure-collection-modal .app-modal__close').click();await expect(page.locator('#treasure-collection-modal')).toHaveCount(0);await page.locator('[data-chest="1"]').click();await expect(page.locator('[data-treasure-tier="S"]')).toHaveClass(/is-claimed/);await expect(page.getByRole('button',{name:'Mở rương',exact:true})).toHaveCount(0);await page.locator('#adventure-chest-modal .app-modal__close').click();await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);
    await page.locator('#menu-container .adventure-exit').click();await expect(page.locator('.game-selector')).toBeVisible();
  }
});


