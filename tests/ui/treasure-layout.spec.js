import {test,expect} from '@playwright/test';
import {seed,open,snapshot} from './helpers/treasureFixtures.js';

for(const [width,height] of [[412,915],[844,390],[1024,900],[320,568]]) for(const id of ['memory-match','link-connect','triple-connect']) {
  test(`${id} treasure states fit ${width}x${height} with safe banner and keyboard`,async({page})=>{
    test.setTimeout(90000);await page.setViewportSize({width,height});await seed(page,id);
    for(const state of ['empty','progress','ready','waiting','claimed','complete']) {
      await page.evaluate(async ({id,state})=>{
        const {gameState}=await import('/js/gameState.js'),key=(await import('/js/gameCatalog.js')).getGameProgressKey(id);
        const count=state==='empty'?0:state==='progress'?7:10;
        const best=Object.fromEntries(['easy','normal','hard','superHard'].flatMap(mode=>Array.from({length:count},(_,i)=>[`${mode}:${i+1}`,{score:100,stars:1,cleared:true,rulesVersion:1,completedWaves:2}])));
        const profile=gameState.progress[key];profile.bestByLevel=best;profile.adventure=(await import('/js/adventureProgress.js')).getAdventureSummary(best);
        const tiers={};if(state==='claimed'||state==='complete') for(const tier of state==='complete'?['C','B','A','S']:['C']) tiers[tier]={catalogVersion:2,tier,claimedAt:1,grants:[{type:'coins',amount:30}]};
        profile.claimedChests=Object.keys(tiers).length?{1:{rulesVersion:1,tiers}}:{};
        await (await import('/js/persistence.js')).savePersistentGameData({progress:gameState.progress});
        await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      },{id,state});
      await open(page);
      if(state==='waiting')await page.locator('[data-treasure-tier="S"]').click();
      if(state==='claimed')await page.locator('[data-treasure-tier="C"]').click();
      await expect(page.locator('.treasure-card')).toHaveCount(4);
      const boxes=await page.locator('.treasure-dialog').evaluate(el=>{
        const panel=el.getBoundingClientRect(),body=el.querySelector('.app-modal__body');
        return {panel:{left:panel.left,right:panel.right,top:panel.top,bottom:panel.bottom},overflow:el.scrollWidth-el.clientWidth,bodyOverflow:body.scrollWidth-body.clientWidth};
      });
      expect(boxes.overflow).toBeLessThanOrEqual(1);expect(boxes.bodyOverflow).toBeLessThanOrEqual(1);
      expect(boxes.panel.left).toBeGreaterThanOrEqual(0);expect(boxes.panel.right).toBeLessThanOrEqual(width+1);expect(boxes.panel.top).toBeGreaterThanOrEqual(0);expect(boxes.panel.bottom).toBeLessThanOrEqual(height+1);
      for(const card of await page.locator('.treasure-card').all()) await expect(card).toBeVisible();
      const primary=page.locator('.treasure-actions button').first();await primary.scrollIntoViewIfNeeded();await expect(primary).toBeInViewport();
      await page.locator('[data-treasure-tier="S"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.treasure-detail')).toHaveAttribute('data-selected-tier','S');
      await page.locator('[data-treasure-tier="'+(['waiting','complete'].includes(state)?'S':'C')+'"]').click();
      if(width===844) {
        for(const selector of ['.treasure-card:first-child','.treasure-card:last-child','.treasure-collection-link']){
          const control=page.locator(selector);await control.scrollIntoViewIfNeeded();await expect(control).toBeInViewport();
        }
      }
      await page.locator('#adventure-chest-modal').screenshot({path:`docs/qa/gameplay-progression/treasure-${id}-${width}-${state}.png`});
      await page.locator('.adventure-screen[data-screen=treasure] > .adventure-exit').click();await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);
    }
    // Large text remains scrollable without cutting off long names or the action.
    await page.addStyleTag({content:'.treasure-content {font-size:20px} .treasure-card strong {font-size:17px} .treasure-status {font-size:18px}'});
    await open(page);await page.locator('.treasure-actions button').first().scrollIntoViewIfNeeded();
    expect(await page.locator('.treasure-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  });
}

test('native chest art and reward icons remain usable when all raster images fail',async({page})=>{
  await page.route(/\.(webp|png|jpg)(\?.*)?$/,route=>route.abort());
  await seed(page,'memory-match');await open(page);
  await expect(page.locator('.treasure-hero svg path').first()).toBeVisible();
  await page.getByRole('button',{name:'Mở rương',exact:true}).click();await expect(page.locator('.treasure-content')).toHaveAttribute('data-phase','success');
  expect((await snapshot(page,'memory-match')).coins).toBe(30);
});

test.describe('high density chest artwork',()=>{
  test.use({deviceScaleFactor:3});
  test('SVG detail stays vector and contained at DPR 3',async({page})=>{
    await page.setViewportSize({width:412,height:915});await seed(page,'triple-connect');await open(page);
    await page.locator('[data-treasure-tier="S"]').click();
    expect(await page.evaluate(()=>devicePixelRatio)).toBe(3);
    await expect(page.locator('.treasure-hero svg')).toHaveAttribute('viewBox','0 0 180 145');
    await page.locator('#adventure-chest-modal').screenshot({path:'docs/qa/gameplay-progression/treasure-dpr3.png'});
  });
});
