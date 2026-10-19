import { test, expect } from '@playwright/test';

test('previous test progress resets once and new gameplay survives reload',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('memoryMatchSave',JSON.stringify({formatVersion:1,revision:1,data:{coins:999,progress:{memoryMatch:{bestByLevel:{'easy:999':{score:500,stars:3}}}},appearance:{},settings:{sound:false}}})));
  await page.goto('/');
  await page.evaluate(async()=> (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  const reset=await page.evaluate(async()=>{
    const {gameState}=await import('/js/gameState.js');
    const result={coins:gameState.coins,season:gameState.progress.gameplaySeason,best:gameState.progress.memoryMatch.bestByLevel};
    gameState.coins=77;
    await(await import('/js/persistence.js')).savePersistentGameData({coins:77});
    return result;
  });
  expect(reset).toEqual({coins:0,season:1,best:{}});
  await page.reload();
  await page.evaluate(async()=> (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  expect(await page.evaluate(async()=> (await import('/js/gameState.js')).gameState.coins)).toBe(77);
});
