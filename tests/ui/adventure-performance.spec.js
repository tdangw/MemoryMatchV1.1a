import { expect, test } from '@playwright/test';
test('map mode/scroll remains bounded and captures cold/warm transfer and frame evidence', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.addInitScript(() => {
    window.__longTasks = [];
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(item => item.duration))).observe({ type: 'longtask', buffered: true });
  });
  await page.goto('/');
  const cold = await page.evaluate(() => performance.getEntriesByType('resource').reduce((sum, item) => sum + item.transferSize, 0));
  await page.reload();
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  const sample = await page.evaluate(async () => {
    const lifecycle = await import('/js/appPageLifecycle.js');
    const baseline = lifecycle.getAppPageScope().diagnostics();
    const node = document.querySelector('[data-level="1"]');
    const timings = [];
    for (let i = 0; i < 40; i++) {
      document.querySelector(".adventure-mode-toggle").click();
      const started = performance.now();
      document.querySelector(`[data-mode="${i % 2 ? 'easy' : 'hard'}"]`).click();
      document.querySelector('.adventure-map-scroll').scrollTop = i % 2 ? 1500 : 0;
      timings.push(performance.now() - started);
      await new Promise(requestAnimationFrame);
    }
    const frames = [];
    let previous = performance.now();
    for (let i = 0; i < 60; i++) await new Promise(resolve => requestAnimationFrame(time => { frames.push(time - previous); previous = time; resolve(); }));
    return { baseline, final: lifecycle.getAppPageScope().diagnostics(), sameNode: node === document.querySelector('[data-level="1"]'), timings, frames, longTasks: window.__longTasks, nodes: document.querySelectorAll('*').length, warmTransfer: performance.getEntriesByType('resource').reduce((sum, item) => sum + item.transferSize, 0) };
  });
  expect(sample.sameNode).toBe(true);
  expect(sample.final).toEqual(sample.baseline);
  expect(sample.nodes).toBeLessThan(2000);
  const percentile = values => [...values].sort((a, b) => a - b)[Math.floor(values.length * .95)];
  const evidence = { coldTransfer: cold, warmTransfer: sample.warmTransfer, modePatchP95: percentile(sample.timings), frameP95: percentile(sample.frames), longTasks: sample.longTasks, nodes: sample.nodes };
  console.log('Headless development-server performance (not device FPS):', evidence);
  await test.info().attach('performance.json', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
});
