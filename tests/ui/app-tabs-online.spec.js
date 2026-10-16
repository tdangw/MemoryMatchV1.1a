import { expect, test } from '@playwright/test';
test.skip(process.env.VITE_FIREBASE_USE_EMULATORS !== '1', 'Isolated Firebase emulator only.');
async function ready(page) {
  await page.goto('/');
  await expect.poll(() => page.evaluate(async () => (await import('/js/accountService.js')).getAccountService()?.getState().phase), { timeout: 30000 }).toBe('synced');
}
test('profile saves a real guest name and renders linked Google state without exposing email', async ({ page }) => {
  await ready(page); await page.locator('[data-dock-action="profile"]').click();
  await page.getByRole('button', { name: 'Sửa tên', exact: true }).click();
  await page.locator('.account-name-input').fill('Hoa Trong Vườn');
  await page.getByRole('button', { name: 'Lưu tên', exact: true }).click();
  await expect(page.locator('.profile-name-form')).toBeHidden();
  await expect(page.locator('.profile-player-name')).toHaveText('Hoa Trong Vườn');
  await page.evaluate(async () => {
    const sdkUrl = performance.getEntriesByType('resource').find(entry => entry.name.includes('/deps/firebase_auth.js'))?.name;
    if (!sdkUrl) throw new Error('Missing emulator Auth SDK');
    const sdk = await import(sdkUrl); const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    await sdk.linkWithCredential(backend.auth.currentUser, sdk.GoogleAuthProvider.credential(JSON.stringify({ sub: crypto.randomUUID(), email: 'profile-ui@example.test', email_verified: true })));
  });
  await expect(page.locator('.account-identity')).toHaveText('Đã liên kết Google');
  await expect(page.getByRole('button', { name: 'Đổi tài khoản Google', exact: true })).toBeVisible();
  await expect(page.locator('.profile-view')).not.toContainText('profile-ui@example.test');
  await expect(page.locator('.account-play-details')).toContainText('Tham gia');
});
test('reopening a board sees another device result even while the 15s cache clock is frozen', async ({ browser, baseURL }) => {
  test.setTimeout(60000);
  const a = await browser.newContext({ baseURL, serviceWorkers: 'block' }); const b = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  try {
    const first = await a.newPage(); const second = await b.newPage(); await ready(first); await ready(second);
    await first.evaluate(() => { const at = Date.now(); Date.now = () => at; });
    await first.locator('[data-dock-action="ranking"]').click();
    await expect(first.locator('.leaderboard-results')).not.toHaveAttribute('aria-busy', 'true');
    await expect(first.locator('.leaderboard-results')).not.toContainText('Người chơi mới');
    await second.evaluate(async () => {
      const identity = (await import('/js/accountService.js')).getAccountService().getIdentity();
      const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
      const result = (await import('/js/progressRankingModel.js')).createProgressResult('memory-match', 'adventure', 1000000, { profileId: identity.profileId, uid: identity.uid });
      await (await import('/js/leaderboardStore.js')).submitRankingResult({ database: backend.database, environment: backend.environment, uid: identity.uid, playerName: 'Người chơi mới', result });
    });
    await first.locator('.adventure-screen [data-dock-action="events"]').click();
    await first.locator('.adventure-screen [data-dock-action="ranking"]').click();
    await expect(first.locator('.leaderboard-list')).toContainText('Người chơi mới');
    await expect(first.locator('.leaderboard-list')).toContainText('1.000.000');
  } finally { await a.close(); await b.close(); }
});
