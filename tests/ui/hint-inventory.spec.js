import { expect, test } from "@playwright/test";

test("hint inventories survive new games, mode changes, restarts and old resumes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { gameState, resetGame } = await import("/js/gameState.js");
    const memory = await import("/js/gameController.js");
    const link = await import("/js/linkConnect/linkController.js");
    const { consumeLinkItem } = await import("/js/linkConnect/linkItems.js");
    const { openGameMenu } = await import("/js/gameSelector.js");
    gameState.hints = 20;
    gameState.progress.linkConnect.items.hint = 14;
    openGameMenu("memory-match");
    const counts = [];
    for (const mode of ["easy", "hard"]) {
      resetGame();
      gameState.settings.mode = mode;
      memory.startNewMemoryRun();
      counts.push(gameState.hints);
      memory.restartMemoryLevel();
      counts.push(gameState.hints);
    }
    memory.continueMemorySession({ mode: "easy", level: 1, remainingTime: 60, hints: 99 });
    counts.push(gameState.hints);
    gameState.isLocked = false;
    gameState.isPaused = false;
    memory.handleHintClick();
    counts.push(gameState.hints);
    memory.returnToMainMenu();
    openGameMenu("link-connect");
    const linkCounts = [];
    for (const mode of ["easy", "hard"]) {
      link.startLinkLevel({ mode });
      linkCounts.push(gameState.progress.linkConnect.items.hint);
      link.startLinkLevel({ mode, restart: true });
      linkCounts.push(gameState.progress.linkConnect.items.hint);
    }
    link.continueLinkSession({ mode: "easy", level: 1, remainingTime: 60 });
    linkCounts.push(gameState.progress.linkConnect.items.hint);
    consumeLinkItem("hint");
    linkCounts.push(gameState.progress.linkConnect.items.hint);
    return { counts, linkCounts };
  });
  expect(result.counts).toEqual([20, 20, 20, 20, 20, 19]);
  expect(result.linkCounts).toEqual([14, 14, 14, 14, 14, 13]);
  await page.reload();
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const saved = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return [gameState.hints, gameState.progress.linkConnect.items.hint];
  });
  expect(saved).toEqual([19, 13]);
});
