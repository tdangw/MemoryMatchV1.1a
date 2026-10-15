import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('docs/design/popups/qa', {recursive:true});
const games = [['memory-match','#btn-actions-menu'],['link-connect','#link-actions-menu-toggle'],['triple-connect','#triple-actions-menu-toggle']];
async function start(page, game) {
  await page.goto('/');
  await page.evaluate(async game => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game);
    const { gameState } = await import('/js/gameState.js'); gameState.settings.sound = gameState.settings.music = false;
    if (game === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1,{skipIntro:true});
    else if (game === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({mode:'easy',skipIntro:true});
    else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({mode:'easy',skipIntro:true});
  }, game);
  await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup', /.+/);
}
async function aligned(page, selector) {
  await expect.poll(async () => {
    const board = await page.locator('.game-shell-root:visible [data-shell-region="board"]').boundingBox();
    const panel = await page.locator(selector).boundingBox();
    return panel ? Math.abs(panel.y - Math.max(16,board.y)) : 1000;
  }).toBeLessThan(2);
  const panel = await page.locator(selector).boundingBox(); const viewport = page.viewportSize();
  expect(panel.y+panel.height).toBeLessThanOrEqual(viewport.height-15);
  expect(panel.x).toBeGreaterThanOrEqual(0); expect(panel.x+panel.width).toBeLessThanOrEqual(viewport.width);
}
for (const viewport of [{width:412,height:915},{width:844,height:390},{width:1024,height:900}]) for (const [game,trigger] of games) test(`${game} dialogs follow board at ${viewport.width}`, async ({page}) => {
  await page.setViewportSize(viewport); await start(page,game);
  await page.locator(trigger).click(); await aligned(page,'#game-exit-modal .app-modal');
  await expect(page.locator('#game-exit-modal .app-modal__body')).toBeHidden();
  const bounds = await page.locator('#game-exit-modal .app-modal').boundingBox();
  for(const button of await page.locator('#game-exit-modal button').all()) {
    const b=await button.boundingBox(); expect(b.y).toBeGreaterThanOrEqual(bounds.y); expect(b.y+b.height).toBeLessThanOrEqual(bounds.y+bounds.height);
    expect(b.height).toBeGreaterThanOrEqual(44); expect(b.x).toBeGreaterThanOrEqual(bounds.x); expect(b.x+b.width).toBeLessThanOrEqual(bounds.x+bounds.width);
  }
  const primary = page.locator('#game-exit-modal .app-button--primary');
  expect(await primary.locator('.ui-icon').evaluate(el=>getComputedStyle(el).color)).toBe(await primary.evaluate(el=>getComputedStyle(el).color));
  await page.screenshot({path:`docs/design/popups/qa/pause-${game}-${viewport.width}.png`,animations:'disabled'});
  await page.locator('#game-exit-modal').getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await expect(page.locator('#game-exit-modal')).toHaveCount(0); await expect(page.locator(trigger)).toBeFocused();
  await page.locator(trigger).click();
  await page.locator('#game-exit-modal').getByRole('button',{name:'Cài đặt',exact:true}).click();
  await expect(page.locator('#game-exit-modal')).toHaveCount(0); await aligned(page,'#settings-modal .app-modal');
  if(game==='link-connect') await page.screenshot({path:`docs/design/popups/qa/settings-${viewport.width}.png`,animations:'disabled'});
  const rotated = {width:viewport.height,height:viewport.width}; await page.setViewportSize(rotated); await aligned(page,'#settings-modal .app-modal');
  await page.setViewportSize(viewport); await aligned(page,'#settings-modal .app-modal');
  await page.locator('#settings-help').click();
  const help = game === 'link-connect' ? '#link-game-info-modal' : '#info-modal';
  await aligned(page,`${help} .app-modal`); await page.locator(`${help} .app-modal__close`).click(); await expect(page.locator(help)).toHaveCount(0);
  await page.evaluate(async () => { const {showLevelRewardOverlay} = await import('/js/ui.js'); window.testIntro = showLevelRewardOverlay(); });
  await aligned(page,'.level-reward-overlay .app-modal');
  if(game==='link-connect') await page.screenshot({path:`docs/design/popups/qa/intro-${viewport.width}.png`,animations:'disabled'});
  await page.evaluate(() => window.testIntro.destroy());
});
test('viewport fallback, nested/replaced dialogs and intro cleanup release resources', async ({page}) => {
  await page.clock.install(); await page.goto('/');
  await page.evaluate(async () => { window.modalAPI = await import('/js/modal.js'); window.fallback = window.modalAPI.openAppModal({id:'placement-fallback',title:'Thông tin',content:'<p>Nội dung</p>'}); });
  await expect.poll(async () => (await page.locator('#placement-fallback .app-modal').boundingBox()).y).toBe(16);
  await page.evaluate(() => window.fallback.destroy());
  await start(page,'link-connect');
  const result = await page.evaluate(async () => {
    window.modalAPI = await import('/js/modal.js');
    const {createGameShellLifecycle,getActiveGameScope} = await import('/js/gameShell/gameShellLifecycle.js');
    const {connectDialogPlacement} = await import('/js/dialogPlacement.js');
    const {showLevelRewardOverlay} = await import('/js/ui.js');
    const owner = getActiveGameScope(); const before = owner.diagnostics();
    const first=window.modalAPI.openAppModal({id:'placement-parent',title:'Thông tin'});
    const nested=window.modalAPI.openAppModal({id:'placement-child',title:'Chi tiết'});
    nested.destroy(); const parentPreserved=first.overlay.isConnected; first.destroy();
    const snapshots=[];
    for(let i=0;i<30;i++) {
      const local=createGameShellLifecycle(), overlay=document.createElement('div'), panel=document.createElement('section');
      overlay.className='app-modal-overlay'; overlay.append(panel); document.body.append(overlay);
      connectDialogPlacement(overlay,panel,local); window.dispatchEvent(new Event('resize')); local.dispose(); local.dispose(); overlay.remove(); snapshots.push(local.diagnostics());
      const old=window.modalAPI.openAppModal({id:'placement-replace',title:'Thông tin'}); old.close();
      const next=window.modalAPI.openAppModal({id:'placement-replace',title:'Thông tin'}); old.destroy(); next.destroy();
      const intro=showLevelRewardOverlay({scope:owner}); const replacement=showLevelRewardOverlay({scope:owner}); intro.destroy(); replacement.destroy();
    }
    return {before,after:owner.diagnostics(),snapshots,parentPreserved,modals:document.querySelectorAll('.app-modal-overlay').length};
  });
  expect(result.parentPreserved).toBe(true); expect(result.modals).toBe(0);
  // Focus restoration also schedules the existing finite tooltip fade/frame.
  await page.clock.runFor(500);
  const settled = await page.evaluate(async () => (await import('/js/gameShell/gameShellLifecycle.js')).getActiveGameScope().diagnostics());
  for (const [key,value] of Object.entries(result.before)) {
    if (key === 'timeout') expect(settled[key]).toBeLessThanOrEqual(value);
    else expect(settled[key]).toBe(value);
  }
  for(const snapshot of result.snapshots) for(const [key,value] of Object.entries(snapshot)) expect(value).toBe(key==='active'?false:0);
});

