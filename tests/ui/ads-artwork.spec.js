import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { startMapLevel } from './helpers/adventureNavigation.js';

mkdirSync('docs/design/ui-image-upgrade/qa', { recursive: true });

test('the browser naturally advances a scene after its six-second timeline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.ad-art-scene')).toHaveAttribute('data-ad-scene', 'cards');
  await expect(page.locator('.ad-art-scene')).toHaveAttribute('data-ad-scene', 'garden', { timeout: 8000 });
});

test('three finite scenes rotate without text or accumulated nodes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/');
  const banner = page.locator('.menu-ad-preview');
  const scene = page.locator('.ad-art-scene');
  for (let i = 0; i < 30; i++) {
    const name = ['cards', 'garden', 'runner'][i % 3];
    await expect(scene).toHaveAttribute('data-ad-scene', name);
    await expect(banner).toHaveText('');
    expect(await scene.locator('*').count()).toBeLessThanOrEqual(27);
    expect((await banner.boundingBox()).height).toBe(50);
    if (i < 3) {
      await banner.evaluate(node => { for (const animation of node.getAnimations({ subtree: true })) { animation.currentTime = 2000; animation.pause(); } });
      await banner.screenshot({ path: `docs/design/ui-image-upgrade/qa/art-${name}.png` });
    }
    await scene.evaluate(node => node.getAnimations().find(animation => animation.animationName === 'ad-art-scene-cycle').finish());
  }
  await expect(scene).toHaveAttribute('data-ad-scene', 'cards');
  await page.evaluate(async () => {
    window.adsOldArtwork = document.querySelector('.menu-ad-preview');
    const ads = await import('/js/ads/menuAds.js');
    const resume = ads.suspendMenuAds('art-test');
    if (document.querySelector('.ad-art-scene')) throw new Error('Artwork survived suspension');
    if (window.adsOldArtwork.getAnimations({ subtree: true }).length) throw new Error('Detached artwork kept animations');
    resume();
  });
  await expect(scene).toHaveCount(1);
  await page.evaluate(async () => (await (await import('/js/ads/menuAds.js')).initializeMenuAds()).dispose());
  await expect(scene).toHaveCount(0);
});

test('reduced motion keeps a static illustration and resumes when motion is enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.ad-art-scene')).toHaveAttribute('data-ad-scene', 'cards');
  expect(await page.locator('.menu-ad-preview').evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => page.locator('.ad-art-scene').evaluate(node => node.getAnimations().length)).toBe(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.menu-ad-preview').evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
});

test('artwork has bounded resources and frame cost compared with a static frame', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.ad-art-scene')).toBeVisible();
  async function measure() {
    return page.evaluate(async () => {
      const frames = [], tasks = [];
      const observer = new PerformanceObserver(list => { for (const entry of list.getEntries()) tasks.push(entry.duration); });
      observer.observe({ type: 'longtask' });
      let previous = await new Promise(resolve => requestAnimationFrame(resolve));
      for (let i = 0; i < 120; i++) {
        const current = await new Promise(resolve => requestAnimationFrame(resolve));
        frames.push(current - previous); previous = current;
      }
      observer.disconnect(); frames.sort((a, b) => a - b);
      return { p95: frames[Math.floor(frames.length * .95)], longTasks: tasks.length,
        sceneNodes: document.querySelector('.ad-art-scene').querySelectorAll('*').length + 1,
        animationCount: document.querySelector('.menu-ad-preview').getAnimations({ subtree: true }).length };
    });
  }
  const baseline = await measure();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const animated = [];
  for (const name of ['cards', 'garden', 'runner']) {
    await expect(page.locator('.ad-art-scene')).toHaveAttribute('data-ad-scene', name);
    const metrics = await measure();
    expect(metrics.sceneNodes).toBeLessThanOrEqual(28);
    expect(metrics.animationCount).toBeLessThanOrEqual(14);
    expect(metrics.longTasks).toBe(0);
    expect(metrics.p95).toBeLessThanOrEqual(baseline.p95 + 4);
    animated.push({ name, ...metrics });
    await page.locator('.ad-art-scene').evaluate(node => node.getAnimations().find(animation => animation.animationName === 'ad-art-scene-cycle').finish());
  }
  const gameplay = [];
  for (const [game, title] of [['memory-match', 'Memory Match'], ['link-connect', 'Link Connect'], ['triple-connect', 'Triple Connect']]) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: `Chọn ${title}`, exact: true }).click();
    await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();
    await startMapLevel(page);
    await expect(page.locator('.gameplay-ad-slot .ad-art-scene')).toHaveCount(1);
    const staticGame = await measure();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const animatedGame = await measure();
    expect(animatedGame.longTasks).toBe(0);
    expect(animatedGame.p95).toBeLessThanOrEqual(staticGame.p95 + 4);
    expect(animatedGame.animationCount).toBeLessThanOrEqual(14);
    gameplay.push({ game, baseline: staticGame, animated: animatedGame });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
  }
  writeFileSync('docs/design/ui-image-upgrade/qa/art-performance.json', JSON.stringify({ viewport: '412x915', framesPerScenario: 120, baseline, animated, gameplay }, null, 2) + '\n');
});
