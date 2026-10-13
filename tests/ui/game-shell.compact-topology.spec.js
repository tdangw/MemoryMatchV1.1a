import { expect, test } from "@playwright/test";

const games = [
  { id: "memory-match", root: "#game-container", board: "#grid-container", tile: ".tile", columns: "--grid-columns", rows: "--grid-rows" },
  { id: "link-connect", root: "#link-connect-container", board: "#link-board", tile: ".link-tile", columns: "--link-columns", rows: "--link-rows" },
];

async function startLargestBoard(page, id) {
  await page.evaluate(async gameId => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(gameId);
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.mode = "superHard";
    if (gameId === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun();
    else await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "superHard" });
  }, id);
}

for (const game of games) {
  test(`${game.id} repacks a 60-tile board between compact landscape and portrait`, async ({ page }) => {
    await page.setViewportSize({ width: 914, height: 411 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/");
    await startLargestBoard(page, game.id);
    const board = page.locator(game.board);
    await expect(board.locator(game.tile)).toHaveCount(60);
    await expect.poll(() => board.evaluate((element, columns) => (
      Number(getComputedStyle(element).getPropertyValue(columns))
    ), game.columns)).toBe(10);
    await expect.poll(() => board.evaluate((element, rows) => (
      Number(getComputedStyle(element).getPropertyValue(rows))
    ), game.rows)).toBe(6);
    await page.evaluate(selector => {
      window.compactTopologyTiles = [...document.querySelectorAll(selector)];
    }, `${game.board} ${game.tile}`);
    if (game.id === "link-connect") {
      await expect.poll(() => page.evaluate(async () => {
        const { linkGameState } = await import("/js/linkConnect/linkState.js");
        return !linkGameState.isLocked;
      })).toBe(true);
      await board.locator(`${game.tile}:not([disabled])`).first().click();
      await expect(board.locator(`${game.tile}.is-selected`)).toHaveCount(1);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => board.evaluate((element, columns) => (
      Number(getComputedStyle(element).getPropertyValue(columns))
    ), game.columns)).toBe(6);
    await expect.poll(() => board.evaluate((element, rows) => (
      Number(getComputedStyle(element).getPropertyValue(rows))
    ), game.rows)).toBe(10);
    if (game.id === "link-connect") await expect(board.locator(`${game.tile}.is-selected`)).toHaveCount(1);
    const tilesPreserved = await page.evaluate(selector => [...document.querySelectorAll(selector)].every((tile, index) => (
      tile === window.compactTopologyTiles[index]
    )), `${game.board} ${game.tile}`);
    expect(tilesPreserved, `${game.id} preserves tile elements through orientation`).toBe(true);
  });
}
