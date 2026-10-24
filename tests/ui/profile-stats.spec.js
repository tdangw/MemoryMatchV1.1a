import { expect, test } from '@playwright/test';

test('current-season linked statistics reload without errors or repeated adoption', async ({ page }) => {
  const warnings = [];
  page.on('console', message => { if (message.text().includes('Private profile statistics unavailable')) warnings.push(message.text()); });
  await page.goto('/'); await expect(page.locator('#app-loading')).toHaveCount(0, { timeout:20000 });
  const initial = await page.evaluate(async () => {
    const p = await import('/js/persistence.js'), owner = await p.loadProfileOwner();
    const { getFirebaseEnvironment } = await import('/js/firebaseEnvironment.js');
    const { adoptProfileStats, normalizeProfileStats } = await import('/js/profileStatsModel.js');
    const environment = getFirebaseEnvironment(), sourceKey = `profileStats:profile:${owner.id}`, targetKey = `profileStats:${environment}:uid:linked-owner`;
    await p.updateSyncMetadata(sourceKey, value => ({ ...normalizeProfileStats(value), totalMs:60000 }));
    await p.updateSyncMetadataPair([sourceKey,targetKey], ([source,target])=>adoptProfileStats(source,target,'linked-owner',environment));
    return { sourceKey,targetKey,source:await p.loadSyncMetadata(sourceKey) };
  });
  for(let cycle=0;cycle<3;cycle++) {
    await page.reload(); await expect(page.locator('#app-loading')).toHaveCount(0, {timeout:20000});
    expect(await page.evaluate(async()=> (await import('/js/profileStatsService.js')).getProfileStatsService().getState().phase)).toBe('ready');
    await page.evaluate(async()=>{
      const p=await import('/js/persistence.js'), owner=await p.loadProfileOwner();
      const environment=(await import('/js/firebaseEnvironment.js')).getFirebaseEnvironment();
      await (await import('/js/profileStatsService.js')).getProfileStatsService().bindAccount({
        getIdentity:()=>({uid:'linked-owner',profileId:owner.id,firstUid:'linked-owner',environment,createdAt:owner.createdAt}),
        subscribe:listener=>{listener();return()=>{};},
      });
    });
    await expect.poll(()=>page.evaluate(async()=> (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBe(60000);
    expect(await page.evaluate(async key=>(await import('/js/persistence.js')).loadSyncMetadata(key),initial.sourceKey)).toEqual(initial.source);
    expect(await page.evaluate(async key=>(await (await import('/js/persistence.js')).loadSyncMetadata(key)).totalMs,initial.targetKey)).toBe(60000);
  }
  expect(warnings).toEqual([]);
});

test('three games share durable active time, excluding startup and nested pause, with no finish/reload duplicate', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-dock-action="profile"]')).toBeVisible();
  await page.clock.install({ time: new Date('2026-10-14T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-14T12:00:01Z'));
  for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) {
    await page.evaluate(async gameId => {
      const metrics = await import('/js/playMetrics.js');
      window.statsScope = (await import('/js/gameShell/gameShellLifecycle.js')).createGameShellLifecycle();
      window.statsRecord = metrics.beginPlayMetrics(window.statsScope, { gameId, mode: 'easy', level: 1 }, { version: 1, elapsedMs: 100000 });
    }, gameId);
    await page.clock.runFor(5000);
    await page.evaluate(() => window.statsRecord.clock.resume('startup'));
    await page.clock.runFor(31000);
    await page.evaluate(() => { window.statsRecord.clock.pause('menu'); window.statsRecord.clock.pause('hidden'); });
    await page.clock.runFor(9000);
    await page.evaluate(() => window.statsRecord.clock.resume('menu'));
    await page.clock.runFor(5000);
    await page.evaluate(() => window.statsRecord.clock.resume('hidden'));
    await page.clock.runFor(1000);
    await page.evaluate(async () => {
      const metrics = await import('/js/playMetrics.js'); metrics.finishPlayMetrics(); metrics.finishPlayMetrics(); window.statsScope.dispose();
      await (await import('/js/profileStatsService.js')).getProfileStatsService().flushLocal();
    });
  }
  const total = () => page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs);
  await expect.poll(total).toBe(96000);
  await page.locator('[data-dock-action="profile"]').click();
  await expect(page.locator('.account-play-details')).toContainText('0 giờ 1 phút');
  await expect(page.locator('.account-play-details')).not.toContainText('Tính từ');
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().trackedSince)).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('[data-dock-action="profile"]')).toBeVisible();
  await expect.poll(total).toBe(96000);
});

