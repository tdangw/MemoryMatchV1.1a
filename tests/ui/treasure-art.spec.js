import { test, expect } from '@playwright/test';

test('treasure art and six presentation states at phone size', async ({ page }) => {
  await page.setViewportSize({width:412,height:915}); await page.goto('/');
  for (const state of ['empty','progress','ready','waiting','claimed','complete']) {
    await page.evaluate(async state => {
      const {TREASURE_CATALOG} = await import('/js/progression/treasureCatalog.js');
      const {renderTreasureContent} = await import('/js/progression/treasureView.js');
      const {openAppModal} = await import('/js/modal.js');
      const exp = state === 'empty' ? 0 : state === 'progress' ? 70 : 100;
      const view = {firstLevel:1,lastLevel:10,activeTier:state === 'complete' ? null : 'C',allClaimed:state === 'complete',chests:TREASURE_CATALOG.map((item,i)=>({...item,exp,completedLevels:exp/10,
        state:state === 'complete'||state === 'claimed'&&i===0 ? 'claimed' : exp <100 ? 'progress' : i===0 ? 'ready' : 'waiting',
        previousName:TREASURE_CATALOG[Math.max(0,i-1)].name,reward:{coins:[30,60,100,160][i],hints:i+1}}))};
      const content=document.createElement('div'); renderTreasureContent(content,view,{selected:state==='waiting'?'S':'C'});
      const modal=openAppModal({id:'treasure-sample',title:'Kho báu hành trình',content,alignment:'center'});modal.panel.classList.add('treasure-dialog');
    },state);
    await expect(page.locator('.treasure-card')).toHaveCount(4);
    await expect(page.locator('.treasure-detail')).toBeVisible();
    expect(await page.locator('.treasure-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await page.locator('#treasure-sample').screenshot({path:`docs/qa/gameplay-progression/treasure-sample-${state}.png`});
  }
});
