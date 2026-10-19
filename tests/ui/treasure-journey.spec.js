import {test,expect} from '@playwright/test';

async function seed(page,id,{count=10,all=true,hints=0}={}) {
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
async function open(page){await page.locator('[data-chest="1"]').click();await expect(page.locator('.treasure-card')).toHaveCount(4);}
const snapshot=(page,id)=>page.evaluate(async id=>{
  const {gameState}=await import('/js/gameState.js'),key=(await import('/js/gameCatalog.js')).getGameProgressKey(id);
  return{coins:gameState.coins,hints:gameState.progress[key].items.hint,receipt:gameState.progress[key].claimedChests[1]};
},id);
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
