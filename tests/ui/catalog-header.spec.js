import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('docs/design/popups/qa',{recursive:true});
for(const viewport of [{width:320,height:740},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]) test(`catalog exits and centered wallet at ${viewport.width}`,async ({page})=>{
  await page.setViewportSize(viewport); await page.goto('/');
  for(const game of ['memory-match','link-connect','triple-connect']) {
    await page.evaluate(async game=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game),game);
    for(const action of ['shop','collection','ranking','settings']) {
      await page.locator(`.adventure-page:not([hidden]) [data-dock-action="${action}"]`).click();
      const screen=page.locator('.adventure-screen'), header=screen.locator('.app-modal__header'), exit=screen.locator(':scope > .adventure-exit');
      const h=await header.boundingBox(), e=await exit.boundingBox(); expect(e.y).toBe(h.y); expect(e.height).toBe(h.height); expect(Math.abs(e.x+e.width-h.x-h.width)).toBeLessThan(1);
      await expect(exit).toHaveCSS('border-radius','0px'); expect(e.width).toBeGreaterThanOrEqual(44);
      if(action==='shop') {
        await expect(screen.locator('.app-wallet')).toBeVisible();
        const wallet=screen.locator('.app-wallet'), w=await wallet.boundingBox(), title=await screen.locator('.app-modal__title').boundingBox();
        expect(Math.abs(w.x+w.width/2-h.x-h.width/2)).toBeLessThan(1); expect(title.x+title.width).toBeLessThanOrEqual(w.x); expect(w.x+w.width).toBeLessThanOrEqual(e.x);
        await page.evaluate(async()=>{const {gameState}=await import('/js/gameState.js');gameState.coins=123456789; (await import('/js/ui.js')).updateCoinDisplay(gameState.coins);});
        await expect(wallet.locator('[data-shop-coin-balance]')).toHaveText('123456789');
        const big=await wallet.boundingBox(); expect(big.x+big.width).toBeLessThanOrEqual(e.x); expect(title.x+title.width).toBeLessThanOrEqual(big.x);
      }
      if(action==='collection') await expect(screen.locator('.app-modal__title')).toHaveText('Bộ sưu tập');
      await screen.locator('.app-modal__body').evaluate(el=>el.scrollTop=el.scrollHeight); expect((await exit.boundingBox()).y).toBe(e.y);
      if(game==='link-connect' && ['shop','collection'].includes(action)) await page.screenshot({path:`docs/design/popups/qa/${action}-header-${viewport.width}.png`,animations:'disabled'});
    }
    await page.locator('.adventure-screen > .adventure-exit').click(); await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  }
});