test('a clock started as a local guest keeps its linked owner after the visible account switches', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-dock-action="profile"]')).toBeVisible();
  await page.clock.install({ time: new Date('2026-10-14T12:00:00Z') }); await page.clock.pauseAt(new Date('2026-10-14T12:00:01Z'));
  await page.evaluate(async () => {
    window.statsOwner = await (await import('/js/persistence.js')).loadProfileOwner();
    window.statsScope = (await import('/js/gameShell/gameShellLifecycle.js')).createGameShellLifecycle();
    window.statsRecord = (await import('/js/playMetrics.js')).beginPlayMetrics(window.statsScope, { gameId: 'memory-match', mode: 'easy', level: 1 });
    window.statsRecord.clock.resume('startup');
  });
  await page.clock.runFor(1000);
  await page.evaluate(async () => {
    window.statsRecord.clock.pause('menu');
    const service = (await import('/js/profileStatsService.js')).getProfileStatsService(); await service.flushLocal();
    window.statsIdentity = { uid: 'linked-a', profileId: window.statsOwner.id, firstUid: 'linked-a', environment: 'local', createdAt: Date.now() };
    await service.bindAccount({ getIdentity: () => window.statsIdentity, subscribe: callback => { window.statsAccountChanged = callback; callback(); return () => {}; } });
  });
  await expect.poll(() => page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBe(1000);
  await page.evaluate(() => { window.statsIdentity = { ...window.statsIdentity, uid: 'other-b' }; window.statsAccountChanged(); });
  await expect.poll(() => page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBe(0);
  await page.evaluate(() => window.statsRecord.clock.resume('menu')); await page.clock.runFor(2000);
  await page.evaluate(async () => { (await import('/js/playMetrics.js')).finishPlayMetrics(); window.statsScope.dispose(); await (await import('/js/profileStatsService.js')).getProfileStatsService().flushLocal(); });
  expect(await page.evaluate(async () => (await (await import('/js/persistence.js')).loadSyncMetadata('profileStats:local:uid:linked-a')).totalMs)).toBe(3000);
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBe(0);
  await page.evaluate(() => { window.statsIdentity = { ...window.statsIdentity, uid: 'linked-a' }; window.statsAccountChanged(); });
  await expect.poll(() => page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBe(3000);
});

test('failed metadata write does not acknowledge play time; retry persists the captured segment once', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-dock-action="profile"]')).toBeVisible();
  await page.clock.install({ time: new Date('2026-10-14T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-14T12:00:01Z'));
  await page.evaluate(async () => {
    const metrics = await import('/js/playMetrics.js');
    window.statsScope = (await import('/js/gameShell/gameShellLifecycle.js')).createGameShellLifecycle();
    window.statsRecord = metrics.beginPlayMetrics(window.statsScope, { gameId: 'memory-match', mode: 'easy', level: 1 });
    window.originalStatsPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value, key) { if (this.name === 'metadata' && String(key).includes('profileStats:') && value.totalMs > 0) throw new DOMException('Fixture quota', 'QuotaExceededError'); return window.originalStatsPut.call(this, value, key); };
    window.statsRecord.clock.resume('startup');
  });
  await page.clock.runFor(1000);
  await page.evaluate(async () => { window.statsRecord.clock.finish(); await (await import('/js/profileStatsService.js')).getProfileStatsService().flushLocal(); });
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBe(0);
  await page.evaluate(async () => { IDBObjectStore.prototype.put = window.originalStatsPut; await (await import('/js/profileStatsService.js')).getProfileStatsService().flushLocal(); window.statsScope.dispose(); });
  await expect.poll(() => page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBe(1000);
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().phase)).toBe('ready');
});
test('damaged private statistics are preserved and do not prevent opening the game', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-dock-action="profile"]')).toBeVisible();
  await page.evaluate(async () => {
    const persistence = await import('/js/persistence.js'); const owner = await persistence.loadProfileOwner();
    await persistence.updateSyncMetadata(`profileStats:profile:${owner.id}`, () => ({ version: 99, totalMs: -1 }));
  });
  await page.reload(); await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().phase)).toBe('error');
  expect(await page.evaluate(async () => { const p = await import('/js/persistence.js'); const owner = await p.loadProfileOwner(); return p.loadSyncMetadata(`profileStats:profile:${owner.id}`); })).toEqual({ version: 99, totalMs: -1 });
});
test('a failure loading the newly bound account is visible and can be retried', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('[data-dock-action="profile"]')).toBeVisible();
  await page.evaluate(async () => {
    const p = await import('/js/persistence.js'); const owner = await p.loadProfileOwner();
    await p.updateSyncMetadata('profileStats:local:uid:damaged', () => ({ version: 99 }));
    const identity = { uid: 'damaged', profileId: owner.id, firstUid: 'different-first', environment: 'local', createdAt: Date.now() };
    await (await import('/js/profileStatsService.js')).getProfileStatsService().bindAccount({ getIdentity: () => identity, subscribe: callback => { callback(); return () => {}; } });
  });
  await expect.poll(() => page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().phase)).toBe('error');
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().totalPlayMs)).toBeNull();
  await page.evaluate(async () => { const p = await import('/js/persistence.js'); await p.updateSyncMetadata('profileStats:local:uid:damaged', () => ({})); });
  // Restore the fixture through its validated model, then exercise the user retry path.
  await page.evaluate(async () => { const p = await import('/js/persistence.js'); const model = await import('/js/profileStatsModel.js'); await p.updateSyncMetadata('profileStats:local:uid:damaged', () => model.normalizeProfileStats(null)); await (await import('/js/profileStatsService.js')).getProfileStatsService().syncNow(); });
  expect(await page.evaluate(async () => (await import('/js/profileStatsService.js')).getProfileStatsService().getState().phase)).toBe('ready');
});
