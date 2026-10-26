import {test, expect} from '@playwright/test';

test('built startup assets load and a warmed Home reloads offline', async ({browser}) => {
  test.skip(process.env.GAME_SHELL_TEST_SERVER !== 'preview', 'Requires the production service worker build.');
  test.setTimeout(90000);
  const context = await browser.newContext({serviceWorkers:'allow', viewport:{width:412,height:915}});
  try {
    await context.route(/googleapis\.com|google-analytics\.com|googletagmanager\.com/, route => route.abort());
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.goto('/');
    await expect(page.locator('#app-loading')).toHaveCount(0, {timeout:20000});
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    // Populate the controlling worker's asset cache, not only the HTTP cache.
    await page.reload();
    await expect(page.locator('#app-loading')).toHaveCount(0);
    await expect.poll(() => page.evaluate(async () => {
      const cache = await caches.open('memory-match-assets-v2');
      const urls = (await cache.keys()).map(request => request.url);
      return urls.some(url => /\/assets\/main-.*\.js/.test(url)) && urls.some(url => url.endsWith('/assets/images/home/memory-match-v2.webp'));
    })).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#app-loading')).toHaveCount(0, {timeout:20000});
    await expect(page.locator('.game-selector__choice')).toHaveCount(3);
    expect(failures).toEqual([]);
  } finally {await context.close();}
});
