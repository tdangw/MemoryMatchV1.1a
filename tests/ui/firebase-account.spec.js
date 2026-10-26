import { GAMEPLAY_SEASON } from '../../js/progression/gameplaySeason.js';
import { expect, test } from "@playwright/test";

test.skip(process.env.VITE_FIREBASE_USE_EMULATORS !== "1", "Runs only against the isolated Firebase emulators.");
async function seed(context, coins) {
  await context.addInitScript(({coins,season}) => {
    localStorage.setItem("memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 1, data: { coins, progress: {gameplaySeason:season}, settings: {}, appearance: {} } }));
  }, {coins,season:GAMEPLAY_SEASON});
}
async function ready(page) {
  await expect.poll(async () => page.evaluate(async () => (await import('/js/accountService.js')).getAccountService()?.getState().phase), { timeout: 30000 }).toBe('synced');
}
async function state(page) { return page.evaluate(async () => (await import("/js/accountService.js")).getAccountService().getState()); }
async function link(page, email) {
  // The emulator accepts fake Google credentials. The real popup still depends on Google's hosted iframe library.
  await page.evaluate(async email => {
    const sdkUrl = performance.getEntriesByType("resource").find(entry => entry.name.includes("/deps/firebase_auth.js"))?.name;
    if (!sdkUrl) throw new Error("Auth SDK was not loaded by the app.");
    const auth = await import(sdkUrl);
    const backend = await (await import("/js/firebaseBackend.js")).getFirebaseBackend();
    const credential = auth.GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true }));
    try { await auth.linkWithCredential(backend.auth.currentUser, credential); }
    catch (error) {
      if (error.code !== "auth/credential-already-in-use" && error.code !== "auth/email-already-in-use") throw error;
      await (await import("/js/accountService.js")).getAccountService().acceptGoogleCredential(credential);
    }
  }, email);
}

test("guest backup survives offline/reload and only publishes the durable new snapshot after reconnect", async ({ browser, baseURL }) => {
  test.setTimeout(60000);
  const context = await browser.newContext({ baseURL, serviceWorkers: "block" });
  await seed(context, 510);
  const page = await context.newPage();
  await page.goto("/");
  await ready(page);
  const identity = await state(page);
  expect(identity.isAnonymous).toBe(true);
  await context.setOffline(true);
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.coins = 777;
    await (await import("/js/persistence.js")).savePersistentGameData({ coins: 777 });
    await (await import("/js/accountService.js")).getAccountService().syncNow({ manual: true });
  });
  expect((await state(page)).phase).toBe("offline");
  await context.setOffline(false);
  await page.evaluate(async () => (await import("/js/accountService.js")).getAccountService().syncNow({ manual: true }));
  await ready(page);
  const saved = await page.evaluate(async () => {
    const backend = await (await import("/js/firebaseBackend.js")).getFirebaseBackend();
    const store = await import("/js/cloudStore.js");
    const root = await store.readCloudRoot(backend.database, backend.environment, backend.auth.currentUser.uid);
    if (!root) throw new Error(`Missing cloud root in ${backend.environment}; service=${JSON.stringify((await import('/js/accountService.js')).getAccountService().getState())}`);
    return (await store.readCloudSnapshot(backend.database, backend.environment, backend.auth.currentUser.uid, root)).profile.data.coins;
  });
  expect(saved).toBe(777);
  await page.reload(); await ready(page);
  expect((await state(page)).uid).toBe(identity.uid);
  expect(await page.evaluate(async () => (await import("/js/gameState.js")).gameState.coins)).toBe(777);
  await context.close();
});

test("Google links the guest UID; another guest restores the existing Google cloud keeps a local recovery copy without adding coins", async ({ browser, baseURL }) => {
  test.setTimeout(90000);
  const first = await browser.newContext({ baseURL, serviceWorkers: "block" }); const second = await browser.newContext({ baseURL, serviceWorkers: "block" });
  await seed(first, 1234); await seed(second, 4321);
  const a = await first.newPage(); const b = await second.newPage();
  await a.goto("/"); await ready(a);
  const guest = await state(a);
  await link(a, "adventure-cloud@example.test");
  await expect.poll(async () => (await state(a)).isAnonymous).toBe(false);
  expect((await state(a)).uid).toBe(guest.uid);
  await b.goto("/"); await ready(b);
  const otherGuest = await state(b);
  expect(otherGuest.uid).not.toBe(guest.uid);
  await link(b, "adventure-cloud@example.test");
  await ready(b);
  await expect(b.locator("#cloud-conflict-modal")).toHaveCount(0);
  expect((await state(b)).uid).toBe(guest.uid);
  expect(await b.evaluate(async () => (await import("/js/gameState.js")).gameState.coins)).toBe(1234);
  expect(await b.evaluate(async () => (await (await import("/js/persistence.js")).getLocalRestoreBackups()).at(-1).profile.data.coins)).toBe(4321);
  const restore=await b.evaluate(async()=>{try{await(await import('/js/accountService.js')).getAccountService().restoreLocalBackup();return 'unexpected';}catch(error){return error.code;}});
  expect(restore).toBe('rewards/stale-backup');
  expect(await b.evaluate(async () => (await import('/js/gameState.js')).gameState.coins)).toBe(1234);
  expect((await state(b)).uid).toBe(guest.uid);
  await first.close(); await second.close();
});

