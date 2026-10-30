import { test, expect } from '@playwright/test';

test('map treasure and collection dots follow claim state, stay on their own icons and clean up',async({page})=>{
  test.setTimeout(90000);await page.goto('/');
  for(const game of ['memory-match','link-connect','triple-connect']){
    await page.evaluate(async game=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game),game);
    for(const viewport of [{width:320,height:640},{width:412,height:915},{width:844,height:390}]){
      await page.setViewportSize(viewport);
      await page.evaluate(async game=>{
        const {gameState}=await import('/js/gameState.js');
        const key=(await import('/js/gameCatalog.js')).getGameDefinition(game).progressKey;
        const profile=gameState.progress[key],block=Number(document.querySelector('.treasure-map-card').dataset.block);
        window.dotFixture={profile,block};profile.claimedChests[block]={};
        for(const mode of ['easy','normal','hard','superHard'])for(let level=(block-1)*10+1;level<=block*10;level++)profile.bestByLevel[`${mode}:${level}`]={cleared:true,rulesVersion:1};
        dispatchEvent(new Event('resize'));
      },game);
      for(const selector of ['.treasure-map-card','[data-map-destination="collection"]']){
        const button=page.locator(selector);await expect(button).toHaveAttribute('data-reward-ready','true');
        const dot=button.locator('.adventure-reward-dot');await expect(dot).toBeVisible();
        const a=await button.boundingBox(),b=await dot.boundingBox();
        expect(b.x).toBeGreaterThanOrEqual(a.x);expect(b.y).toBeGreaterThanOrEqual(a.y);
        expect(b.x+b.width).toBeLessThanOrEqual(a.x+a.width);expect(b.y+b.height).toBeLessThanOrEqual(a.y+a.height);
      }
      await page.evaluate(()=>{const {profile,block}=window.dotFixture;profile.claimedChests[block]={rulesVersion:1,tiers:{C:{},B:{},A:{},S:{}},collection:{}};dispatchEvent(new Event('resize'));});
      await expect(page.locator('.treasure-map-card .adventure-reward-dot')).toBeHidden();
      await expect(page.locator('[data-map-destination="collection"] .adventure-reward-dot')).toBeHidden();
    }
    await page.locator('#menu-container .adventure-header .adventure-exit').click();
    await expect(page.locator('.adventure-reward-dot')).toHaveCount(0);
  }
});
