import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/docs/design/animated-backgrounds/pilot.html');
  await page.frameLocator('iframe').locator('.game-selector__choice').first().waitFor();
});

test('covered Home remains static, with no pilot animation or scheduler', async ({ page }) => {
  const result = await page.evaluate(() => window.mountAmbientPilot('home').diagnostics());
  expect(result).toMatchObject({ state: 'STATIC', staticReason: 'home-source-covered', nodes: 1, handles: 0, timers: 0 });
  await page.evaluate(() => window.stopAmbientPilot());
  await expect(page.frameLocator('iframe').locator('.ambient-bg-pilot')).toHaveCount(0);
});

test('Memory pilot respects reduction, hidden state, queued resize and 100 disposals', async ({ page }) => {
  const frame = page.frameLocator('iframe');
  await frame.locator('[data-game-id="memory-match"]').click();
  await frame.locator('.adventure-map-node[data-level="1"]').click();
  await frame.getByRole('button', { name: 'Chơi', exact: true }).click();
  await frame.getByRole('button', { name: 'Bỏ qua', exact: true }).click();
  await frame.locator('#grid-container:not(.is-locked) .tile').first().waitFor();
  if (await frame.locator('.tutorial-guide').isVisible()) {
    await frame.getByRole('button', { name: 'Đã hiểu', exact: true }).click();
    await expect(frame.locator('.tutorial-guide')).toHaveCount(0);
  }
  const initial = await page.evaluate(() => window.mountAmbientPilot('memory').diagnostics());
  expect(initial.state).toBe('RUNNING');
  expect(initial.handles).toBeLessThanOrEqual(5); expect(initial.nodes).toBeLessThanOrEqual(24);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => window.ambientPilotDiagnostics().handles)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => page.evaluate(() => window.ambientPilotDiagnostics().handles)).toBeGreaterThan(0);
  const result = await page.evaluate(async () => {
    const doc = document.querySelector('iframe').contentDocument;
    Object.defineProperty(doc, 'hidden', { configurable: true, value: true });
    doc.dispatchEvent(new Event('visibilitychange'));
    await new Promise(resolve => doc.defaultView.requestAnimationFrame(resolve));
    if (window.ambientPilotDiagnostics().handles) throw new Error('Hidden pilot retained animations');
    delete doc.hidden; doc.dispatchEvent(new Event('visibilitychange'));
    for (let i = 0; i < 100; i++) {
      const owner = window.mountAmbientPilot('memory');
      doc.defaultView.dispatchEvent(new Event('resize'));
      owner.dispose(); owner.dispose();
      const state = owner.diagnostics();
      if (state.nodes || state.handles || state.pendingFrames || state.timers) throw new Error('Disposed owner retained resources');
    }
    await new Promise(resolve => doc.defaultView.requestAnimationFrame(resolve));
    return { scenes: doc.querySelectorAll('.ambient-bg-pilot').length, state: window.ambientPilotDiagnostics() };
  });
  expect(result).toMatchObject({ scenes: 0, state: { state: 'DISPOSED', nodes: 0, handles: 0, timers: 0, pendingFrames: 0 } });
});
