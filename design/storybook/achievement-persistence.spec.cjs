const { test, expect } = require('@playwright/test');
test('F1 durable grants survive reload, replay and backup without changing wallet or equip', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('.game-selector__choice').first()).toBeVisible({ timeout: 20000 });
  const before = await page.evaluate(async () => {
    const { gameState: state } = await import('/js/gameState.js'); const p = await import('/js/persistence.js');
    const progress = structuredClone(state.progress);
    for (const key of ['memoryMatch', 'linkConnect', 'tripleConnect']) for (const mode of ['easy', 'normal', 'hard', 'superHard'])
      progress[key].bestByLevel[`${mode}:1`] = { score: 0, stars: 0, cleared: true, rulesVersion: 1, completedWaves: 2 };
    if (!await p.savePersistentGameData({ progress })) throw Error('Save failed');
    const durable = await p.exportPersistentSnapshot();
    return { appearance: state.appearance, durable: durable.profile.data.appearance, coins: durable.profile.data.coins };
  });
  expect(Object.keys(before.appearance.achievements.grants)).toHaveLength(3);
  expect(before.appearance.profileCosmetics).toEqual({ avatar: null, frame: null, badge: null });
  expect(before.appearance.achievements).toEqual(before.durable.achievements);
  await page.reload(); await expect(page.locator('#app-loading')).toHaveCount(0, { timeout: 20000 });
  const after = await page.evaluate(async () => {
    const { gameState: state } = await import('/js/gameState.js'); const p = await import('/js/persistence.js');
    if (!await p.savePersistentGameData({ progress: state.progress })) throw Error('Replay save failed');
    return { appearance: state.appearance, coins: (await p.exportPersistentSnapshot()).profile.data.coins };
  });
  expect(after.appearance.achievements).toEqual(before.appearance.achievements); expect(after.coins).toBe(before.coins);
});
