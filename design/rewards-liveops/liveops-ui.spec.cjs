const { test, expect } = require('@playwright/test');
const path = require('node:path');
async function ready(page) {
  await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 });
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    const { gameState } = await import('/js/gameState.js');
    gameState.appearance.profileCosmetics = { avatar: 'starter-avatar-little-sparrow', frame: 'starter-frame-plain-wood', badge: 'starter-badge-first-leaf' };
  });
}
test('profile portrait, basic first row and paged inventory at four viewports', async ({ page }) => {
  for (const [width, height] of [[412, 915], [320, 740], [844, 390], [1024, 768]]) {
    await page.setViewportSize({ width, height }); await ready(page);
    await page.evaluate(async () => { window.profileView = (await import('/js/accountPanel.js')).showAccountPanel(); });
    await expect(page.locator('.profile-avatar')).toBeVisible();
    expect((await page.locator('.profile-avatar').boundingBox()).width).toBeGreaterThanOrEqual(104);
    const decoded = await page.locator('.profile-avatar img').evaluateAll(async images => {
      await Promise.all(images.map(image => image.decode())); return images.every(image => image.naturalWidth >= 256);
    }); expect(decoded).toBe(true);
    await page.screenshot({ path: path.join(__dirname, `review/profile-large-${width}.png`) });
    await page.locator('.profile-avatar').click();
    for (const [name, id] of [['Ảnh đại diện', 'starter-avatar-little-sparrow'], ['Khung viền', 'starter-frame-plain-wood'], ['Huy hiệu', 'starter-badge-first-leaf']]) {
      await page.getByRole('tab', { name, exact: true }).click();
      await expect(page.locator('.storybook-item').first()).toHaveAttribute('data-item-id', id);
      expect(await page.locator('.storybook-item').count()).toBeLessThanOrEqual(12);
      const decode = await page.locator('#profile-customization-modal img').evaluateAll(async images => {
        await Promise.all(images.map(image => image.decode()));
        const unique = new Map(images.map(image => [image.currentSrc, image.naturalWidth * image.naturalHeight * 4]));
        return { bytes: [...unique.values()].reduce((sum, bytes) => sum + bytes, 0), largest: Math.max(...images.map(image => image.naturalWidth)) };
      });
      expect(decode.bytes).toBeLessThanOrEqual(24 * 1024 * 1024); expect(decode.largest).toBeLessThanOrEqual(256);
      const overflow = await page.locator('#profile-customization-modal .app-modal__body').evaluate(node => node.scrollWidth - node.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    }
  }
});
test('missions/events content scrolls at four sizes and five skins, web never grants ad rewards', async ({ page }) => {
  test.setTimeout(120000); await ready(page);
  for (const skin of ['default', 'woodland', 'papercut', 'starship', 'storybook']) {
    await page.evaluate(async skin => (await import('/js/uiSkin.js')).selectUiSkin(skin), skin);
    for (const [width, height] of [[412, 915], [320, 740], [844, 390], [1024, 768]]) {
      await page.setViewportSize({ width, height });
      for (const kind of ['missions', 'events']) {
        await page.evaluate(async kind => { window.liveView = (await import('/js/liveops/presentation.js')).openLiveopsPage(kind); }, kind);
        await expect(page.locator('.liveops')).toBeVisible();
        const overflow = await page.locator('.liveops').evaluate(node => node.scrollWidth - node.clientWidth); expect(overflow).toBeLessThanOrEqual(1);
        await expect(page.locator(`#${kind}-screen .app-modal__close`)).toBeVisible();
        if (kind === 'events') {
          await expect(page.getByRole('button', { name: 'Xem quảng cáo · Thêm 1 lượt', exact: true })).toBeDisabled();
          await expect(page.locator('.liveops__sector')).toHaveCount(8);
        }
        if (width === 412 && skin === 'storybook') await page.screenshot({ path: path.join(__dirname, `review/${kind}-runtime.png`) });
        await page.evaluate(() => window.liveView.destroy());
      }
    }
  }
});
test('twenty page lifecycle cycles release owned scopes and nodes', async ({ page }) => {
  await ready(page);
  const counts = await page.evaluate(async () => {
    const { openLiveopsPage } = await import('/js/liveops/presentation.js');
    const owner = (await import('/js/appPageLifecycle.js')).getAppPageScope();
    const before = owner.diagnostics();
    for (let cycle = 0; cycle < 20; cycle++) { const modal = openLiveopsPage(cycle % 2 ? 'events' : 'missions'); modal.destroy(); }
    await Promise.resolve(); return { before, after: owner.diagnostics(), nodes: document.querySelectorAll('.liveops').length };
  });
  expect(counts.nodes).toBe(0); expect(counts.after).toEqual(counts.before);
});
