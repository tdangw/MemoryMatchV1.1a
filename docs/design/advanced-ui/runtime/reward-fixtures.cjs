const{expect}=require('@playwright/test');
async function seedTreasure(page,game='memory-match'){
  await page.evaluate(async game=>{const{gameState:s}=await window.productModule('/js/gameState.js');const key=(await window.productModule('/js/gameCatalog.js')).getGameProgressKey(game),p=s.progress[key];p.bestByLevel=Object.fromEntries(['easy','normal','hard','superHard'].flatMap(mode=>Array.from({length:10},(_,i)=>[`${mode}:${i+1}`,{score:100,stars:1,cleared:true,rulesVersion:1,completedWaves:2}])));p.claimedChests={};p.items.hint=0;p.adventure=(await window.productModule('/js/adventureProgress.js')).getAdventureSummary(p.bestByLevel);s.coins=0;if(!await(await window.productModule('/js/persistence.js')).savePersistentGameData({progress:s.progress,coins:0}))throw Error('Fixture save failed');},game);
  await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
}
async function openTreasure(page){await page.locator('[data-chest="1"]').click();await expect(page.locator('.treasure-card')).toHaveCount(4);await page.locator('[data-treasure-tier="C"]').click();}
async function rewardSnapshot(page){return page.evaluate(async()=>{const{gameState:s}=await window.productModule('/js/gameState.js');return{coins:s.coins,hints:s.progress.memoryMatch.items.hint,receipt:s.progress.memoryMatch.claimedChests[1]};});}
module.exports={seedTreasure,openTreasure,rewardSnapshot};
