import {expect} from '@playwright/test';
export async function seed(page,id,{count=10,all=true,hints=0}={}) {
  await page.goto('/');
  await page.evaluate(async ({id,count,all,hints})=>{
    const {openReadyGameMenu}=await import('/tests/ui/helpers/gameNavigation.js');await openReadyGameMenu(id);
    const {gameState}=await import('/js/gameState.js'),key=(await import('/js/gameCatalog.js')).getGameProgressKey(id);
    const best=Object.fromEntries((all?['easy','normal','hard','superHard']:['easy']).flatMap(mode=>Array.from({length:count},(_,i)=>[`${mode}:${i+1}`,{score:100,stars:1,cleared:true,rulesVersion:1,completedWaves:2}])));
    const profile=gameState.progress[key];profile.bestByLevel=best;profile.claimedChests={};profile.items.hint=hints;
    profile.adventure=(await import('/js/adventureProgress.js')).getAdventureSummary(best);gameState.coins=0;
    if(!await (await import('/js/persistence.js')).savePersistentGameData({progress:gameState.progress,coins:0}))throw Error('Fixture save failed');
    await openReadyGameMenu(id);
  },{id,count,all,hints});
}
export async function open(page){await page.locator('[data-chest="1"]').click();await expect(page.locator('.treasure-card')).toHaveCount(4);}
export const snapshot=(page,id)=>page.evaluate(async id=>{
  const {gameState}=await import('/js/gameState.js'),key=(await import('/js/gameCatalog.js')).getGameProgressKey(id);
  return{coins:gameState.coins,hints:gameState.progress[key].items.hint,receipt:gameState.progress[key].claimedChests[1]};
},id);
