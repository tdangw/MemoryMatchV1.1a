import { expect, test } from '@playwright/test';
for (const viewport of [{width:412,height:915},{width:844,height:390},{width:1024,height:900}]) test(`map exit attaches to header at ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); await page.goto('/');
  for (const game of ['memory-match','link-connect','triple-connect']) {
    await page.evaluate(async game => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game), game);
    const header = page.locator('.adventure-map-page .adventure-header');
    const exit = header.locator('.adventure-exit');
    const h = await header.boundingBox(), b = await exit.boundingBox();
    expect(Math.abs(b.x+b.width-h.x-h.width)).toBeLessThan(1); expect(b.y).toBe(h.y); expect(b.height).toBe(60);
    await expect(exit).toHaveCSS('border-radius','0px');
    await page.locator('.adventure-map-scroll').evaluate(el => el.scrollTop = 500);
    expect((await exit.boundingBox()).y).toBe(b.y);
    await exit.click(); await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  }
});