test("a remote Google save waits until gameplay closes and later completed events become the newest save", async ({ browser, baseURL }) => {
  test.setTimeout(90000);
  const first = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  const second = await browser.newContext({ baseURL, serviceWorkers: 'block' });
  await seed(first, 120); await seed(second, 850);
  const a = await first.newPage(); const b = await second.newPage();
  await a.goto('/'); await ready(a); await link(a, 'adventure-local@example.test');
  await b.goto('/'); await ready(b);
  await b.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect');
    await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ skipIntro: true });
  });
  await link(b, 'adventure-local@example.test');
  await expect.poll(async () => (await state(b)).conflict).toBe(true);
  await expect(b.locator('#cloud-conflict-modal')).toHaveCount(0);
  await b.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
  await ready(b);
  expect(await b.evaluate(async () => (await import('/js/gameState.js')).gameState.coins)).toBe(120);
  await b.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js');
    gameState.coins = 850;
    await (await import('/js/persistence.js')).saveCoins(850);
  });
  await ready(b);
  await expect.poll(() => a.evaluate(async () => (await import('/js/gameState.js')).gameState.coins), { timeout: 30000 }).toBe(850);
  const saved = await b.evaluate(async () => {
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const store = await import('/js/cloudStore.js');
    const root = await store.readCloudRoot(backend.database, backend.environment, backend.auth.currentUser.uid);
    return (await store.readCloudSnapshot(backend.database, backend.environment, backend.auth.currentUser.uid, root)).profile.data.coins;
  });
  expect(saved).toBe(850);
  await second.setOffline(true);
  await b.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js');
    gameState.coins = 999;
    await (await import('/js/persistence.js')).saveCoins(999);
  });
  await a.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js');
    gameState.coins = 777;
    await (await import('/js/persistence.js')).saveCoins(777);
  });
  await ready(a);
  await second.setOffline(false);
  await b.reload(); await ready(b);
  expect(await b.evaluate(async () => (await import('/js/gameState.js')).gameState.coins)).toBe(777);
  expect(await b.evaluate(async () => (await(await import('/js/persistence.js')).getLocalRestoreBackups()).some(snapshot=>snapshot.profile.data.coins===999))).toBe(true);
  await expect.poll(() => a.evaluate(async () => (await import('/js/gameState.js')).gameState.coins), { timeout: 30000 }).toBe(777);
  await first.close(); await second.close();
});

test("session checkpoints survive reload without cloud writes, while an explicit completion is backed up", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/'); await ready(page);
  const revision = async () => page.evaluate(async () => {
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    return (await (await import('/js/cloudStore.js')).readCloudRoot(backend.database, backend.environment, backend.auth.currentUser.uid)).revision;
  });
  const before = await revision();
  await page.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js');
    gameState.progress.memoryMatch.sessionsByMode.easy = { mode: 'easy', level: 1, remainingTime: 50, timeLimit: 60 };
    await (await import('/js/persistence.js')).saveProgress(gameState.progress);
    await (await import('/js/persistence.js')).saveSetting('musicVolume', .3);
  });
  const signatures = await page.evaluate(async () => {
    const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
    const store = await import('/js/cloudStore.js');
    const root = await store.readCloudRoot(backend.database, backend.environment, backend.auth.currentUser.uid);
    const remote = await store.readCloudSnapshot(backend.database, backend.environment, backend.auth.currentUser.uid, root);
    const local = await (await import('/js/persistence.js')).exportPersistentSnapshot();
    const { cloudSaveEventSignature } = await import('/js/cloudSaveEvents.js');
    return { local: cloudSaveEventSignature(local.profile.data), remote: cloudSaveEventSignature(remote.profile.data) };
  });
  expect(signatures.local).toBe(signatures.remote);
  await page.reload(); await ready(page);
  expect(await revision()).toBe(before);
  expect(await page.evaluate(async () => (await import('/js/gameState.js')).gameState.progress.memoryMatch.sessionsByMode.easy.remainingTime)).toBe(50);
  await page.evaluate(async () => {
    const { gameState } = await import('/js/gameState.js');
    delete gameState.progress.memoryMatch.sessionsByMode.easy;
    await (await import('/js/persistence.js')).savePersistentGameData({ progress: gameState.progress, cloudEvent: true });
  });
  await ready(page);
  expect(await revision()).toBeGreaterThan(before);
});
