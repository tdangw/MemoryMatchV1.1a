import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const folder = 'docs/design/ui-images/qa';
test('first reward remains readable when the new images cannot be fetched', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.route('**/assets/images/ui/v1/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ level: 999, score: 275, stars: 3, coinsEarned: 18, remainingTime: 77, settings: {} }));
  const panel = page.locator('#level-summary-modal [data-ui-surface="reward"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.level-summary__stat')).toHaveCount(3);
  await expect(panel.locator('svg image')).toHaveCount(0);
  await expect(panel.locator('.level-summary__stars svg path')).toHaveCount(3);
  await expect(panel).toHaveCSS('background-color', 'rgb(245, 219, 163)');
  await expect(panel.locator('.summary-points strong')).toHaveText('275');
  await expect(panel.locator('.summary-points strong')).toHaveCSS('background-color', 'rgb(104, 64, 25)');
  await expect(panel.locator('.app-button--primary')).toHaveCSS('background-color', 'rgb(181, 223, 110)');
  await page.screenshot({ path: `${folder}/unavailable-images-412.png` });
  await panel.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.locator('#level-summary-modal')).toHaveCount(0);
});

test('painted static chrome has bounded loading and sampled frame cost', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  const sample = async () => page.evaluate(async () => {
    const frames = []; let last = performance.now();
    for (let i = 0; i < 120; i++) await new Promise(resolve => requestAnimationFrame(now => { frames.push(now-last); last=now; resolve(); }));
    frames.shift(); frames.sort((a,b) => a-b);
    return { meanMs: frames.reduce((a,b)=>a+b,0)/frames.length, p95Ms: frames[Math.floor(frames.length*.95)], maximumMs: frames.at(-1) };
  });
  const loaded = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.name.includes('/ui/v1/')).map(entry => ({ url: new URL(entry.name).pathname, bytes: entry.encodedBodySize })));
  expect(new Set(loaded.map(entry => entry.url)).size).toBeLessThan(56);
  const artOn = await sample();
  const override = await page.addStyleTag({ content: '.adventure-dock,.adventure-dock button,.game-selector__label{border-image-source:none!important;background-image:none!important}.adventure-dock image{visibility:hidden}' });
  const artOff = await sample();
  await override.evaluate(node => node.remove());
  // Observations are machine-local; no mobile 60FPS claim or brittle timing gate.
  writeFileSync(`${folder}/performance.json`, JSON.stringify({ viewport: '412x915', framesPerSample: 119, scenario: 'Home with existing animated banner, static image chrome on/off; desktop Chrome', loaded, loadedBytes: loaded.reduce((sum,entry)=>sum+entry.bytes,0), artOn, artOff }, null, 2));
});
