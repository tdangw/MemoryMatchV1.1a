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
}
for (const viewport of [{ width: 320, height: 740 }, { width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) test(`profile editor preserves drafts and layout ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); await open(page);
  await expect(page.locator('.profile-name-form')).toBeHidden();
  await expect(page.locator('#account-modal .app-modal__footer')).toHaveCount(0);
  await expect(page.locator('.account-status')).toBeEmpty();
  const title = await page.locator('.profile-player-name').boundingBox();
  const pencil = await page.getByRole('button', { name: 'Sửa tên' }).boundingBox();
  expect(pencil.x - title.x - title.width).toBeLessThanOrEqual(8);
  await page.getByRole('button', { name: 'Sửa tên' }).click();
  await expect(page.locator('.profile-player-name')).toBeHidden();
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
  await page.screenshot({ path: `docs/design/app-tabs/qa/profile-inline-${viewport.width}.png`, animations: 'disabled' });
});
test('profile failures keep the draft, UID changes discard it, pending actions do not mutate a closed view', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Sửa tên' }).click();
  await page.locator('.account-name-input').fill('Bản nháp'); await page.evaluate(() => window.profileFailure = true);
  await page.getByRole('button', { name: 'Lưu tên', exact: true }).click();
  await expect(page.locator('.profile-error')).toHaveText('Tên chưa được lưu.');
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
  }
  await expect(page.locator('#account-modal')).toHaveCount(1);
});
