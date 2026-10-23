const { test, expect } = require('@playwright/test');
test('F3 two real accounts: profile save, public BXH, offline retry and unchanged rank', async ({ browser }) => {
  const a = await browser.newContext(), b = await browser.newContext(); const first = await a.newPage(), second = await b.newPage();
  try {
    for (const page of [first, second]) {
      await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 });
      await expect.poll(() => page.evaluate(async () => (await import('/js/accountService.js')).getAccountService()?.getState().bound), { timeout: 30000 }).toBe(true);
      await page.evaluate(async () => { const service = (await import('/js/progression/publicCosmeticSync.js')).getPublicCosmeticSync(); await service.ready; });
    }
    const player = await first.evaluate(async () => {
      const account = (await import('/js/accountService.js')).getAccountService(); await account.setPlayerName('Người chơi Cổ tích');
      const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
      const result = (await import('/js/progressRankingModel.js')).createProgressResult('memory-match', 'adventure', 17, account.getIdentity());
      await (await import('/js/leaderboardStore.js')).submitRankingResult({ ...backend, uid: account.getIdentity().uid, playerName: 'Người chơi Cổ tích', result });
      const { gameState: state } = await import('/js/gameState.js'), persistence = await import('/js/persistence.js');
      for (const level of [1,2,3,5]) for (const mode of ['easy','normal','hard','superHard']) state.progress.memoryMatch.bestByLevel[`${mode}:${level}`] = { score: 0, stars: 0, cleared: true, rulesVersion: 1, completedWaves: 2 };
      await persistence.savePersistentGameData({ progress: state.progress });
      return account.getIdentity().uid;
    });
    await first.evaluate(async () => (await import('/js/accountPanel.js')).showAccountPanel()); await first.getByRole('button', { name: 'Trang trí hồ sơ', exact: true }).click();
    const modal = first.locator('#profile-customization-modal');
    for (const label of ['Ảnh đại diện','Khung viền','Huy hiệu']) { await modal.getByRole('tab', { name: label, exact: true }).click(); await modal.locator('[data-item-id]:enabled').first().click(); }
    await modal.getByRole('button', { name: 'Lưu thay đổi' }).click(); await expect(modal).toHaveCount(0);
    await expect(first.locator('.profile-cosmetics-status')).toHaveText('Trang trí hồ sơ đã đồng bộ.', { timeout: 20000 });
    await second.evaluate(async () => (await import('/js/leaderboardPanel.js')).openLeaderboards('memory-match'));
    const row = second.locator('.leaderboard-list li').filter({ hasText: 'Người chơi Cổ tích' }); await expect(row.locator('img')).toHaveCount(3, { timeout: 20000 });
    const initial = await row.locator('img').first().getAttribute('src'); await expect(row).toContainText('17');
    const before = await second.evaluate(async uid => { const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend(); const data = await (await import('/js/leaderboardStore.js')).readLeaderboard({ ...backend, board: { gameId:'memory-match',family:'adventure',kind:'progress',rulesVersion:3 }, uid, refresh:true }); return data.top.find(row => row.uid === uid); }, player);
    await a.setOffline(true); await first.getByRole('button', { name: 'Trang trí hồ sơ', exact: true }).click();
    await modal.locator('[data-item-id]:enabled').nth(1).click(); await modal.getByRole('button', { name: 'Lưu thay đổi' }).click(); await expect(modal).toHaveCount(0);
    await expect(first.locator('.profile-cosmetics-status')).toContainText('Sẽ đồng bộ khi có kết nối');
    await a.setOffline(false); await expect(first.locator('.profile-cosmetics-status')).toHaveText('Trang trí hồ sơ đã đồng bộ.', { timeout: 30000 });
    await second.locator('#rankings-modal').getByRole('button', { name:'Đóng',exact:true }).click(); await expect(second.locator('#rankings-modal')).toHaveCount(0);
    await second.evaluate(async () => (await import('/js/leaderboardPanel.js')).openLeaderboards('memory-match'));
    await expect(row.locator('img')).toHaveCount(3); await expect(row.locator('img').first()).not.toHaveAttribute('src', initial);
    const after = await second.evaluate(async uid => { const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend(); const data = await (await import('/js/leaderboardStore.js')).readLeaderboard({ ...backend, board: { gameId:'memory-match',family:'adventure',kind:'progress',rulesVersion:3 }, uid, refresh:true }); return data.top.find(row => row.uid === uid); }, player);
    expect(after).toEqual(before); await second.screenshot({ path: 'docs/design/achievements/runtime/qa/f3-public-bxh.png' });
  } finally { await a.close(); await b.close(); }
});
