import { expect, test } from "@playwright/test";
import { getChallengeLayout } from "../../js/config.js";
import { getLinkChallengeLayout } from "../../js/linkConnect/linkConfig.js";

test("challenge progression keeps complete rows, stable columns and a 30-pair cap", () => {
  for (let level = 1; level <= 100; level++) {
    const link = getLinkChallengeLayout(level);
    const memory = getChallengeLayout(level * 2 - 1);
    expect(memory.tileCount).toBe(link.tileCount);
    expect(memory.columns).toBe(link.columns);
    expect(memory.mobileColumns).toBe(memory.columns);
    expect(getChallengeLayout(level * 2).tileCount).toBe(memory.tileCount);
    expect(link.tileCount % link.columns).toBe(0);
    expect(link.tileCount % 2).toBe(0);
    expect(link.tileCount).toBeLessThanOrEqual(60);
    if (level > 1 && level <= 10) expect(link.tileCount).toBeGreaterThan(getLinkChallengeLayout(level - 1).tileCount);
  }
  expect(getLinkChallengeLayout(4)).toMatchObject({ tileCount: 24, columns: 4 });
  expect(getLinkChallengeLayout(5)).toMatchObject({ tileCount: 30, columns: 6 });
  expect(getChallengeLayout(19).tileCount).toBe(60);
});

async function start(page, game, level) {
  await page.evaluate(async ({ game, level }) => {
    (await import("/js/gameSelector.js")).openGameMenu(game === "memory" ? "memory-match" : "link-connect");
    if (game === "memory") {
      const { gameState } = await import("/js/gameState.js");
      gameState.settings.mode = "challenge";
      await (await import("/js/gameController.js")).initializeLevel(level);
    } else {
      await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "challenge", level });
    }
  }, { game, level });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  // Dismiss the game selector through its normal entry point before direct level setup.
  await page.locator(".game-selector__choice").filter({ hasText: "Memory Match" }).click();
});

for (const game of ["memory", "link"]) {
  const root = game === "memory" ? "#game-container" : "#link-connect-container";
  const tiles = game === "memory" ? "#grid-container .tile" : "#link-board .link-tile";
  const frame = game === "memory" ? "#grid-board-frame" : "#link-board-frame";
  test(`${game}: largest challenge fits; fullscreen preserves tile nodes and cleans up`, async ({ page }, testInfo) => {
    await start(page, game, game === "memory" ? 19 : 10);
    await expect(page.locator(tiles)).toHaveCount(60);
    const button = page.locator(`${root} .shell-fullscreen-button`);
    await expect(button).toHaveCount(1);
    await expect.poll(() => page.locator(frame).evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(0);
    const geometry = await page.locator(frame).evaluate(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight };
    });
    expect(geometry.left).toBeGreaterThanOrEqual(-1);
    expect(geometry.right).toBeLessThanOrEqual(geometry.width + 1);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.height + 1);
    await page.evaluate(selector => { window.originalChallengeTiles = [...document.querySelectorAll(selector)]; }, tiles);
    // Remove transient start overlays before clicking the real fullscreen button.
    await expect(page.locator(".level-reward-overlay")).toHaveCount(0, { timeout: 10000 });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${game}-fullscreen.png`) });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    expect(await page.evaluate(selector => [...document.querySelectorAll(selector)].every((tile, i) => tile === window.originalChallengeTiles[i]), tiles)).toBe(true);
    await button.click();
    for (let i = 0; i < 3; i++) await start(page, game, game === "memory" ? 19 : 10);
    await expect(page.locator(".shell-fullscreen-button")).toHaveCount(1);
    expect(await page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    // Native browser exit (e.g. Escape) must also update the newly mounted button.
    await page.evaluate(() => document.exitFullscreen());
    await expect(button).toHaveAttribute("aria-pressed", "false");
    const cleanup = await page.evaluate(async () => {
      const { getActiveGameScope } = await import("/js/gameShell/gameShellLifecycle.js");
      const scope = getActiveGameScope();
      (await import("/js/gameShell/gameShell.js")).unmountActiveGameShell();
      return scope.diagnostics();
    });
    expect(cleanup.active).toBe(false);
    for (const [key, value] of Object.entries(cleanup)) if (key !== "active") expect(value, key).toBe(0);
    await expect(page.locator(".shell-fullscreen-button")).toHaveCount(0);
  });
}

test("rejected fullscreen falls back to focus mode and Escape restores the HUD", async ({ page }) => {
  await start(page, "memory", 7);
  await page.evaluate(() => {
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
    document.documentElement.requestFullscreen = () => Promise.reject(new Error("Blocked by embedder"));
  });
  const button = page.locator(".shell-fullscreen-button");
  await expect(page.locator(".level-reward-overlay")).toHaveCount(0, { timeout: 10000 });
  await button.click();
  await expect(button).toHaveAccessibleName("Thoát chế độ tập trung");
  await expect(page.locator("#game-container")).toHaveClass(/shell-focus-mode/);
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#game-container")).not.toHaveClass(/shell-focus-mode/);
});
