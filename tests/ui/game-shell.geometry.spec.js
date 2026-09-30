import { expect, test } from "@playwright/test";

const GEOMETRY_TOLERANCE_PX = 1;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
});

for (const game of [
  {
    title: "Memory Match",
    root: "#game-container.game-shell-root",
    titleRegion: '[data-shell-region="title"]',
    hud: "#game-title",
    progress: "#game-progress-hud",
    milestones: "#memory-special-hud",
    board: "#grid-board-frame",
    tile: "#grid-container .tile",
  },
  {
    title: "Link Connect",
    root: "#link-connect-container.game-shell-root",
    titleRegion: '[data-shell-region="title"]',
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
      const root = document.querySelector(selectors.root);
      if (!root) throw new Error(`Missing visible Game Shell root: ${selectors.root}`);
      const rect = (selector) => {
        const element = root.querySelector(selector);
        if (!element) throw new Error(`Missing required shell region: ${selector}`);
        const bounds = element.getBoundingClientRect();
        return {
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
        };
      };
      const hud = root.querySelector(selectors.hud);
      if (!hud) throw new Error(`Missing required shell HUD: ${selectors.hud}`);
      const timerStyle = getComputedStyle(hud, "::after");
      return {
        viewport: { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
        compactLandscape: root.classList.contains("shell-compact-landscape"),
        progress: rect(selectors.progress),
        titleDisplay: getComputedStyle(root.querySelector(selectors.titleRegion)).display,
        hud: rect(selectors.hud),
        milestones: rect(selectors.milestones),
        board: rect(selectors.board),
        progressDisplay: getComputedStyle(root.querySelector(selectors.progress)).display,
        milestonesDisplay: getComputedStyle(root.querySelector(selectors.milestones)).display,
        timerHeight: Number.parseFloat(timerStyle.height || "0"),
        timerBottom: hud.getBoundingClientRect().bottom - Number.parseFloat(timerStyle.bottom || "0"),
      };
    }, game);

    expect(geometry.progress).not.toBeNull();
    expect(geometry.hud).not.toBeNull();
    expect(geometry.milestones).not.toBeNull();
    expect(geometry.board).not.toBeNull();
    expect(geometry.timerHeight).toBeCloseTo(3, 5);
    if (geometry.compactLandscape) {
      expect(geometry.titleDisplay).toBe("none");
      expect(geometry.progressDisplay).toBe("none");
      expect(geometry.milestonesDisplay).toBe("none");
      expect(geometry.hud.bottom).toBeLessThanOrEqual(geometry.board.top + GEOMETRY_TOLERANCE_PX);
    } else {
      expect(geometry.progress.bottom).toBeLessThanOrEqual(geometry.hud.top + GEOMETRY_TOLERANCE_PX);
      expect(geometry.milestones.bottom).toBeLessThanOrEqual(geometry.board.top + GEOMETRY_TOLERANCE_PX);
    }
    expect(geometry.board.left).toBeGreaterThanOrEqual(-GEOMETRY_TOLERANCE_PX);
    expect(geometry.board.right).toBeLessThanOrEqual(geometry.viewport.width + GEOMETRY_TOLERANCE_PX);
    expect(geometry.board.bottom).toBeLessThanOrEqual(geometry.viewport.height + GEOMETRY_TOLERANCE_PX);
  });
}

for (const viewport of [
  { width: 412, height: 915 },
]) {
  for (const game of ["Memory Match", "Link Connect"]) {
    test(`${game}: baseline geometry at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await startEasyGame(page, game);
      const root = game === "Memory Match"
        ? page.locator("#game-container.game-shell-root")
        : page.locator("#link-connect-container.game-shell-root");
      await expect(root).toBeVisible();
      const metrics = await root.evaluate(element => {
        const regions = ["title", "progress", "hud", "milestones", "frame", "board"]
          .map(name => element.querySelector(`[data-shell-region="${name}"]`));
        if (regions.some(region => !region)) throw new Error("Missing required Game Shell region");
        const compact = element.classList.contains("shell-compact-landscape");
        const rect = region => region.getBoundingClientRect();
        return {
          compact,
          displays: regions.slice(0, 4).map(region => getComputedStyle(region).display),
          hud: rect(regions[2]),
          frame: rect(regions[4]),
          board: rect(regions[5]),
          viewport: { width: innerWidth, height: innerHeight },
        };
      });
      if (viewport.width > viewport.height) {
        expect(metrics.compact).toBe(true);
        expect(metrics.displays).toEqual(["none", "none", expect.any(String), "none"]);
        expect(metrics.hud.bottom).toBeLessThanOrEqual(metrics.frame.top + GEOMETRY_TOLERANCE_PX);
      } else {
        expect(metrics.compact).toBe(false);
        expect(metrics.displays).toEqual([expect.not.stringMatching(/^none$/), "none", expect.not.stringMatching(/^none$/), expect.not.stringMatching(/^none$/)]);
      }
      for (const bounds of [metrics.hud, metrics.frame, metrics.board]) {
        expect(bounds.left).toBeGreaterThanOrEqual(-GEOMETRY_TOLERANCE_PX);
        expect(bounds.right).toBeLessThanOrEqual(metrics.viewport.width + GEOMETRY_TOLERANCE_PX);
        expect(bounds.bottom).toBeLessThanOrEqual(metrics.viewport.height + GEOMETRY_TOLERANCE_PX);
      }
    });
  }
}

async function startEasyGame(page, title) {
  await page.locator(".game-selector__choice").filter({ hasText: title }).click();
  await page.locator(".menu-item").filter({ hasText: "Bắt đầu" }).click();
  await page.locator("#difficulty-modal .difficulty-option").filter({ hasText: "Dễ" }).click();
}
