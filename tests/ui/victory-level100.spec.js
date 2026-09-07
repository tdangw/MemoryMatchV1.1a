import { expect, test } from "@playwright/test";

test("Memory Match level 100 opens the flower celebration on mobile web", async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();

  const result = await page.evaluate(async () => {
    const logicResource = performance.getEntriesByType("resource")
      .map(({ name }) => new URL(name))
      .find(({ pathname }) => pathname.endsWith("/js/logic.js"));
    const revision = logicResource?.search || "";
    const [{ gameState }, { checkLevelComplete }] = await Promise.all([
      import(`/js/gameState.js${revision}`),
      import(`/js/logic.js${revision}`),
    ]);
    Object.assign(gameState, {
      currentLevel: 100,
      matchedPairs: 1,
      totalPairs: 1,
      remainingTime: 30,
      timeLimit: 60,
      score: 0,
      moves: 1,
      misses: 0,
      isLocked: false,
      isPaused: false,
      luckyAwards: [],
      settings: { ...gameState.settings, mode: "challenge", sound: false },
    });
    checkLevelComplete();
    return {
      currentLevel: gameState.currentLevel,
      matchedPairs: gameState.matchedPairs,
      totalPairs: gameState.totalPairs,
      isPaused: gameState.isPaused,
      summaryExists: Boolean(document.getElementById("level-summary-modal")),
    };
  });
  expect(result).toMatchObject({
    currentLevel: 100,
    matchedPairs: 1,
    totalPairs: 1,
    isPaused: true,
  });

  const celebrate = page.getByRole("button", { name: "Congratulations!" });
  await expect(celebrate).toBeVisible();
  await celebrate.click();
  await expect(page.locator("#victory-celebration")).toBeVisible();
  await expect(page.locator(".victory-flower-overlay__source")).toHaveClass(/is-playing/);
  await expect(page.locator("#victory-celebration .flower").first()).toBeVisible();
});

test("Link Connect level 100 opens the flower celebration on mobile web", async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await page.locator(".game-selector__choice").filter({ hasText: "Link Connect" }).click();
  await page.locator(".menu-item").filter({ hasText: "Bắt đầu" }).click();
  await page.locator("#difficulty-modal .difficulty-option").filter({ hasText: "Thử thách" }).click();
  await expect(page.locator(".level-reward-overlay")).toBeHidden({ timeout: 5000 });

  const connection = await page.evaluate(async () => {
    const controllerResource = performance.getEntriesByType("resource")
      .map(({ name }) => new URL(name))
      .find(({ pathname }) => pathname.endsWith("/js/linkConnect/linkController.js"));
    const revision = controllerResource?.search || "";
    const [{ linkGameState }, { findAvailableConnections }] = await Promise.all([
      import(`/js/linkConnect/linkState.js${revision}`),
      import(`/js/linkConnect/pathfinder.js${revision}`),
    ]);
    Object.assign(linkGameState, {
      level: 100,
      matchedPairs: 0,
      totalPairs: 1,
      isCompleted: false,
      isLocked: false,
    });
    return findAvailableConnections(linkGameState.board.grid)[0];
  });

  expect(connection).toBeTruthy();
  for (const position of [connection.start, connection.end]) {
    await page.locator(
      `.link-board__cell[data-row="${position.row}"][data-column="${position.column}"] .link-tile`,
    ).evaluate((tile) => tile.click());
  }

  const celebrate = page.getByRole("button", { name: "Congratulations!" });
  await expect(celebrate).toBeVisible({ timeout: 7000 });
  await celebrate.click();
  await expect(page.locator("#victory-celebration")).toBeVisible();
  await expect(page.locator(".victory-flower-overlay__source")).toHaveClass(/is-playing/);
  await expect(page.locator("#victory-celebration .flower").first()).toBeVisible();
});
