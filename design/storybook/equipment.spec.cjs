const { test, expect } = require('@playwright/test');
async function boot(page) {
  await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#app-loading')).toHaveCount(0);
  await page.evaluate(async () => {
    const { gameState: state } = await import('/js/gameState.js'); const { savePersistentGameData } = await import('/js/persistence.js');
    for (const key of ['memoryMatch', 'linkConnect', 'tripleConnect']) for (let level = 1; level <= 10; level++) for (const mode of ['easy', 'normal', 'hard', 'superHard']) state.progress[key].bestByLevel[`${mode}:${level}`] = { score: 0, stars: 0, cleared: true, rulesVersion: 1, completedWaves: 2 };
    await savePersistentGameData({ progress: state.progress });
    const appearance = structuredClone(state.appearance); Object.values(appearance.achievements.grants).forEach(receipt => receipt.announced = true);
    await savePersistentGameData({ appearance });
  });
}
async function open(page) { await page.evaluate(async () => (await import('/js/accountPanel.js')).showAccountPanel()); await page.getByRole('button', { name: 'Trang trí hồ sơ', exact: true }).click(); }
test('F3 profile draft cancel, real save, shared anchors, reload and locked guard', async ({ page }) => {
  await boot(page); await open(page);
  const modal = page.locator('#profile-customization-modal');
  const avatar = modal.locator('[data-item-id]').first(); const id = await avatar.getAttribute('data-item-id'); await avatar.click();
  await modal.getByRole('button', { name: 'Đóng', exact: true }).click(); await expect(modal).toHaveCount(0);
  expect(await page.evaluate(() => import('/js/gameState.js').then(m => m.gameState.appearance.profileCosmetics.avatar))).toBeNull();
  await page.getByRole('button', { name: 'Trang trí hồ sơ', exact: true }).click(); await modal.locator(`[data-item-id="${id}"]`).click();
  for (const label of ['Khung viền', 'Huy hiệu']) { await modal.getByRole('tab', { name: label, exact: true }).click(); await modal.locator('[data-item-id]').first().click(); }
  const layers = await modal.locator('.storybook-customization__hero img').evaluateAll(images => images.map(image => { const r = image.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
  expect(layers).toHaveLength(3); expect(layers[1]).toEqual(layers[0]);
  expect(layers[2][2] / layers[0][2]).toBeCloseTo(.28, 2); expect((layers[2][0] - layers[0][0]) / layers[0][2]).toBeCloseTo(.36, 2);
  await modal.getByRole('button', { name: 'Lưu thay đổi' }).click(); await expect(modal).toHaveCount(0);
  await expect(page.locator('#account-modal .profile-avatar img')).toHaveCount(3);
  await page.reload(); await expect(page.locator('#app-loading')).toHaveCount(0, { timeout: 20000 }); await open(page);
  await expect(modal.locator('.storybook-customization__hero img')).toHaveCount(3);
  expect(await modal.locator(`[data-item-id="${id}"]`).getAttribute('aria-pressed')).toBe('true');
});
for (const [skin, width, height] of [['default',320,740],['woodland',412,915],['papercut',844,390],['starship',1024,768],['storybook',412,915]]) test(`F3 profile layout ${skin}`, async ({ page }) => {
  await page.setViewportSize({ width, height }); await boot(page);
  await page.evaluate(async skin => (await import('/js/uiSkin.js')).selectUiSkin(skin), skin); await open(page);
  const modal = page.locator('#profile-customization-modal'); await expect(modal.getByRole('button', { name: 'Lưu thay đổi' })).toBeInViewport();
  const bounds = await modal.locator('.app-modal').boundingBox(); expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
  await modal.getByRole('tab', { name: 'Khung viền', exact: true }).focus(); await page.keyboard.press('ArrowRight'); await expect(modal.getByRole('tab', { name: 'Huy hiệu', exact: true })).toBeFocused();
  await page.screenshot({ path: `docs/design/achievements/runtime/qa/f3-profile-${skin}.png` });
});
test('F3 owned effect cover/equip correct games and collection retains one-time 300 coins', async ({ page }) => {
  await boot(page);
  for (const [game, tab, id] of [['memory-match','Hiệu ứng lật','memory-effect-moonflip'],['memory-match','Hiệu ứng lật','memory-effect-spring-petals'],['link-connect','Đường nối','link-effect-meteor-route'],['link-connect','Xóa thẻ','link-effect-moon-petals'],['triple-connect','Xóa thẻ','triple-effect-crystal-bloom'],['triple-connect','Đường nối','triple-effect-triad-converge']]) {
    await page.evaluate(async game => (await import('/js/mainmenu.js')).showCollectionModal({ gameId: game }), game);
    const modal = page.locator('#collection-modal');
    await expect(modal.getByRole('tab', { name: 'Thành tích', exact: true })).toBeVisible();
    await modal.getByRole('tab', { name: 'Thành tích', exact: true }).click();
    await expect(modal.locator('.storybook-achievement-row')).toHaveCount(10);
    await expect(modal.getByText('Xem tranh', { exact: true })).toHaveCount(0);
    if (id === 'memory-effect-moonflip') {
      const before = await page.evaluate(() => import('/js/gameState.js').then(m => m.gameState.coins));
      await modal.getByRole('button', { name: 'Nhận 300 Xu', exact: true }).click();
      await expect(modal.getByText('Đã nhận 300 Xu', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => import('/js/gameState.js').then(m => m.gameState.coins))).toBe(before + 300);
      await expect(modal.getByRole('button', { name: 'Nhận 300 Xu' })).toHaveCount(0);
    }
    await modal.getByRole('tab', { name: tab, exact: true }).click();
    const card = modal.locator('.appearance-choice').filter({ has: page.locator(`img[src*="${id}"]`) });
    await expect(card).toHaveCount(1); await card.getByRole('button', { name: 'Trang bị', exact: true }).click();
    await expect(card.getByRole('button', { name: 'Đang dùng', exact: true })).toBeVisible();
    await modal.getByRole('button', { name: 'Đóng', exact: true }).click(); await expect(modal).toHaveCount(0);
  }
});
test('F3 cancellation and save failure keep prior equipment and twenty owners clean', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const { createGameShellLifecycle } = await import('/js/gameShell/gameShellLifecycle.js');
    const { openProfileCustomization } = await import('/js/progression/profileCosmetics.js');
    const { gameState } = await import('/js/gameState.js');
    for (let index = 0; index < 20; index++) { const owner = createGameShellLifecycle(); const modal = openProfileCustomization({ playerName: 'Người chơi', owner }); modal.panel.querySelector('[data-item-id]').click(); modal.panel.querySelector('.app-modal__footer button').click(); owner.dispose(); await modal.whenClosed; if (owner.diagnostics().listener || owner.diagnostics().timeout) throw Error('Leaked owner'); }
    return { selected: gameState.appearance.profileCosmetics.avatar, modals: document.querySelectorAll('#profile-customization-modal').length };
  });
  expect(result).toEqual({ selected: null, modals: 0 });
  await open(page);
  await page.evaluate(() => { const transaction = IDBDatabase.prototype.transaction; IDBDatabase.prototype.transaction = function(names, mode, ...args) { if (mode === 'readwrite') throw new DOMException('quota', 'QuotaExceededError'); return transaction.call(this,names,mode,...args); }; });
  await page.locator('#profile-customization-modal [data-item-id]').first().click(); await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.locator('.storybook-customization__error')).toHaveText('Chưa lưu được thay đổi. Hãy thử lại.');
  expect(await page.evaluate(() => import('/js/gameState.js').then(m => m.gameState.appearance.profileCosmetics.avatar))).toBeNull();
});
test('F3 locked inventory and unavailable cosmetic images retain a safe portrait', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#app-loading')).toHaveCount(0, { timeout:20000 });
  await expect(page.locator('.game-selector__choice').first()).toBeVisible(); await open(page);
  await expect(page.locator('#profile-customization-modal [data-item-id]:disabled')).toHaveCount(9);
  await expect(page.locator('#profile-customization-modal [data-item-id]:enabled')).toHaveCount(0);
  await page.route('**/assets/achievements/v1/**', route => route.abort()); await boot(page); await open(page);
  await page.locator('#profile-customization-modal [data-item-id]').first().click();
  await expect(page.locator('.storybook-customization__hero .storybook-portrait img')).toHaveCount(0);
  await expect(page.locator('.storybook-customization__hero .storybook-portrait > .ui-icon')).toHaveCount(1);
});
test('F3 groups beyond catalog retain 300-coin claims without creating rewards after level ten', async ({ page }) => {
  await boot(page);
  const before=await page.evaluate(async () => {
    const {gameState:state}=await import('/js/gameState.js');
    for(let level=11;level<=20;level++) for(const mode of ['easy','normal','hard','superHard']) state.progress.memoryMatch.bestByLevel[`${mode}:${level}`]={score:0,stars:0,cleared:true,rulesVersion:1,completedWaves:2};
    state.progress.memoryMatch.adventure.unlockedThrough=21;
    await (await import('/js/persistence.js')).savePersistentGameData({progress:state.progress});
    return state.coins;
  });
  await page.evaluate(async () => (await import('/js/mainmenu.js')).showCollectionModal({gameId:'memory-match'}));
  const modal=page.locator('#collection-modal');
  await modal.getByRole('button',{name:'Nhóm sau',exact:true}).click();
  await expect(modal.getByRole('heading',{name:'Màn 11–20',exact:true})).toBeVisible();
  await modal.getByRole('button',{name:'Nhận 300 Xu',exact:true}).click(); await expect(modal.getByText('Đã nhận 300 Xu',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>import('/js/gameState.js').then(m=>m.gameState.coins))).toBe(before+300);
  await expect(modal.locator('.storybook-achievement-row')).toHaveCount(10);
  expect(await page.evaluate(()=>import('/js/gameState.js').then(m=>Object.keys(m.gameState.appearance.achievements.grants).filter(key=>key.startsWith('memory-match:')).length))).toBe(10);
  await modal.getByRole('button',{name:'Nhóm trước',exact:true}).click(); await modal.getByRole('button',{name:'Nhóm sau',exact:true}).click();
  await expect(modal.getByRole('button',{name:'Nhận 300 Xu',exact:true})).toHaveCount(0);
});
