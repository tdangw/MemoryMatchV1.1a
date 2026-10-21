const { expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
function verificationContext() {
  return { head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceDiffSha256: createHash('sha256').update(execFileSync('git', ['diff', '--', 'js', 'styles', 'index.html'], { stdio: ['ignore', 'pipe', 'pipe'] })).digest('hex'),
    motion: process.env.UI_SKIN_MOTION || 'reduce', dpr: Number(process.env.UI_SKIN_DPR || 2),
    baseUrl: process.env.UI_SKIN_BASE_URL || 'http://localhost:4173', capturedAtUTC: new Date().toISOString() };
}
async function installModuleAccess(page) {
  await page.addInitScript(() => {
    window.productModule = path => import(performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === path)?.name || path);
  });
}
async function freezeDevelopmentReloads(page) {
  const host = new URL(process.env.UI_SKIN_BASE_URL || 'http://localhost:4173').host;
  // Only Vite's token-bearing development socket is isolated. Game requests,
  // persistence and services keep their normal paths in this browser context.
  await page.routeWebSocket(url => url.host === host && url.pathname === '/' && url.searchParams.has('token'), () => {});
}
async function ready(page) { await page.goto('/'); await page.locator('#app-loading').waitFor({ state: 'detached' }); }
async function settings(page) { await page.locator('.adventure-page:visible [data-dock-action="settings"]').click(); await expect(page.locator('#settings-modal')).toBeVisible(); }
async function choose(page, skin) { await page.locator(`[data-ui-skin-choice="${skin}"]`).click(); await expect(page.locator('html')).toHaveAttribute('data-ui-skin', skin); await expect(page.locator('.skin-choices')).not.toHaveAttribute('aria-busy', 'true'); }
async function homeSkin(page, skin) { await settings(page); await choose(page, skin); await page.locator('.adventure-screen > .adventure-exit').click(); await expect(page.locator('.game-selector')).toBeVisible(); }
async function geometry(page) {
  const result = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth,
    panels: [...document.querySelectorAll('.app-modal')].filter(node => node.getBoundingClientRect().width).map(node => {
      const rect = node.getBoundingClientRect(), body = node.querySelector('.app-modal__body');
      return { left: rect.left, right: rect.right, bottom: rect.bottom, horizontal: body ? body.scrollWidth > body.clientWidth + 1 : false };
    }) }));
  expect(result.overflow).toBe(false);
  const viewport = page.viewportSize();
  for (const panel of result.panels) { expect(panel.left).toBeGreaterThanOrEqual(-1); expect(panel.right).toBeLessThanOrEqual(viewport.width + 1); expect(panel.bottom).toBeLessThanOrEqual(viewport.height + 1); expect(panel.horizontal).toBe(false); }
  return result;
}
async function disableRemoteServices(page) {
  await page.route('**/js/firebaseBackend.js*', route => route.fulfill({ contentType: 'text/javascript', body:
    "export const getFirebaseBackend = async () => null; export const disposeFirebaseBackend = async () => {}; export { getFirebaseEnvironment } from './firebaseEnvironment.js';" }));
}
module.exports = { installModuleAccess, ready, settings, choose, homeSkin, geometry, disableRemoteServices, freezeDevelopmentReloads, verificationContext };
