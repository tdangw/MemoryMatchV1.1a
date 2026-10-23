const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const output = path.resolve(__dirname, '../../docs/design/achievements/runtime/qa');
const viewports = { reference: [412, 915], narrow: [320, 740], landscape: [844, 390], desktop: [1024, 768] };
async function boot(page) {
  page.on('pageerror', error => console.log('Page error:', error.message));
  page.on('console', message => { if (message.type() === 'error') console.log('Browser error:', message.text()); });
  await page.goto('/');
  try { await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 }); }
  catch (error) {
    console.log(await page.evaluate(() => ({ phase: document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),
      resourcesLoaded: performance.getEntriesByType('resource').length })));
    throw error;
  }
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    window.storybookRenderer = await import('/js/storybook/presentation.js');
    const manifest = await (await fetch('/docs/design/achievements/art-kit-v1/manifest.json')).json();
    window.storybookItems = Object.values(manifest.items).map(item => ({ id: item.id, type: item.type,
      image: '/docs/design/achievements/art-kit-v1/' + item.exports['256'].file,
      name: item.name, gameName: { 'memory-match': 'Memory Match', 'link-connect': 'Link Connect', 'triple-connect': 'Triple Connect' }[item.game], owned: true }));
  });
}
async function show(page, kind) {
  await page.evaluate(kind => {
    window.storybookModal?.destroy();
    const renderer = window.storybookRenderer, items = window.storybookItems;
    const item = id => items.find(value => value.id === id);
    if (kind === 'profile') {
      window.storybookModal = renderer.openCosmeticCustomization({ playerName: 'Minh Anh',
        items: items.filter(value => ['avatar', 'frame', 'badge'].includes(value.type)),
        equipped: { avatar: 'link-avatar-moonfox', frame: 'memory-frame-golden-laurel', badge: 'memory-badge-wisdom' },
        onSave: async draft => { window.storybookSaveCount = (window.storybookSaveCount || 0) + 1; window.storybookSavedDraft = draft; return window.storybookSaveSucceeds !== false; },
      });
    } else if (kind === 'reward') {
      const reward = item('link-avatar-moonfox');
      window.storybookModal = renderer.openStorybookModal({ kind: 'achievement-notice', id: 'storybook-reward-review',
        title: 'Thành tích hoàn tất', dismissible: false, closeOnBackdrop: false, closeOnEscape: false,
        content: renderer.createAchievementNoticeContent({ gameName: 'Link Connect', level: 5, name: reward.name,
          category: 'Ảnh đại diện', type: 'avatar', image: reward.image, storedIn: 'Đã thêm vào Hồ sơ',
          firstHint: 'Chạm ảnh đại diện trong Hồ sơ để thay đổi.' }),
        actions: [{ label: 'Tiếp tục', variant: 'primary' }],
      });
    } else {
      window.storybookModal = renderer.openStorybookModal({ kind: 'achievement-list', id: 'storybook-list-review',
        title: 'Bộ sưu tập', content: renderer.createAchievementListContent({ gameName: 'Link Connect', levels: [
          { level: 4, completed: [true, true, true, true], image: item('link-effect-meteor-route').image, name: 'Tinh Tuyến' },
          { level: 5, completed: [true, true, true, true], image: item('link-avatar-moonfox').image, name: 'Cáo Ánh Trăng' },
          { level: 6, completed: [true, true, true, false], image: item('link-frame-silver-moon').image, name: 'Vầng Trăng Bạc' },
          { level: 7, completed: [false, false, false, false], image: item('link-badge-golden-bond').image, name: 'Vòng Kết Nối' },
        ] }), actions: [{ label: 'Tiếp tục', variant: 'primary' }],
      });
    }
  }, kind);
  await page.evaluate(async () => {
    await document.fonts.load('900 23px "Storybook Nunito"', 'Thành tích hoàn tất Ảnh đại diện');
    await document.fonts.ready;
    const images = [...document.querySelectorAll('.storybook-surface img')];
    await Promise.all(images.map(image => image.decode()));
  });
  await expect(page.locator('.storybook-surface')).toBeVisible();
  // The shared tooltip owner has a finite dismissal after initial dialog focus.
  await expect(page.locator('#app-tooltip')).toBeHidden();
}
for (const [name, [width, height]] of Object.entries(viewports)) {
  for (const kind of ['reward', 'profile', 'collection']) test(`${name} ${kind}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await boot(page); await show(page, kind);
    const geometry = await page.locator('.storybook-surface').evaluate(panel => {
      const rect = panel.getBoundingClientRect(), body = panel.querySelector('.app-modal__body');
      const footer = panel.querySelector('.app-modal__footer').getBoundingClientRect();
      const anchors = {};
      for (const [name, selector] of Object.entries({ title: '.app-modal__header', body: '.app-modal__body',
        footer: '.app-modal__footer', hero: '.storybook-achievement__hero, .storybook-customization__hero',
        tabs: '.storybook-tabs', grid: '.storybook-inventory', list: '.storybook-collection' })) {
        const node = panel.querySelector(selector);
        if (node) { const box = node.getBoundingClientRect(); anchors[name] = [box.left - rect.left, box.top - rect.top, box.width, box.height]; }
      }
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, footerBottom: footer.bottom, anchors,
        overflow: body.scrollWidth - body.clientWidth, font: getComputedStyle(panel).fontFamily,
        buttons: [...panel.querySelectorAll('.app-modal__footer button, .app-modal__close')].map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })) };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(0); expect(geometry.right).toBeLessThanOrEqual(width);
    expect(geometry.top).toBeGreaterThanOrEqual(0); expect(geometry.bottom).toBeLessThanOrEqual(height);
    expect(geometry.footerBottom).toBeLessThanOrEqual(height); expect(geometry.overflow).toBeLessThanOrEqual(1);
    expect(geometry.font).toContain('Storybook Nunito');
    for (const button of geometry.buttons) { expect(button.width).toBeGreaterThanOrEqual(44); expect(button.height).toBeGreaterThanOrEqual(44); }
    await fs.mkdir(output, { recursive: true });
    await page.screenshot({ path: path.join(output, `${name}-${kind}.png`) });
    await fs.writeFile(path.join(output, `${name}-${kind}.json`), JSON.stringify(geometry, null, 2));
    if (kind === 'reward') await expect(page.locator('.storybook-surface button')).toHaveText(['Tiếp tục']);
  });
}
test('draft, keyboard, save failure and cancel remain owned by the real modal', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 }); await boot(page); await show(page, 'profile');
  const selectedTab = page.getByRole('tab', { name: 'Ảnh đại diện', exact: true });
  await selectedTab.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Khung viền', exact: true })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Khung viền', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('[data-item-id="link-frame-silver-moon"]').click();
  await page.evaluate(() => { window.storybookSaveSucceeds = false; });
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Chưa lưu được thay đổi. Hãy thử lại.');
  expect(await page.evaluate(() => window.storybookSavedDraft.frame)).toBe('link-frame-silver-moon');
  await page.keyboard.press('Escape'); await expect(page.locator('.storybook-surface')).toHaveCount(0);
  await show(page, 'profile');
  await page.getByRole('tab', { name: 'Khung viền', exact: true }).click();
  await expect(page.locator('[data-item-id="memory-frame-golden-laurel"]')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => {
    window.storybookSaveSucceeds = true; window.storybookSaveCount = 0;
    const button = document.querySelector('.storybook-surface .app-modal__footer button'); button.click(); button.click();
  });
  await expect(page.locator('.storybook-surface')).toHaveCount(0);
  expect(await page.evaluate(() => window.storybookSaveCount)).toBe(1);
});
for (const motion of ['reduce', 'no-preference']) test(`20 cycles cleanup ${motion}`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: motion }); await boot(page);
  const diagnostics = await page.evaluate(async () => {
    const lifecycle = await import('/js/gameShell/gameShellLifecycle.js');
    const result = [];
    for (let cycle = 0; cycle < 20; cycle++) {
      const owner = lifecycle.createGameShellLifecycle();
      const modal = window.storybookRenderer.openCosmeticCustomization({ playerName: 'Người chơi',
        items: window.storybookItems.filter(item => item.type !== 'effect-cover'), equipped: {}, owner, onSave: async () => true });
      modal.panel.querySelector('[data-category="frame"]').click();
      owner.dispose(); owner.dispose();
      result.push(owner.diagnostics());
      if (document.querySelectorAll('.storybook-surface').length) throw new Error('Detached modal still mounted');
    }
    return result;
  });
  for (const row of diagnostics) for (const [key, value] of Object.entries(row)) if (key !== 'active') expect(value).toBe(0);
});
