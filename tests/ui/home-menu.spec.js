import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('docs/design/home-carousel/qa', { recursive: true });
const games = ['memory-match', 'link-connect', 'triple-connect'];
const titles = ['Memory Match', 'Link Connect', 'Triple Connect'];
async function centered(page, index) {
  const track = page.locator('.game-selector__choices');
  const card = page.locator(`.game-selector__choice[data-game-id="${games[index]}"]`);
  await expect(card).toHaveAttribute('aria-current', 'true');
  await expect.poll(async () => {
    const t = await track.boundingBox(), c = await card.boundingBox();
    return Math.abs(c.x + c.width / 2 - t.x - t.width / 2);
  }).toBeLessThan(2);
  await expect(card).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.game-selector__dot').nth(index)).toHaveAttribute('aria-pressed', 'true');
}
for (const viewport of [{ width: 320, height: 740 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) test(`home centers a selectable game at ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); await page.goto('/');
  const root = page.locator('.game-selector'), choices = root.locator('.game-selector__choice');
  await expect(choices).toHaveCount(3); await expect(root.locator('.menu-description')).toHaveCount(0);
  await expect.poll(() => root.locator('.game-selector__art').evaluateAll(els => els.every(im => im.complete && im.naturalWidth > 0))).toBe(true);
  const footer = await root.locator('.adventure-footer').boundingBox();
  expect(footer.width).toBe(Math.min(viewport.width, 640));
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: `Chọn ${titles[i]}`, exact: true }).click();
    await centered(page, i);
    const card = choices.nth(i), bounds = await card.boundingBox();
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(footer.y);
    expect(bounds.height).toBeGreaterThanOrEqual(115);
    expect(await card.locator('strong').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expect(page.locator('.game-selector__controls')).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: `docs/design/home-carousel/qa/home-${viewport.width}-${games[i]}.png`, animations: 'disabled' });
  }
  expect(await root.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await root.locator('.menu-wrapper').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const title = await root.locator('.game-title').boundingBox();
  expect(Math.abs(title.x + title.width / 2 - viewport.width / 2)).toBeLessThan(1);
  for (const game of games) {
    // Native button focus/scroll also makes a direct click on a side card usable.
    await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();
    await expect(page.locator(`#menu-container.${game}-menu[data-map-ready="true"]`)).toBeVisible();
    await page.locator('.adventure-map-page .adventure-exit').click();
    await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  }
});

