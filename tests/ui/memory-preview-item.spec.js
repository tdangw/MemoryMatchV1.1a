import { expect, test } from "@playwright/test";

test("Memory preview item reveals cards after its picker closes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();

  const hiddenCards = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("memory-match");
    await (await import("/js/gameController.js")).startNewMemoryRun(1);
    const { gameState } = await import("/js/gameState.js");
    gameState.progress.memoryMatch.items.preview4 = 1;
    gameState.isLocked = false;
    gameState.isPaused = false;
    document.querySelectorAll(".tile:not(.matched) img").forEach((image) => {
      image.classList.add("hidden");
      image.classList.remove("highlight-tile");
    });
    return document.querySelectorAll(".tile:not(.matched) img.hidden").length;
  });
  expect(hiddenCards).toBeGreaterThanOrEqual(4);

  await page.locator("#btn-preview-cards").click();
  await page.getByRole("button", { name: /Xem trước 4 thẻ/ }).click();

  await expect(page.locator("#quick-preview-modal")).toHaveCount(0);
  await expect(page.locator(".tile:not(.matched) img:not(.hidden)")).toHaveCount(4);
  const state = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return {
      count: gameState.progress.memoryMatch.items.preview4,
      locked: gameState.isLocked,
      paused: gameState.isPaused,
    };
  });
  expect(state).toEqual({ count: 0, locked: true, paused: false });
});
