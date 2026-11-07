import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const source = readFileSync('js/accountPanel.js', 'utf8').replace('import { getAccountService } from "./accountService.js";', `const getAccountService = () => ({
  getState: () => window.profileState,
  subscribe: callback => { window.profileSubscriber = callback; window.profileListeners++; callback(window.profileState); return () => { window.profileListeners--; window.profileSubscriber = null; }; },
  async setPlayerName(name) { window.profileSaves++; if (window.profileDeferred) await new Promise(resolve => window.profileRelease = resolve); if (window.profileFailure) throw new Error('Tên chưa được lưu.'); window.profileState.playerName = name; window.profileSubscriber?.(window.profileState); return true; },
  async requestGoogleLogin() { window.profileLinks++; }
});`);
async function open(page) {
  await page.addInitScript(() => { window.profileState = { uid: 'owner-a', bound: true, isAnonymous: true, phase: 'synced', playerName: 'An Nhiên' }; window.profileListeners = window.profileSaves = window.profileLinks = 0; });
  await page.route('**/js/accountPanel.js*', route => route.fulfill({ contentType: 'text/javascript', body: source }));
  await page.goto('/'); await page.locator('[data-dock-action="profile"]').click();
  await expect(page.locator('.profile-view')).toBeVisible();
}
for (const viewport of [{ width: 320, height: 740 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) test(`profile editor preserves drafts and layout ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); await open(page);
  await expect(page.locator('.profile-name-form')).toBeHidden();
  await expect(page.locator('#account-modal .app-modal__footer')).toHaveCount(0);
  await expect(page.locator('.account-status')).toBeEmpty();
  await expect(page.locator('.profile-logout')).toBeHidden();
  await page.evaluate(() => { window.profileState.isAnonymous = false; window.profileSubscriber(window.profileState); });
  const actionBoxes = await page.locator('.profile-account-actions > button:visible').evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height };
  }));
  expect(actionBoxes).toHaveLength(3);
  for (let i = 0; i < actionBoxes.length; i++) {
    expect(actionBoxes[i].height).toBeGreaterThanOrEqual(48);
    expect(Math.abs(actionBoxes[i].x - actionBoxes[0].x)).toBeLessThan(1);
    expect(Math.abs(actionBoxes[i].width - actionBoxes[0].width)).toBeLessThan(1);
    if (i) expect(actionBoxes[i].y).toBeGreaterThanOrEqual(actionBoxes[i - 1].y + actionBoxes[i - 1].height + 9);
  }
  if (viewport.width === 412) await page.screenshot({ path: 'runtime/fullscreen-ads-profile-412.png' });
  await page.evaluate(() => { window.profileState.isAnonymous = true; window.profileSubscriber(window.profileState); });
  const title = await page.locator('.profile-player-name').boundingBox();
  const pencil = await page.getByRole('button', { name: 'Sửa tên' }).boundingBox();
  expect(pencil.x - title.x - title.width).toBeLessThanOrEqual(8);
  const avatarBefore = await page.locator('.profile-avatar').boundingBox();
  await page.getByRole('button', { name: 'Sửa tên' }).click();
  await expect(page.locator('.profile-player-name')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Sửa tên' })).toBeHidden();
  const inputBox = await page.locator('.account-name-input').boundingBox();
  const cancelBox = await page.getByRole('button', { name: 'Hủy', exact: true }).boundingBox();
  const saveBox = await page.getByRole('button', { name: 'Lưu tên', exact: true }).boundingBox();
  const avatarAfter = await page.locator('.profile-avatar').boundingBox();
  expect(avatarAfter).toEqual(avatarBefore);
  expect(Math.abs(cancelBox.width - saveBox.width)).toBeLessThanOrEqual(1);
  expect(cancelBox.height).toBe(saveBox.height);
  expect(cancelBox.y).toBe(saveBox.y);
  expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(cancelBox.y);
  expect(Math.abs(inputBox.width - (saveBox.x + saveBox.width - cancelBox.x))).toBeLessThanOrEqual(1);
  await expect(page.locator('.app-modal-overlay')).toHaveCount(0);
  await page.locator('.account-name-input').fill('Tên đang sửa');
  if (viewport.width === 412) await page.screenshot({ path: 'docs/design/app-tabs/qa/profile-editing-412.png', animations: 'disabled' });
  await page.evaluate(() => { window.profileState.phase = 'waiting'; window.profileSubscriber(window.profileState); });
  await expect(page.locator('.account-name-input')).toHaveValue('Tên đang sửa');
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.locator('.profile-player-name')).toHaveText('An Nhiên');
  await page.getByRole('button', { name: 'Sửa tên' }).click();
  await page.locator('.account-name-input').fill('Tên đã lưu');
  await page.locator('.account-name-input').press('Enter');
  await expect(page.locator('.profile-player-name')).toHaveText('Tên đã lưu');
  await expect(page.locator('.profile-name-form')).toBeHidden();
  expect(await page.locator('.profile-view').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Liên kết Google', exact: true })).toBeVisible();
  await page.evaluate(() => { window.profileState.phase = 'synced'; window.profileSubscriber(window.profileState); });
  await expect(page.locator('.app-toast')).toHaveCount(0);
  await page.evaluate(()=>{window.profileState.playerName='Người chơi Reks2';window.profileSubscriber(window.profileState);});
  await expect(page.locator('.profile-player-name')).toHaveText('Người chơi Reks2');
  const layout=await page.locator('.profile-summary').evaluate(root=>{
    const name=root.querySelector('.profile-player-name'),identity=root.querySelector('.profile-identity'),edit=root.querySelector('.profile-edit');
    return{nameWidth:name.getBoundingClientRect().width,identityWidth:identity.getBoundingClientRect().width,nameOverflow:name.scrollWidth-name.clientWidth,
      border:getComputedStyle(edit).borderTopWidth,icon:getComputedStyle(edit.querySelector('.ui-icon')).width};
  });
  expect(layout.nameWidth).toBeLessThanOrEqual(layout.identityWidth);expect(layout.nameOverflow).toBeLessThanOrEqual(1);
  expect(layout.border).toBe('0px');expect(layout.icon).toBe('14px');
  await page.evaluate(()=>{
    window.profileState.uid='firebase-user-0123456789abcdef';window.profileSubscriber(window.profileState);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.profileCopiedUid=value;}}});
  });
  await expect(page.locator('.profile-uid__value')).toHaveText('fireba…cdef');
  await page.getByRole('button',{name:'Sao chép UID',exact:true}).click();
  expect(await page.evaluate(()=>window.profileCopiedUid)).toBe('firebase-user-0123456789abcdef');
  await page.screenshot({ path: `docs/design/app-tabs/qa/profile-inline-${viewport.width}.png`, animations: 'disabled' });
});
test('profile failures keep the draft, UID changes discard it, pending actions do not mutate a closed view', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Sửa tên' }).click();
  await page.locator('.account-name-input').fill('Bản nháp'); await page.evaluate(() => window.profileFailure = true);
  await page.getByRole('button', { name: 'Lưu tên', exact: true }).click();
  await expect(page.locator('.profile-error')).toHaveText('Chưa lưu được tên. Kiểm tra kết nối và thử lại.');
  await expect(page.locator('.account-name-input')).toHaveValue('Bản nháp');
  await page.evaluate(() => { window.profileState = { ...window.profileState, uid: 'owner-b', playerName: 'Chủ mới' }; window.profileSubscriber(window.profileState); });
  await expect(page.locator('.profile-name-form')).toBeHidden();
  await expect(page.locator('.profile-player-name')).toHaveText('Chủ mới');
  await page.getByRole('button', { name: 'Sửa tên' }).click(); await page.locator('.account-name-input').fill('Tên đang gửi');
  await page.evaluate(() => { window.profileFailure = false; window.profileDeferred = true; });
  await page.getByRole('button', { name: 'Lưu tên', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lưu tên', exact: true })).toBeDisabled();
  await page.locator('.adventure-screen [data-dock-action="events"]').click();
  await page.evaluate(() => window.profileRelease());
  await expect(page.locator('#account-modal')).toHaveCount(0);
  expect(await page.evaluate(() => window.profileListeners)).toBe(0);
});
test('30 profile mount and close cycles release subscriptions', async ({ page }) => {
  await open(page);
  for (let i = 0; i < 30; i++) {
    expect(await page.evaluate(() => window.profileListeners)).toBe(1);
    await page.locator('.adventure-screen [data-dock-action="events"]').click();
    expect(await page.evaluate(() => window.profileListeners)).toBe(0);
    await page.locator('.adventure-screen [data-dock-action="profile"]').click();
    await expect(page.locator('.profile-view')).toBeVisible();
  }
  await expect(page.locator('#account-modal')).toHaveCount(1);
});

test('profile popup keeps long name compact pencil and shortened UID readable across sizes and skins',async({page})=>{
 test.setTimeout(120000);await open(page);
 await page.evaluate(async()=>{
  const {gameState}=await import('/js/gameState.js');
  await(await import('/js/persistence.js')).saveAppearance({...gameState.appearance,profileCosmetics:{avatar:'starter-avatar-little-sparrow',frame:'starter-frame-plain-wood',badge:'starter-badge-first-leaf'}});
  window.profileState.playerName='Người chơi Reks2';window.profileState.uid='firebase-user-0123456789abcdef';
 });
 for(const skin of ['default','woodland','papercut','starship','storybook'])for(const width of [320,412,844,1024]){
  await page.setViewportSize({width,height:width===844?390:915});
  await page.evaluate(async skin=>{await(await import('/js/uiSkin.js')).selectUiSkin(skin);(await import('/js/accountPanel.js')).showAccountPanel();},skin);
  await expect(page.locator('#account-modal .profile-player-name')).toHaveText('Người chơi Reks2');
  await expect(page.locator('#account-modal .profile-uid__value')).toHaveText('fireba…cdef');
  const measured=await page.locator('#account-modal .app-modal').evaluate(node=>{
   const name=node.querySelector('.profile-player-name'),body=node.querySelector('.app-modal__body');
   const rect=node.getBoundingClientRect();
   return{left:rect.left,right:rect.right,viewport:innerWidth,pageOverflow:document.documentElement.scrollWidth-innerWidth,nameOverflow:name.scrollWidth-name.clientWidth,nameClip:name.scrollHeight-name.clientHeight,scrollbar:getComputedStyle(body).scrollbarWidth};
  });
  expect(measured.left).toBeGreaterThanOrEqual(0);expect(measured.right).toBeLessThanOrEqual(measured.viewport);expect(measured.pageOverflow).toBeLessThanOrEqual(1);
  expect(measured.nameOverflow).toBeLessThanOrEqual(1);expect(measured.nameClip).toBeLessThanOrEqual(1);expect(measured.scrollbar).toBe('none');
  await page.getByRole('button',{name:'Sửa tên',exact:true}).click();
  const editor=await page.locator('.profile-name-form').evaluate(form=>{
   const input=form.querySelector('input').getBoundingClientRect(),buttons=[...form.querySelectorAll('button')].map(button=>button.getBoundingClientRect());
   return{overflow:form.scrollWidth-form.clientWidth,inputWidth:input.width,buttonWidths:buttons.map(button=>button.width),buttonY:buttons.map(button=>button.y),inputBottom:input.bottom};
  });
  expect(editor.overflow).toBeLessThanOrEqual(1);expect(Math.abs(editor.buttonWidths[0]-editor.buttonWidths[1])).toBeLessThanOrEqual(1);
  expect(editor.buttonY[0]).toBe(editor.buttonY[1]);expect(editor.inputBottom).toBeLessThanOrEqual(editor.buttonY[0]);expect(editor.inputWidth).toBeGreaterThan(editor.buttonWidths[0]);
  if(skin==='default'&&[320,412].includes(width))await page.screenshot({path:`runtime/qa/profile-name-modal-${width}.png`,animations:'disabled'});
  await page.getByRole('button',{name:'Hủy',exact:true}).click();
  if(skin==='default'&&[320,412].includes(width))await page.screenshot({path:`runtime/qa/profile-modal-${width}.png`,animations:'disabled'});
  await page.locator('#account-modal .app-modal__close').click();await expect(page.locator('#account-modal')).toHaveCount(0);
 }
});

test('UID copy fallback cleans its field and permission failures leave copying available',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  window.profileState.uid='firebase-user-0123456789abcdef';window.profileSubscriber(window.profileState);
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
  document.execCommand=command=>{if(command==='copy'){window.fallbackUid=document.querySelector('textarea').value;return true;}return false;};
 });
 await page.getByRole('button',{name:'Sao chép UID',exact:true}).click();
 expect(await page.evaluate(()=>window.fallbackUid)).toBe('firebase-user-0123456789abcdef');
 await expect(page.locator('textarea')).toHaveCount(0);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Denied');}}}));
 await page.getByRole('button',{name:'Sao chép UID',exact:true}).click();
 await expect(page.locator('.app-toast').filter({hasText:'Chưa sao chép được UID. Hãy thử lại.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Sao chép UID',exact:true})).toBeEnabled();
});
