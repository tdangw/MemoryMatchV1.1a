import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
const baseline = execFileSync('git', ['show', '0b48266f990cee79f8aa6d9fc468dda9b5004e80:js/backgroundEffects.js'], { encoding: 'utf8' });
test('compare meteor allocation and frame samples with the original implementation', async ({ browser, baseURL }) => {
  test.setTimeout(100000);
  const samples = [];
  for (const variant of ['before', 'after']) {
    const context = await browser.newContext({ baseURL, reducedMotion: 'no-preference', serviceWorkers: 'block', viewport: { width: 412, height: 915 } });
    const page = await context.newPage(); await page.goto('/');
    await expect(page.locator('.meteor-layer')).toHaveCount(1);
    if (variant === 'before') await page.evaluate(async source => {
      (await import('/js/backgroundEffects.js')).disposeMeteorEffects();
      new Function(source.replace(/export /g, '') + '; initializeMeteorEffects(true);')();
    }, baseline);
    await page.evaluate(() => {
      window.profile = { frames: [], longTasks: [], added: 0, removed: 0, last: null };
      const frame = now => { if (window.profile.last !== null) window.profile.frames.push(now - window.profile.last); window.profile.last = now; window.profile.frame = requestAnimationFrame(frame); }; window.profile.frame = requestAnimationFrame(frame);
      window.profile.observer = new PerformanceObserver(list => { for (const entry of list.getEntries()) window.profile.longTasks.push(entry.duration); }); window.profile.observer.observe({ type: 'longtask' });
      window.profile.mutations = new MutationObserver(records => { for (const record of records) { for (const node of record.addedNodes) if (node.classList?.contains('shooting-star')) window.profile.added++; for (const node of record.removedNodes) if (node.classList?.contains('shooting-star')) window.profile.removed++; } }); window.profile.mutations.observe(document.body, { childList: true, subtree: true });
    });
    await page.waitForTimeout(35000);
    const data = await page.evaluate(() => { cancelAnimationFrame(window.profile.frame); window.profile.observer.disconnect(); window.profile.mutations.disconnect(); const sorted = window.profile.frames.sort((a, b) => a - b); return { frameP95: sorted[Math.floor(sorted.length * .95)], frames: sorted.length, longTasks: window.profile.longTasks, added: window.profile.added, removed: window.profile.removed, dpr: devicePixelRatio, browser: navigator.userAgent }; });
    if (variant === 'after') { expect(data.added).toBe(0); expect(data.removed).toBe(0); }
    else expect(data.added).toBeGreaterThan(0);
    await page.screenshot({ path: `test-results/meteor-${variant}.png` });
    samples.push({ variant, ...data }); await context.close();
  }
  console.log(JSON.stringify({ meteorProfile: samples }));
});
