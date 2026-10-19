import { test, expect } from '@playwright/test';

for (const gameId of ['memory-match','link-connect','triple-connect']) {
  test(`${gameId} claims four chests and one complete picture without duplicate grants`, async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async id => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      const { gameState } = await import('/js/gameState.js');
      const key = (await import('/js/gameCatalog.js')).getGameProgressKey(id);
      const best = Object.fromEntries(['easy','normal','hard','superHard'].flatMap(mode => Array.from({ length:10 },(_,i) => [`${mode}:${i+1}`, { score:200, stars:2, cleared:true, rulesVersion:1, completedWaves:2 }])));
      gameState.progress[key].bestByLevel = best;
      gameState.progress[key].adventure = (await import('/js/adventureProgress.js')).getAdventureSummary(best);
      gameState.coins = 0;
      if (!await (await import('/js/persistence.js')).savePersistentGameData({ progress:gameState.progress, coins:0 })) throw new Error('Fixture save failed');
      const { claimAdventureChest } = await import('/js/adventureRewards.js');
      window.claimedTiers = [];
      for (let i=0;i<4;i++) window.claimedTiers.push((await claimAdventureChest(id,1)).tier);
      if (await claimAdventureChest(id,1)) throw new Error('Duplicate chest granted');
      await (await import('/js/mainmenu.js')).showCollectionModal({ gameId:id });
    }, gameId);
    expect(await page.evaluate(() => window.claimedTiers)).toEqual(['C','B','A','S']);
    await page.getByRole('tab',{ name:'Tranh', exact:true }).click();
    await expect(page.locator('.mastery-collection__piece.is-earned')).toHaveCount(0);
    await page.getByRole('button',{name:'Trước',exact:true}).click();
    await expect(page.locator('.mastery-collection__piece.is-earned')).toHaveCount(10);
    await page.getByRole('button',{name:'Nhận 300 xu',exact:true}).click();
    await expect(page.locator('.mastery-collection')).toContainText('Đã nhận 300 xu');
    expect(await page.evaluate(async () => (await import('/js/gameState.js')).gameState.coins)).toBe(650);
    for (const [width,height] of [[320,568],[412,915],[844,390],[1024,900]]) {
      await page.setViewportSize({width,height});
      await expect(page.locator('.mastery-collection__pieces')).toBeVisible();
      const overflow = await page.locator('#collection-modal .app-modal').evaluate(el => el.scrollWidth > el.clientWidth + 1);
      expect(overflow).toBe(false);
      await page.locator('#collection-modal').screenshot({path:`docs/qa/gameplay-progression/collection-${gameId}-${width}.png`});
    }
    await page.locator('#collection-modal .app-modal__close').click();
    const duplicate = await page.evaluate(async id => (await import('/js/adventureRewards.js')).claimAdventureCollection(id,1),gameId);
    expect(duplicate).toBeNull();
  });
}
