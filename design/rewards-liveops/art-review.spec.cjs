const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const output = path.join(__dirname, 'review');
async function ready(page) {
  await page.goto('/');
  await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 });
  await page.evaluate(async () => {
    await (await import('/js/uiSkin.js')).selectUiSkin('storybook');
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    window.artRenderer = await import('/js/storybook/presentation.js');
    const manifest = await (await fetch('/design/rewards-liveops/art-manifest.json')).json();
    window.artItems = Object.values(manifest.items).map(item => ({ ...item, owned: true,
      gameName: 'Memory Match', image: '/design/rewards-liveops/' + item.exports['256'].file }));
  });
}
async function decoded(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('.storybook-surface img')].map(img => img.decode()));
  });
  await expect(page.locator('.storybook-surface')).toBeVisible();
  await expect(page.locator('#app-tooltip')).toBeHidden();
}
for (const [name, width, height] of [['reference', 412, 915], ['narrow', 320, 740], ['landscape', 844, 390], ['desktop', 1024, 768]]) {
  test(`A1 representative layers ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await ready(page);
    await page.evaluate(() => {
      window.artModal = window.artRenderer.openCosmeticCustomization({ playerName: 'Minh Anh', items: window.artItems,
        equipped: Object.fromEntries(window.artItems.map(item => [item.type, item.id])), onSave: async () => false });
    });
    await decoded(page);
    await expect(page.locator('.storybook-customization__hero .storybook-portrait img')).toHaveCount(3);
    const geometry = await page.locator('.storybook-surface').evaluate(panel => {
      const r = panel.getBoundingClientRect(), body = panel.querySelector('.app-modal__body');
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, overflow: body.scrollWidth - body.clientWidth };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0); expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(width); expect(geometry.bottom).toBeLessThanOrEqual(height);
    expect(geometry.overflow).toBeLessThanOrEqual(1);
    for (const category of ['Ảnh đại diện', 'Khung viền', 'Huy hiệu']) {
      await page.getByRole('tab', { name: category, exact: true }).click(); await decoded(page);
    }
    await page.getByRole('tab', { name: 'Ảnh đại diện', exact: true }).click();
    await fs.mkdir(output, { recursive: true });
    await page.screenshot({ path: path.join(output, `${name}-profile.png`) });
    await page.keyboard.press('Escape'); await expect(page.locator('.storybook-surface')).toHaveCount(0);
  });
}
test('A1 three heroes and existing small portrait renderer', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await ready(page);
  for (const type of ['avatar', 'frame', 'badge']) {
    await page.evaluate(type => {
      const renderer = window.artRenderer, item = window.artItems.find(item => item.type === type);
      window.artModal = renderer.openStorybookModal({ kind: 'achievement-notice', id: 'expansion-art-hero', title: 'Thành tích hoàn tất',
        dismissible: false, content: renderer.createAchievementNoticeContent({ gameName: item.gameName, level: item.level,
          name: item.name, category: { avatar: 'Ảnh đại diện', frame: 'Khung viền', badge: 'Huy hiệu' }[type],
          type, image: item.image, storedIn: 'Đã thêm vào Hồ sơ' }), actions: [{ label: 'Tiếp tục', variant: 'primary' }] });
    }, type);
    await decoded(page); await page.screenshot({ path: path.join(output, `reference-hero-${type}.png`) });
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
    await expect(page.locator('.storybook-surface')).toHaveCount(0);
  }
  await page.evaluate(async () => {
    await import('/styles/leaderboard.css'); await import('/styles/profile.css');
    const content = document.createElement('div');
    const selection = Object.fromEntries(window.artItems.map(item => [item.type, item.image]));
    for (const className of ['profile-avatar', 'leaderboard-avatar']) {
      const row = document.createElement('p'), portrait = document.createElement('span');
      portrait.className = className; portrait.append(window.artRenderer.createCosmeticPortrait(selection));
      row.append(portrait, document.createTextNode('Minh Anh')); content.append(row);
    }
    window.artModal = window.artRenderer.openStorybookModal({ kind: 'profile', id: 'expansion-art-small', title: 'Đồ hồ sơ', content });
  });
  await decoded(page);
  const geometry = await page.locator('.storybook-surface .leaderboard-avatar').evaluate(node => ({
    width: node.getBoundingClientRect().width, layers: node.querySelectorAll('img').length }));
  expect(geometry.width).toBe(56); expect(geometry.layers).toBe(3);
  await page.screenshot({ path: path.join(output, 'reference-small-portraits.png') });
});
