import { expect, test } from "@playwright/test";

test("v1 migration preserves wallet/session and zero-star wins, then closes a chapter by filling its last hole", async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("memoryMatchChapterBackend")) return;
    const bestByLevel = {};
    for (let level = 1; level <= 100; level++) if (level !== 15) bestByLevel[`easy:${level}`] = { score: 100, stars: 0 };
    localStorage.setItem("memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 41, updatedAt: 1, data: {
      coins: 742, appearance: {}, settings: {}, progress: {
        memoryMatch: { bestByLevel, totalScore: 9900, totalStars: 0, items: { hint: 9, time30: 2 }, sessionsByMode: {
          easy: { mode: "easy", level: 3, remainingTime: 37, timeLimit: 80, levelStartTime: 80 },
        } },
      },
    } }));
  });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const imported = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { getPersistenceStatus } = await import("/js/persistence.js");
    return { coins: gameState.coins, progress: gameState.progress.memoryMatch, status: getPersistenceStatus(), recovery: JSON.parse(localStorage.getItem("memoryMatchSave")) };
  });
  expect(imported.coins).toBe(742);
  expect(imported.progress.items).toMatchObject({ hint: 9, time30: 2 });
  expect(imported.progress.sessionsByMode.easy).toMatchObject({ level: 3, remainingTime: 37 });
  expect(imported.progress.adventure).toMatchObject({ currentChapter: 1, completedCount: 99, unlockedThrough: 100 });
  expect(imported.status).toMatchObject({ backend: "indexedDB", formatVersion: 2 });
  expect(imported.recovery).toMatchObject({ formatVersion: 1, revision: 41, data: { coins: 742 } });
  await page.evaluate(async () => {
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("memory-match");
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.mode = "easy";
    gameState.settings.sound = gameState.settings.music = false;
    await (await import("/js/gameController.js")).startNewMemoryRun(15);
  });
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.matchedPairs = gameState.totalPairs;
    gameState.score = 1000;
    await (await import("/js/logic.js")).checkLevelComplete();
  });
  const completed = await page.evaluate(async () => {
    const persistence = await import("/js/persistence.js");
    return { profile: (await persistence.loadPersistentGameData()).progress.memoryMatch, chapter: await persistence.loadPersistentChapter("memoryMatch", 1) };
  });
  expect(completed.profile.adventure).toMatchObject({ currentChapter: 2, firstLevel: 101, unlockedThrough: 103 });
  expect(Object.keys(completed.chapter.bestByLevel)).toHaveLength(100);
  expect(completed.chapter.bestByLevel["easy:15"].cleared).toBe(true);
  expect(completed.profile.totalScore).toBeGreaterThanOrEqual(9900);
  expect(completed.profile.sessionsByMode.easy).toBeUndefined();
  await page.evaluate(async () => {
    await (await import("/js/gameController.js")).startNewMemoryRun(15);
    const { gameState } = await import("/js/gameState.js");
    gameState.matchedPairs = gameState.totalPairs;
    gameState.score = 0;
    await (await import("/js/logic.js")).checkLevelComplete();
  });
  const replay = await page.evaluate(async () => (await (await import("/js/persistence.js")).loadPersistentGameData()).progress.memoryMatch);
  expect(replay.totalScore).toBe(completed.profile.totalScore);
  expect(replay.totalStars).toBe(completed.profile.totalStars);
  expect(replay.adventure.currentChapter).toBe(2);
});

test("buying time commits once and a stale purchase cannot start a replacement round", async ({ page }) => {
  await page.route("**/js/persistence.js", async route => {
    const response = await route.fetch();
    const body = await response.text();
    const boundary = "return enqueue(async () => {";
    expect(body).toContain(boundary);
    await route.fulfill({ response, body: body.replace(boundary, `${boundary}
      if (globalThis.__holdSaveOnce) {
        globalThis.__holdSaveOnce = false;
        await new Promise(resolve => { globalThis.__releaseSave = resolve; });
      }`) });
  });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await page.clock.install();
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.coins = 1000;
    gameState.settings.sound = gameState.settings.music = false;
    await (await import("/js/persistence.js")).saveCoins(1000);
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("memory-match");
    await (await import("/js/gameController.js")).startNewMemoryRun();
  });
  await page.clock.runFor(8000);
  await page.evaluate(async () => { (await import("/js/gameState.js")).gameState.remainingTime = 1; });
  await page.clock.runFor(1100);
  await expect(page.locator("#time-up-modal")).toBeVisible();
  const fixture = await page.evaluate(async () => {
    globalThis.__holdSaveOnce = true;
    const { TIME_UP_PURCHASES } = await import("/js/shopCatalog.js");
    return { ...TIME_UP_PURCHASES[0], roundId: (await import("/js/gameState.js")).gameState.roundId };
  });
  const purchase = page.locator("#time-up-modal").getByRole("button", { name: `+${fixture.seconds} giây · ${fixture.price} Xu`, exact: true });
  await purchase.click();
  await expect.poll(() => page.evaluate(() => typeof globalThis.__releaseSave)).toBe("function");
  await purchase.dispatchEvent("click");
  await page.evaluate(async () => {
    globalThis.__replacement = (await import("/js/gameController.js")).restartMemoryLevel();
    globalThis.__releaseSave();
    await globalThis.__replacement;
  });
  const after = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return { coins: gameState.coins, roundId: gameState.roundId, remainingTime: gameState.remainingTime };
  });
  expect(after.coins).toBe(1000 - fixture.price);
  expect(after.roundId).toBe(fixture.roundId + 2);
  await page.clock.runFor(1000);
  expect(await page.evaluate(async () => (await import("/js/gameState.js")).gameState.remainingTime)).toBe(after.remainingTime);
});

test("rapid Triple commands preserve every successful logical transition across async rewards", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await page.evaluate(async () => {
    globalThis.__tripleRun = await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ mode: "easy", seed: "async-command-contract", skipIntro: true });
    const commands = globalThis.__tripleRun.generated.witness.slice(0, 6);
    for (const command of commands) {
      const tile = document.querySelector(`[data-tile-id="${command.tileId}"]`);
      if (!tile) throw new Error("Witness tile missing.");
      tile.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  await expect.poll(() => page.evaluate(() => globalThis.__tripleRun.getState().moves)).toBe(6);
  expect(await page.evaluate(() => globalThis.__tripleRun.getState().matchedTriples)).toBe(2);
  expect(errors).toEqual([]);
});

test("Memory restart after a cleared Challenge board retains that board's carried starting time", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const before = await page.evaluate(async () => {
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("memory-match");
    const { gameState } = await import("/js/gameState.js");
    const controller = await import("/js/gameController.js");
    gameState.settings.mode = "challenge";
    gameState.settings.sound = gameState.settings.music = false;
    gameState.remainingTime = 27;
    await controller.initializeLevel(2, { reason: "advance" });
    const timing = { timeLimit: gameState.timeLimit, levelStartTime: gameState.levelStartTime };
    gameState.matchedPairs = gameState.totalPairs;
    await (await import("/js/logic.js")).checkLevelComplete();
    return timing;
  });
  await page.evaluate(async () => { await (await import("/js/gameController.js")).restartMemoryLevel(); });
  const after = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return { timeLimit: gameState.timeLimit, levelStartTime: gameState.levelStartTime };
  });
  expect(after).toEqual(before);
});
