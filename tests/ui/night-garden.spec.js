import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const folder = 'test-results/night-garden';
mkdirSync(folder, { recursive: true });

test('runtime materials resolve and no wooden victory exports remain', () => {
  const tokens = readFileSync('styles/ui-art-tokens.css', 'utf8');
  const definitions = new Set([...tokens.matchAll(/(--ui-art-[\w-]+)\s*:/g)].map(match => match[1]));
  const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(directory, entry.name)) : entry.name.endsWith('.css') ? [join(directory, entry.name)] : []);
  for (const path of files('styles')) {
    const css = readFileSync(path, 'utf8');
    for (const match of css.matchAll(/var\((--ui-art-[\w-]+)/g)) expect(definitions.has(match[1]), `${path}: ${match[1]}`).toBe(true);
    expect(css).not.toMatch(/--ui-art-reward-(?:panel|paper|title|well|orange|green|secondary|disabled|victory-plate)/);
  }
  const assets = JSON.parse(readFileSync('docs/design/ui-images/runtime-metadata.json', 'utf8')).assets;
  expect(readdirSync('public/assets/images/ui/v1').filter(name => name.endsWith('.webp')).sort()).toEqual(assets.map(asset => `${asset.name}.webp`).sort());
  // Stray faint pixels outside a painted row must not create transparent bands
  // that make nine-slice frames cross labels in profile, HUD and shop.
  const inset = assets.find(asset => asset.name === 'garden-inset');
  expect(inset.size[0] / inset.size[1]).toBeGreaterThan(1.8);
});

for (const size of [{width:320,height:740},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]) test(`ordinary, reward, defeat and information dialogs share Night Garden at ${size.width}`, async ({page}) => {
  await page.setViewportSize(size);
  await page.goto('/');
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  for (const id of ['garden-theme-audit','adventure-chest-modal','time-up-modal','version-modal','reset-modal']) {
    await page.evaluate(async id => {
      window.nightAudit = (await import('/js/modal.js')).openAppModal({ id, artwork: id === 'adventure-chest-modal' ? 'reward' : 'garden', title:'Thông tin', icon:'timer', content:'Bạn có muốn tiếp tục?', actions:[{label:'Đóng'},{label:'Tiếp tục', variant:'primary'},{label:'Xóa dữ liệu',variant:'danger'}] });
    }, id);
    const panel = page.locator(`#${id} .app-modal`);
    await expect(panel).toHaveCSS('border-image-source', /garden-panel.webp/);
    await expect(panel.locator('.app-modal__close')).toHaveCSS('background-image', /garden-square.webp/);
    await expect(panel.locator('.app-button--secondary')).toHaveCSS('border-image-source', /garden-secondary.webp/);
    await expect(panel.locator('.app-button--primary')).toHaveCSS('border-image-source', /garden-primary.webp/);
    await expect(panel.locator('.app-button--danger')).toHaveCSS('border-image-source', /garden-danger.webp/);
    await panel.locator('.app-button--danger').evaluate(node => { node.disabled = true; });
    await expect(panel.locator('.app-button--danger')).toHaveCSS('border-image-source', /garden-disabled.webp/);
    await page.screenshot({path:`${folder}/${id}-${size.width}.png`});
    await page.evaluate(() => window.nightAudit.destroy());
    await expect(panel).toHaveCount(0);
  }
});

test('the real chest and reward notification use the garden materials across three games', async ({page}) => {
  await page.setViewportSize({width:412,height:915});
  await page.goto('/');
  for (const game of ['memory-match','link-connect','triple-connect']) {
    await page.evaluate(async game => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game),game);
    await page.locator('.adventure-map-node--chest').first().click();
    await expect(page.locator('#adventure-chest-modal .app-modal')).toHaveCSS('border-image-source',/garden-panel.webp/);
    await expect(page.locator('#adventure-chest-modal .app-modal__title svg image')).toHaveAttribute('href',/night-chest.webp/);
    await page.screenshot({path:`${folder}/chest-${game}.png`});
    await page.locator('#adventure-chest-modal .app-modal__close').click();
    await expect(page.locator('#adventure-chest-modal')).toHaveCount(0);
  }
  await page.evaluate(async () => (await import('/js/ui.js')).showGameplayRewardPopup({title:'Phần thưởng!',type:'coins',value:18,sound:false}));
  await expect(page.locator('.gameplay-reward-toast')).toHaveCSS('background-color','rgb(8, 38, 46)');
  await expect(page.locator('.gameplay-reward-toast')).toHaveCSS('border-image-source',/garden-panel.webp/);
  expect(await page.locator('.gameplay-reward-toast').evaluate(node => getComputedStyle(node,'::before').backgroundImage)).toContain('night-gift.webp');
  await page.screenshot({path:`${folder}/reward-notification.png`});
  await page.evaluate(async () => (await import('/js/ui.js')).clearGameplayRewardPopups());
  await expect(page.locator('.gameplay-reward-toast')).toHaveCount(0);
});