test('arrow controls, keyboard, rapid changes and resizing keep the selection centered', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await page.goto('/');
  await centered(page, 0); await expect(page.getByRole('button', { name: 'Trò trước', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Trò sau', exact: true }).click(); await centered(page, 1);
  await page.getByRole('button', { name: 'Trò sau', exact: true }).click(); await centered(page, 2);
  await expect(page.getByRole('button', { name: 'Trò sau', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Triple Connect', exact: true }).focus();
  await page.keyboard.press('ArrowLeft'); await centered(page, 1);
  await expect(page.getByRole('button', { name: 'Link Connect', exact: true })).toBeFocused();
  await page.keyboard.press('Home'); await centered(page, 0);
  await page.keyboard.press('End'); await centered(page, 2);
  await page.setViewportSize({ width: 844, height: 390 }); await centered(page, 2);
  await page.setViewportSize({ width: 320, height: 740 }); await centered(page, 2);
  await page.evaluate(() => { const dots = document.querySelectorAll('.game-selector__dot'); for (let i = 0; i < 30; i++) dots[i % 3].click(); });
  await centered(page, 2);
  await page.keyboard.press('Enter'); await expect(page.locator('#menu-container.triple-connect-menu[data-map-ready="true"]')).toBeVisible();
});

test('missing illustrations preserve carousel labels and keyboard entry', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.route('**/assets/images/home/*.webp', route => route.abort()); await page.goto('/');
  await expect.poll(() => page.locator('.game-selector__art').evaluateAll(els => els.every(im => im.hidden))).toBe(true);
  for (const image of await page.locator('.game-selector__art').all()) await expect(image).toBeHidden();
  await page.getByRole('button', { name: 'Memory Match', exact: true }).focus();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await centered(page, 2);
  await page.screenshot({ path: 'docs/design/home-carousel/qa/home-fallback.png', animations: 'disabled' });
  await page.keyboard.press('Enter'); await expect(page.locator('#menu-container.triple-connect-menu[data-map-ready="true"]')).toBeVisible();
});

test('a fourth catalog game joins the same carousel without requiring art', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.route('**/js/gameRegistry.js', async route => { const response = await route.fetch(); const body = (await response.text()).replace('.map(entry => entry.definition);', '.map(entry => entry.definition).concat([{id:"future-game",title:"Fourth Game",description:"",icon:"puzzle"}]);'); await route.fulfill({ response, body }); });
  await page.goto('/'); await expect(page.locator('.game-selector__choice')).toHaveCount(4);
  await expect(page.locator('.game-selector__dot')).toHaveCount(4);
  await page.getByRole('button', { name: 'Memory Match', exact: true }).focus(); await page.keyboard.press('End');
  const fourth = page.getByRole('button', { name: 'Fourth Game', exact: true });
  await expect(fourth).toHaveAttribute('aria-current', 'true'); await expect(fourth).toBeInViewport({ ratio: 1 });
  await expect(fourth.locator('img')).toHaveCount(0);
  const rect = await fourth.boundingBox(), track = await page.locator('.game-selector__choices').boundingBox();
  expect(Math.abs(rect.x + rect.width / 2 - track.x - track.width / 2)).toBeLessThan(2);
});

test.describe('native touch scrolling', () => {
  test.use({ hasTouch: true, viewport: { width: 412, height: 915 } });
  test('horizontal swipes select games without accidentally opening a map', async ({ page }) => {
    await page.goto('/'); await centered(page, 0);
    const session = await page.context().newCDPSession(page);
    async function swipe(direction) {
      const box = await page.locator('.game-selector__choices').boundingBox();
      const x = direction === 'left' ? 330 : 80, y = box.y + box.height / 2;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 12; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (direction === 'left' ? -1 : 1) * i * 22, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await swipe('left'); await centered(page, 1);
    await swipe('left'); await centered(page, 2);
    await swipe('right'); await centered(page, 1);
    await expect(page.locator('.adventure-map-page')).toHaveCount(0);
    await session.detach();
  });
});

test('thirty Home/game/tab cycles release old owners and preserve the durable profile',async ({page})=>{
  test.setTimeout(120000); await page.goto('/'); await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  const result=await page.evaluate(async()=>{
    const {getAppPageScope}=await import('/js/appPageLifecycle.js'); const {loadPersistentGameData}=await import('/js/persistence.js');
    const before=await loadPersistentGameData();
    const baseline=getAppPageScope().diagnostics(); const disposed=[];
    for(let i=0;i<30;i++) {
      const previous=getAppPageScope(); const id=['memory-match','link-connect','triple-connect'][i%3];
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id); disposed.push(previous.diagnostics());
      document.querySelector('[data-dock-action="settings"]').click();
      document.querySelector('.adventure-screen > .adventure-exit').click();
      if(document.querySelectorAll('.game-selector__choice').length!==3||document.querySelectorAll('#menu-container').length!==1)throw new Error('Home nodes duplicated');
      const current=getAppPageScope().diagnostics(); if(JSON.stringify(current)!==JSON.stringify(baseline))throw new Error('Home resources grew');
    }
    return {baseline,disposed,after:getAppPageScope().diagnostics(),profileBefore:JSON.stringify(before.progress),profileAfter:JSON.stringify((await loadPersistentGameData()).progress)};
  });
  expect(result.after).toEqual(result.baseline); expect(result.profileAfter).toBe(result.profileBefore);
  for(const scope of result.disposed) for(const [key,value] of Object.entries(scope)) expect(value).toBe(key==='active'?false:0);
  writeFileSync('docs/design/home-carousel/qa/home-30-cycles.json',JSON.stringify(result,null,2));
});

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) test(`short viewport ${viewport.width} keeps the title and controls reachable`, async ({ page }) => {
  await page.setViewportSize(viewport); await page.goto('/');
  const wrapper = page.locator('.game-selector > .menu-wrapper');
  await wrapper.evaluate(el => { el.scrollTop = 0; });
  await expect(page.locator('.game-selector .game-title')).toBeInViewport({ ratio: 1 });
  expect(await wrapper.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Trò sau', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.locator('.game-selector__controls')).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Trò sau', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Link Connect', exact: true })).toHaveAttribute('aria-current', 'true');
  await page.screenshot({ path: `docs/design/home-carousel/qa/home-short-${viewport.width}.png`, animations: 'disabled' });
});

test('normal motion remains finite and navigation interrupts transitions safely', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.goto('/');
  await expect(page.locator('.game-selector__choice').first()).toHaveCSS('transition-duration', '0.16s, 0.16s');
  await page.evaluate(async () => { window.oldHomeScope = (await import('/js/appPageLifecycle.js')).getAppPageScope(); document.querySelectorAll('.game-selector__dot')[1].click(); });
  await page.locator('[data-dock-action="settings"]').click();
  await expect(page.locator('#settings-modal')).toBeVisible();
  await page.locator('.adventure-screen > .adventure-exit').click();
  const old = await page.evaluate(() => window.oldHomeScope.diagnostics());
  for (const [key, value] of Object.entries(old)) expect(value).toBe(key === 'active' ? false : 0);
  await centered(page, 0);
});
