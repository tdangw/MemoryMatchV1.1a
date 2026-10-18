import { expect, test } from "@playwright/test";

const games = [
  { id: "memory-match", key: "memoryMatch" },
  { id: "link-connect", key: "linkConnect" },
  { id: "triple-connect", key: "tripleConnect" },
];
for (const game of games) {
  test(`${game.id} opens its chapter celebration only after all 100 wins and continues at 101`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(key => {
      const bestByLevel = Object.fromEntries(Array.from({ length: 99 }, (_, index) => [`easy:${index + 1}`, { score: 0, stars: 0 }]));
      localStorage.setItem("memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 0, progress: { [key]: { bestByLevel } }, settings: {}, appearance: {} } }));
    }, game.key);
    await page.goto("/");
    await page.evaluate(async id => {
      await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id);
      const { gameState } = await import("/js/gameState.js");
      gameState.settings.mode = "easy"; gameState.settings.sound = false; gameState.settings.music = false;
      if (id === "memory-match") {
        await (await import("/js/gameController.js")).startNewMemoryRun(100);
        gameState.matchedPairs = gameState.totalPairs; gameState.remainingTime = 30;
        await (await import("/js/logic.js")).checkLevelComplete();
      } else if (id === "link-connect") {
        await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy", level: 100, skipIntro: true });
      } else {
        window.__victoryTriple = await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ mode: "easy", level: 100, skipIntro: true });
      }
    }, game.id);
    if (game.id === "link-connect") {
      // Complete the actual board: shortening totalPairs invalidates its saved snapshot.
      const total = await page.evaluate(async () => (await import('/js/linkConnect/linkState.js')).linkGameState.totalPairs);
      for (let pair = 0; pair < total; pair++) {
        await expect.poll(() => page.evaluate(async () => {
          const state = (await import('/js/linkConnect/linkState.js')).linkGameState;
          return state.isCompleted || !state.isLocked;
        })).toBe(true);
        const next = await page.evaluate(async () => {
          const state = (await import('/js/linkConnect/linkState.js')).linkGameState;
          const connection = (await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(state.board.grid)[0];
          return { completed: state.isCompleted, matched: state.matchedPairs, connection };
        });
        if (next.completed) break;
        expect(next.connection).toBeTruthy();
        for (const position of [next.connection.start, next.connection.end]) {
          await page.locator(`.link-board__cell[data-row="${position.row}"][data-column="${position.column}"] .link-tile`).click();
        }
        await expect.poll(() => page.evaluate(async () => (await import('/js/linkConnect/linkState.js')).linkGameState.matchedPairs)).toBeGreaterThan(next.matched);
      }
      await expect.poll(() => page.evaluate(async () => (await import('/js/linkConnect/linkState.js')).linkGameState.isCompleted)).toBe(true);
    }
    if (game.id === "triple-connect") {
      const witness = await page.evaluate(() => window.__victoryTriple.generated.witness);
      for (const command of witness) {
        await page.locator(`[data-tile-id="${command.tileId}"]`).click();
        await page.waitForFunction(() => !document.querySelector(".triple-connect__tray-flight, .triple-connect__ghost"));
      }
    }
    await page.getByRole("button", { name: "Congratulations!", exact: true }).click();
    const scene = page.locator("#victory-celebration");
    await expect(scene).toBeVisible();
    await expect(scene).toContainText("đủ 100 màn");
    await expect(scene.locator(".victory-flower-bloom")).toHaveCount(3);
    expect(await scene.locator("svg *").count()).toBeLessThanOrEqual(100);
    expect(await scene.evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
    await scene.getByRole("button", { name: "Tiếp tục", exact: true }).click();
    await expect(scene).toHaveCount(0);
    await expect.poll(() => page.evaluate(async ({ key, id }) => {
      const { gameState } = await import("/js/gameState.js");
      if (gameState.progress[key].adventure.currentChapter !== 2) return false;
      if (id === "memory-match") return gameState.currentLevel === 101;
      if (id === "link-connect") return (await import("/js/linkConnect/linkState.js")).linkGameState.level === 101;
      return document.querySelector("[data-triple-level]")?.textContent === "101";
    }, { key: game.key, id: game.id })).toBe(true);
  });
}

test("scene replacement and rapid touches keep particles and animations bounded, then cleanup fully", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(async () => {
    const { showVictoryCelebration } = await import("/js/victoryCelebration.js");
    for (let index = 0; index < 5; index += 1) showVictoryCelebration({ level: 100, completedChapter: 1, settings: { sound: false, music: false } });
    const scene = document.querySelector(".victory-flower-scene");
    for (let index = 0; index < 30; index += 1) scene.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 200, clientY: 450 }));
  });
  await expect(page.locator("#victory-celebration")).toHaveCount(1);
  expect(await page.locator(".adventure-touch-particle").count()).toBeLessThanOrEqual(24);
  await page.waitForFunction(() => document.querySelectorAll(".adventure-touch-particle").length === 0);
  await page.waitForFunction(() => document.querySelector("#victory-celebration").getAnimations({ subtree: true }).every(animation => animation.playState === "finished"), null, { timeout: 7000 });
  await page.screenshot({ path: "test-results/victory-scene.png" });
  await page.setViewportSize({ width: 844, height: 390 });
  const actions = await page.locator(".victory-flower-actions").boundingBox();
  expect(actions.x).toBeGreaterThanOrEqual(0);
  expect(actions.x + actions.width).toBeLessThanOrEqual(844);
  expect(actions.y + actions.height).toBeLessThanOrEqual(390);
  await page.evaluate(async () => (await import("/js/gameSelector.js")).showGameSelector());
  await expect(page.locator("#victory-celebration")).toHaveCount(0);
  await expect(page.locator(".adventure-touch-layer")).toHaveCount(1);
});

test("winning level 100 with earlier gaps keeps the chapter open and does not start the celebration", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 0, progress: { memoryMatch: { bestByLevel: { "easy:99": { score: 0, stars: 0 } } } }, settings: {}, appearance: {} } }));
  });
  await page.goto("/");
  await page.evaluate(async () => {
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("memory-match");
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.mode = "easy"; gameState.settings.sound = false; gameState.settings.music = false;
    await (await import("/js/gameController.js")).startNewMemoryRun(100);
    gameState.matchedPairs = gameState.totalPairs;
    await (await import("/js/logic.js")).checkLevelComplete();
  });
  await expect(page.locator("#level-summary-modal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Congratulations!", exact: true })).toHaveCount(0);
  await expect(page.locator("#victory-celebration")).toHaveCount(0);
  expect(await page.evaluate(async () => (await import("/js/gameState.js")).gameState.progress.memoryMatch.adventure.currentChapter)).toBe(1);
});
