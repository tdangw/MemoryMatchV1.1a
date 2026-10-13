import { startMapLevel } from './helpers/adventureNavigation.js';
import { expect, test } from "@playwright/test";

const games = [
  { id: "memory-match", title: "Memory Match", root: "#game-container", layoutVariable: "--tile-size" },
  { id: "link-connect", title: "Link Connect", root: "#link-connect-container", layoutVariable: "--link-tile-size" },
];
const viewports = [{ width: 640, height: 360 }, { width: 914, height: 411 }];

async function start(page, game) {
  await page.locator(".game-selector__choice").filter({ hasText: game.title }).click();
  await startMapLevel(page);
  await expect(page.locator(`${game.root} [data-shell-region="board"]`)).toBeVisible();
  await page.waitForFunction(({ rootSelector, layoutVariable }) => {
    const board = document.querySelector(`${rootSelector} [data-shell-region="board"]`);
    return Boolean(board?.style.getPropertyValue(layoutVariable));
  }, { rootSelector: game.root, layoutVariable: game.layoutVariable }, { timeout: 5000 });
}

for (const viewport of viewports) {
  for (const game of games) {
    test(`${game.id} uses the shared compact shell at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(() => localStorage.clear());
      await page.goto("/");
      await start(page, game);
      const result = await page.evaluate(rootSelector => {
        const root = document.querySelector(rootSelector);
        const region = name => root.querySelector(`[data-shell-region="${name}"]`);
        const rect = node => node.getBoundingClientRect();
        const hud = region("hud");
        const compactHudWidth = rect(hud).width;
        root.classList.remove("shell-compact-landscape");
        const normalHudWidth = rect(hud).width;
        root.classList.add("shell-compact-landscape");
        return {
          compact: root.classList.contains("shell-compact-landscape"),
          hidden: ["title", "progress", "milestones"].map(name => getComputedStyle(region(name)).display),
          hud: rect(hud),
          hudWidthDelta: Math.abs(compactHudWidth - normalHudWidth * 0.9),
          frame: rect(region("frame")),
          board: rect(region("board")),
          fullscreen: rect(root.querySelector(".shell-fullscreen-button")),
          viewport: { width: innerWidth, height: innerHeight },
        };
      }, game.root);
      expect(result.compact).toBe(true);
      expect(result.hidden).toEqual(["none", "none", "none"]);
      expect(result.hudWidthDelta).toBeLessThanOrEqual(1);
      for (const region of [result.hud, result.frame, result.board, result.fullscreen]) {
        expect(region.width).toBeGreaterThan(0);
        expect(region.left).toBeGreaterThanOrEqual(-1);
        expect(region.right).toBeLessThanOrEqual(result.viewport.width + 1);
        expect(region.bottom).toBeLessThanOrEqual(result.viewport.height + 1);
      }
    });
  }
}

for (const game of games) {
  test(`${game.id} keeps landscape menus and settings inside the viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/");
    await start(page, game);
    const selectors = game.id === "memory-match"
      ? { actions: "#btn-actions-menu", menu: "#game-actions-menu", settings: "#btn-game-settings" }
      : { actions: "#link-actions-menu-toggle", menu: "#link-actions-menu", settings: '#link-actions-menu [data-action="settings"]' };
    await page.locator(selectors.actions).click();
    await expect(page.locator(selectors.actions)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(selectors.menu)).toBeVisible();
    const menuBounds = await page.locator(selectors.menu).evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: innerWidth, height: innerHeight };
    });
    expect(menuBounds.left).toBeGreaterThanOrEqual(-1);
    expect(menuBounds.right).toBeLessThanOrEqual(menuBounds.width + 1);
    expect(menuBounds.top).toBeGreaterThanOrEqual(-1);
    expect(menuBounds.bottom).toBeLessThanOrEqual(menuBounds.height + 1);
    await page.locator(selectors.settings).click();
    const modal = page.locator("#settings-modal .app-modal");
    await expect(modal).toBeVisible();
    const modalBounds = await modal.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: innerWidth, height: innerHeight };
    });
    expect(modalBounds.left).toBeGreaterThanOrEqual(-1);
    expect(modalBounds.right).toBeLessThanOrEqual(modalBounds.width + 1);
    expect(modalBounds.top).toBeGreaterThanOrEqual(-1);
    expect(modalBounds.bottom).toBeLessThanOrEqual(modalBounds.height + 1);
  });
}
