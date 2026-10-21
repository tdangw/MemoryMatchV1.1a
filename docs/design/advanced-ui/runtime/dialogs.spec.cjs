const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs/promises');
const { ready, homeSkin, settings, geometry, disableRemoteServices, installModuleAccess, freezeDevelopmentReloads, verificationContext } = require('./helpers.cjs');
test.setTimeout(120000);
for (const skin of ['default', 'woodland']) for (const viewport of [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) test(`dialogs ${skin} ${viewport.width}`, async ({ page }) => {
  await freezeDevelopmentReloads(page); await disableRemoteServices(page); await installModuleAccess(page); await page.setViewportSize(viewport);
  const errors = [], proof = []; page.on('pageerror', error => errors.push(error.message));
  const verification = verificationContext(); await ready(page); await homeSkin(page, skin);
  async function shot(state, fixture = false) { const metrics = await geometry(page), file = `dialogs-${skin}-${viewport.width}-${state}.png`; await page.screenshot({ path: path.join(__dirname, 'qa', file), animations: 'disabled' }); proof.push({ state, fixture, metrics, file }); }
  async function close(id) { await page.locator(`${id} .app-modal__close`).click(); await expect(page.locator(id)).toHaveCount(0); }
  await settings(page);
  for (const [control, id] of [['#version-info','#version-modal'], ['#settings-privacy-policy','#privacy-policy-modal']]) {
    await page.locator(control).click(); await expect(page.locator(id)).toBeVisible(); await shot(id.slice(1));
    const paragraphs = page.locator(`${id} .app-modal__body p`); await paragraphs.last().scrollIntoViewIfNeeded(); await expect(paragraphs.last()).toBeInViewport();
    await page.keyboard.press('Tab'); expect(await page.locator(id).evaluate(node => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape'); await expect(page.locator(id)).toHaveCount(0); await expect(page.locator(control)).toBeFocused();
  }
  await page.locator('#settings-help').click(); await expect(page.locator('#info-modal')).toBeVisible(); await shot('help'); await close('#info-modal');
  // Rare presentation fixtures invoke the production owners, never reward settlement.
  for (const [fn,id] of [['showResetConfirmationOverlay','#reset-modal'],['showReturnToMenuOverlay','#return-modal'],['openTimeUpModal','#time-up-modal']]) {
    await page.evaluate(async fn => (await window.productModule('/js/ui.js'))[fn](), fn); await expect(page.locator(id)).toBeVisible(); await shot(id.slice(1),true); await close(id);
  }
  for (const kind of ['time','preview']) { await page.evaluate(async kind => (await window.productModule('/js/shop.js')).openQuickAssistOverlay(kind), kind); const id=`#quick-${kind}-modal`; await expect(page.locator(id)).toBeVisible(); await shot(kind,true); await close(id); }
  for (const stars of [0,1,2,3]) {
    await page.evaluate(async stars => (await window.productModule('/js/ui.js')).showLevelSummaryOverlay({level:999,stars,score:123456789,coinsEarned:999999,remainingTime:9999,moves:999,misses:1,settings:{},onNext:()=>{},onMenu:()=>{}}), stars);
    await expect(page.locator('#level-summary-modal')).toBeVisible(); if(skin==='woodland') await expect(page.locator('html')).toHaveAttribute('data-ui-rewards','ready'); await shot(`win-${stars}`,true);
    await page.locator('#level-summary-modal').getByRole('button',{name:'Menu',exact:true}).click(); await expect(page.locator('#level-summary-modal')).toHaveCount(0);
  }
  await page.evaluate(async () => { const {showCloudConflictDialog}=await window.productModule('/js/accountPanel.js'); window.conflictFixture=showCloudConflictDialog({root:true,cloud:{coins:123456789,progress:{}},choose:async()=>false}); });
  await shot('conflict',true); await page.keyboard.press('Escape'); await expect(page.locator('#cloud-conflict-modal')).toBeVisible();
  await page.evaluate(()=>window.conflictFixture.destroy());
  for (const tone of ['success','info','warning','error']) { await page.evaluate(async tone=>(await window.productModule('/js/modal.js')).showAppToast('Lựa chọn của bạn đã được lưu. Bạn có thể thay đổi trong Cài đặt.',{tone,duration:600}),tone); await shot(`toast-${tone}`,true); await expect(page.locator('.app-toast')).toHaveCount(0); }
  await fs.writeFile(path.join(__dirname,'qa',`dialogs-${skin}-${viewport.width}.json`),JSON.stringify({verification,scope:'production dialogs; explicit fixtures cover rare presentation only, no settlement evidence',proof,errors},null,2)); expect(errors).toEqual([]);
});
for (const skin of ['default','woodland']) for (const viewport of [{width:320,height:568},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]) test(`purchase dialogs ${skin} ${viewport.width}`,async({page})=>{
  await freezeDevelopmentReloads(page);await disableRemoteServices(page);await installModuleAccess(page);await page.setViewportSize(viewport);await ready(page);await homeSkin(page,skin);
  for(const game of ['memory-match','link-connect','triple-connect']){
    await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
    await page.locator('.adventure-page:visible [data-dock-action="shop"]').click();
    const buy=page.locator('#shop-modal .shop-buy-button').filter({hasText:/^[0-9]/}).first();await buy.click();await expect(page.locator('#shop-confirm-modal')).toBeVisible();await geometry(page);
    if(skin==='woodland') expect(await page.locator('.shop-confirmation__price').evaluate(node=>getComputedStyle(node).color)).toBe('rgb(130, 80, 31)');
    await page.screenshot({path:path.join(__dirname,'qa',`purchase-${skin}-${viewport.width}-${game}.png`),animations:'disabled'});
    await page.locator('#shop-confirm-modal').getByRole('button',{name:'Mua ngay'}).click();await expect(page.locator('.app-toast--error')).toBeVisible();await expect(page.locator('#shop-confirm-modal')).toBeVisible();
    await page.locator('#shop-confirm-modal').getByRole('button',{name:'Hủy',exact:true}).click();await expect(page.locator('#shop-confirm-modal')).toHaveCount(0); await expect(page.locator('.app-toast')).toHaveCount(0);
    await page.locator('.adventure-screen [data-dock-action="map"]').click();await page.locator('#menu-container .adventure-exit').click();await expect(page.locator('.game-selector')).toBeVisible();
  }
});