test('victory summary uses the same board edge without its old vertical offset', async ({page}) => {
  await start(page,'link-connect');
  await page.evaluate(async () => (await import('/js/ui.js')).showLevelSummaryOverlay({ level:1,score:1234,stars:3,coinsEarned:10,moves:1,misses:0,remainingTime:20,timeBonus:0,settings:{} }));
  await expect(page.locator('#level-summary-modal')).toBeVisible();
  await aligned(page,'#level-summary-modal .app-modal');
  await page.screenshot({path:'docs/design/popups/qa/victory.png',animations:'disabled'});
});

for (const viewport of [{width:412,height:915},{width:844,height:390},{width:1024,height:900}]) test(`map preview shares game dialog height on first visit at ${viewport.width}`, async ({page}) => {
  await page.setViewportSize(viewport); await page.goto('/');
  for(const [game,trigger] of games) {
    await page.evaluate(async game => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game), game);
    await page.locator('.adventure-map-node--level:not(:disabled)').first().click();
    const preview=page.locator('#adventure-level-modal .app-modal'); await expect(preview).toBeVisible();
    const before=await preview.boundingBox(); expect(before.y).toBeGreaterThan(60);
    const play=page.locator('#adventure-level-modal').getByRole('button',{name:'Chơi',exact:true});
    await play.scrollIntoViewIfNeeded(); const b=await play.boundingBox(); expect(b.y+b.height).toBeLessThanOrEqual(viewport.height-15);
    if(game==='link-connect') await page.screenshot({path:`docs/design/popups/qa/map-preview-${viewport.width}.png`,animations:'disabled'});
    await play.click(); await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
    await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup',/.+/);
    await page.locator(trigger).click(); await aligned(page,'#game-exit-modal .app-modal');
    const after=await page.locator('#game-exit-modal .app-modal').boundingBox(); expect(Math.abs(after.y-before.y)).toBeLessThan(2);
    await page.locator('#game-exit-modal').getByRole('button',{name:'Thoát game',exact:true}).click();
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  }
});
