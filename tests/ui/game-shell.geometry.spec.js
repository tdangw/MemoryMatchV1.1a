import { expect, test } from "@playwright/test";

const GEOMETRY_TOLERANCE_PX = 1;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
});

for (const game of [
  {
    title: "Memory Match",
    hud: "#game-title",
    progress: "#game-progress-hud",
    milestones: "#memory-special-hud",
    board: "#grid-board-frame",
    tile: "#grid-container .tile",
  },
  {
    title: "Link Connect",
    hud: "#link-game-title",
    progress: ".link-game-progress-hud",
    milestones: ".link-special-hud",
    board: "#link-board-frame",
    tile: "#link-board .link-tile",
  },
]) {
  test(`${game.title}: HUD and board stay inside the viewport without overlap`, async ({ page }) => {
    await startEasyGame(page, game.title);
    await expect(page.locator(game.tile).first()).toBeVisible();

    const geometry = await page.evaluate((selectors) => {
      const rect = (selector) => {
        const bounds = document.querySelector(selector)?.getBoundingClientRect();
        if (!bounds) return null;
        return {
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
        };
      };
      const hud = document.querySelector(selectors.hud);
      const timerStyle = hud ? getComputedStyle(hud, "::after") : null;
      return {
        viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
        progress: rect(selectors.progress),
        hud: rect(selectors.hud),
        milestones: rect(selectors.milestones),
        board: rect(selectors.board),
        timerHeight: Number.parseFloat(timerStyle?.height || "0"),
        timerBottom: hud && timerStyle
          ? hud.getBoundingClientRect().bottom - Number.parseFloat(timerStyle.bottom || "0")
          : 0,
      };
    }, game);

    expect(geometry.progress).not.toBeNull();
    expect(geometry.hud).not.toBeNull();
    expect(geometry.milestones).not.toBeNull();
    expect(geometry.board).not.toBeNull();
    expect(geometry.timerHeight).toBeCloseTo(3, 5);
    expect(geometry.progress.bottom).toBeLessThanOrEqual(geometry.hud.top + GEOMETRY_TOLERANCE_PX);
    expect(geometry.timerBottom).toBeLessThanOrEqual(geometry.milestones.top + GEOMETRY_TOLERANCE_PX);
    expect(geometry.milestones.bottom).toBeLessThanOrEqual(geometry.board.top + GEOMETRY_TOLERANCE_PX);
    expect(geometry.board.left).toBeGreaterThanOrEqual(-GEOMETRY_TOLERANCE_PX);
    expect(geometry.board.right).toBeLessThanOrEqual(geometry.viewport.width + GEOMETRY_TOLERANCE_PX);
    expect(geometry.board.bottom).toBeLessThanOrEqual(geometry.viewport.height + GEOMETRY_TOLERANCE_PX);
  });
}

async function startEasyGame(page, title) {
  await page.locator(".game-selector__choice").filter({ hasText: title }).click();
  await page.locator(".menu-item").filter({ hasText: "Bắt đầu" }).click();
  await page.locator("#difficulty-modal .difficulty-option").filter({ hasText: "Dễ" }).click();
}
