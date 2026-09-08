import { expect, test } from "@playwright/test";

test("Link match and every canvas exit preset execute without missing definitions", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const count = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    const { gameState } = await import("/js/gameState.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { playLinkMatchExit, clearLinkTransientEffects } = await import("/js/linkConnect/linkRenderer.js");
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    const positions = [connection.start, connection.end];
    const tiles = positions.map(position => document.querySelector(`.link-tile[data-row="${position.row}"][data-column="${position.column}"]`));
    await Promise.all(tiles.map(tile => tile.querySelector("img").decode()));
    for (const exit of ["finedust", "split2", "split4", "split8", "triangles", "crumble", "pixel"]) {
      gameState.appearance.linkExitEffect = exit;
      playLinkMatchExit(...positions);
      if (!document.querySelector(".link-card-exit-effect")) throw Error(`No canvas for ${exit}`);
      clearLinkTransientEffects();
      (await import("/js/gameShell/gameShellEffects.js")).getEffectRegistry().clear();
      tiles.forEach(tile => { tile.classList.remove("is-removing", "has-canvas-exit"); });
    }
    linkGameState.isLocked = false;
    const before = linkGameState.matchedPairs;
    tiles.forEach(tile => tile.click());
    return before;
  });
  await expect.poll(() => page.evaluate(async () => (await import("/js/linkConnect/linkState.js")).linkGameState.matchedPairs)).toBe(count + 1);
  expect(errors).toEqual([]);
});

test("Memory owns one stable shell through all modes and Challenge resume", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await expect(page.locator("#settings-container")).toHaveCount(1);
  await expect(page.locator("#bg-music")).toHaveCount(1);
  const result = await page.evaluate(async () => {
    const { openGameMenu } = await import("/js/gameSelector.js");
    const { GAME_MODES } = await import("/js/gameCatalog.js");
    const { gameState, resetGame } = await import("/js/gameState.js");
    const controller = await import("/js/gameController.js");
    const { getMemoryShell } = await import("/js/memoryMatch/memoryShell.js");
    openGameMenu("memory-match");
    const refs = getMemoryShell().refs;
    const results = [];
    for (const { id } of GAME_MODES) {
      resetGame();
      gameState.settings.mode = id;
      controller.startNewMemoryRun();
      const count = refs.board.querySelectorAll(".tile").length;
      controller.restartMemoryLevel();
      results.push({ mode: id, count, stable: refs === getMemoryShell().refs, roots: document.querySelectorAll("#game-container").length });
    }
    controller.continueMemorySession({ mode: "challenge", level: 3, remainingTime: 42 });
    controller.returnToMainMenu();
    return results;
  });
  expect(result).toHaveLength(6);
  for (const mode of result) expect(mode).toMatchObject({ stable: true, roots: 1 });
  expect(result.every(mode => mode.count > 0)).toBe(true);
  await page.reload();
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const session = await page.evaluate(async () => (await import("/js/gameState.js")).gameState.progress.memoryMatch.sessionsByMode.challenge);
  expect(session.level).toBe(3);
  expect(session.remainingTime).toBe(42);
});
