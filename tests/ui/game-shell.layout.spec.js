import { expect, test } from "@playwright/test";

const games = [
  { id: "memory-match", root: "#game-container", frame: "#grid-board-frame", board: "#grid-container", tile: ".tile", coordinates: [false, true] },
  { id: "link-connect", root: "#link-connect-container", frame: "#link-board-frame", board: "#link-board", tile: ".link-tile", coordinates: [false] },
];
const modes = ["easy", "normal", "hard", "superHard", "endless", "challenge"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    let seed = 20260907;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
});

test("game backgrounds use portrait assets only in portrait orientation", async ({ page }) => {
  const portrait = await page.evaluate(() => matchMedia("(orientation: portrait)").matches);
  const menuBackgroundImage = await page.evaluate(() => {
    delete document.documentElement.dataset.activeGame;
    return getComputedStyle(document.body).backgroundImage;
  });
  expect(menuBackgroundImage).toContain(
    portrait ? "background-main-portrait.webp" : "background-main.webp",
  );
  for (const gameId of ["memory-match", "link-connect", "triple-connect"]) {
    const backgroundImage = await page.evaluate((id) => {
      document.documentElement.dataset.activeGame = id;
      return getComputedStyle(document.body).backgroundImage;
    }, gameId);
    expect(backgroundImage).toContain(
      portrait ? `${gameId}-portrait-9x20.webp` : `${gameId}.webp`,
    );
  }
});

async function start(page, game, mode, coordinates = false, level = 1) {
  await page.evaluate(async ({ id, mode, coordinates, level }) => {
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.sound = false;
    gameState.settings.music = false;
    gameState.settings.mode = mode;
    gameState.settings.boardCoordinates = coordinates;
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id);
    if (id === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun(level);
    else await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode, level });
  }, { id: game.id, mode, coordinates, level });
  await expect(page.locator(`${game.board} ${game.tile}`).first()).toBeVisible();
  await settle(page);
}

async function settle(page) {
  await expect.poll(() => page.evaluate(async () => {
    const metrics = (await import("/js/gameShell/gameShellLayout.js")).getGameShellLayoutDiagnostics();
    return metrics.active === 1 && metrics.passes > 0 && metrics.pendingFrames === 0;
  })).toBe(true);
}

async function assertFit(page, game) {
  const result = await page.evaluate(async game => {
    const root = document.querySelector(game.root);
    if (!root?.classList.contains("game-shell-root")) {
      throw new Error(`Missing required Game Shell root: ${game.root}`);
    }
    const rect = element => {
      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    };
    const viewport = window.visualViewport;
    const frame = root.querySelector(game.frame);
    const board = root.querySelector(game.board);
    const hud = root.querySelector(".game-hud");
    const progress = root.querySelector('[data-shell-region="progress"]');
    const milestones = root.querySelector(".memory-special-hud, .link-special-hud");
    const title = root.querySelector('[data-shell-region="title"]');
    if (!frame || !board || !hud || !progress || !milestones || !title) {
      throw new Error(`Missing required shell region for ${game.id}`);
    }
    const timer = getComputedStyle(hud, "::after");
    const metrics = (await import("/js/gameShell/gameShellLayout.js")).getGameShellLayoutDiagnostics();
    return {
      frame: rect(frame), board: rect(board), hud: rect(hud), progress: rect(progress), milestones: rect(milestones),
      compactLandscape: root.classList.contains("shell-compact-landscape"),
      display: {
        title: getComputedStyle(title).display,
        progress: getComputedStyle(progress).display,
        milestones: getComputedStyle(milestones).display,
      },
      timerBottom: hud.getBoundingClientRect().bottom - (parseFloat(timer.bottom) || 0),
      tiles: [...board.querySelectorAll(game.tile)].map(rect),
      viewport: { width: viewport?.width ?? innerWidth, height: viewport?.height ?? innerHeight, left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0 },
      metrics,
    };
  }, game);
  expect(result.frame.width).toBeGreaterThan(0);
  if (result.compactLandscape) {
    expect(result.display).toEqual({ title: "none", progress: "none", milestones: "none" });
    expect(result.hud.bottom).toBeLessThanOrEqual(result.frame.top + 1);
  } else {
    expect(result.display.title).not.toBe("none");
    expect(result.display.progress).toBe("none");
    expect(result.display.milestones).not.toBe("none");
    expect(result.progress.height).toBe(0);
    expect(result.timerBottom).toBeLessThanOrEqual(result.milestones.top + 1);
    expect(result.milestones.bottom).toBeLessThanOrEqual(result.frame.top + 1);
  }
  for (const bounds of [result.frame, result.board, ...result.tiles]) {
    expect(bounds.left).toBeGreaterThanOrEqual(result.viewport.left - 1);
    expect(bounds.right).toBeLessThanOrEqual(result.viewport.left + result.viewport.width + 1);
    expect(bounds.bottom).toBeLessThanOrEqual(result.viewport.top + result.viewport.height + 1);
  }
  // Checking actual tiles catches a grid overflowing a CSS-clamped frame.
  for (const tile of result.tiles) {
    expect(tile.right).toBeLessThanOrEqual(result.board.right + 1);
    expect(tile.bottom).toBeLessThanOrEqual(result.board.bottom + 1);
  }
  expect(result.metrics.active).toBe(1);
  expect(result.metrics.observers).toBe(1);
  expect(result.metrics.maxPassesPerFrame).toBe(1);
  return result;
}

for (const game of games) for (const mode of modes) for (const coordinates of game.coordinates) {
  test(`${game.id} ${mode} coordinates=${coordinates}: board and tiles fit`, async ({ page }) => {
    await start(page, game, mode, coordinates);
    await assertFit(page, game);
  });
}

for (const game of games) {
  test(`${game.id}: large Challenge, orientation, rapid resize and modal`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await start(page, game, "challenge", game.id === "memory-match", 100);
    const originalTiles = await page.locator(`${game.board} ${game.tile}`).elementHandles();
    await assertFit(page, game);
    await page.setViewportSize({ width: 640, height: 360 });
    await settle(page);
    await assertFit(page, game);
    await page.setViewportSize({ width: 412, height: 915 });
    await settle(page);
    await assertFit(page, game);
    await page.setViewportSize({ width: 914, height: 411 });
    await settle(page);
    await assertFit(page, game);
    await page.setViewportSize({ width: 411, height: 914 });
    await settle(page);
    await assertFit(page, game);
    await page.evaluate(() => { for (let i = 0; i < 50; i++) window.dispatchEvent(new Event("resize")); });
    await settle(page);
    await assertFit(page, game);
    expect(await Promise.all(originalTiles.map(handle => handle.evaluate(element => element.isConnected)))).not.toContain(false);
    await page.evaluate(async () => {
      const { openAppModal } = await import("/js/modal.js");
      window.layoutTestModal = openAppModal({ id: "layout-test-modal", title: "Kiểm tra", content: "Layout", onClose: () => {} });
    });
    await expect(page.locator("#layout-test-modal")).toBeVisible();
    await page.evaluate(() => window.layoutTestModal.close());
    await expect(page.locator("#layout-test-modal")).toHaveCount(0);
    await settle(page);
    await assertFit(page, game);
    expect(errors).toEqual([]);
  });
}

test("20 game switches clean layout resources during preview", async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let resourceBaseline;
  for (let index = 0; index < 20; index++) {
    const game = games[index % games.length];
    await start(page, game, "easy");
    const fit = await assertFit(page, game);
    resourceBaseline ??= fit.metrics.listeners;
    expect(fit.metrics.listeners).toBe(resourceBaseline);
    await page.evaluate(async id => {
      if (id === "memory-match") (await import("/js/gameController.js")).returnToMainMenu();
      else (await import("/js/linkConnect/linkController.js")).returnToLinkMenu();
    }, game.id);
    const metrics = await page.evaluate(async () => (await import("/js/gameShell/gameShellLayout.js")).getGameShellLayoutDiagnostics());
    expect(metrics).toMatchObject({ active: 0, observers: 0, listeners: 0, pendingFrames: 0 });
  }
  await start(page, games[0], "normal", true);
  await assertFit(page, games[0]);
  expect(errors).toEqual([]);
});

test("visualViewport fallback and safe-area budget", async ({ page }) => {
  await page.evaluate(() => Object.defineProperty(window, "visualViewport", { configurable: true, value: undefined }));
  await start(page, games[0], "superHard", true);
  await page.evaluate(() => {
    document.querySelector("#game-container").style.setProperty("--shell-viewport-safe-bottom", "32px");
    window.dispatchEvent(new Event("resize"));
  });
  await settle(page);
  const result = await assertFit(page, games[0]);
  expect(result.frame.bottom).toBeLessThanOrEqual(result.viewport.height - 32 + 1);
});

test("Memory and Link resolve the shared shell gap from the same token", async ({ page }) => {
  const gaps = [];
  for (const game of games) {
    await start(page, game, "easy");
    gaps.push(await page.evaluate(rootSelector => {
      const style = getComputedStyle(document.querySelector(rootSelector));
      return {
        resolved: Number.parseFloat(style.gap),
        token: Number.parseFloat(style.getPropertyValue("--shell-active-frame-gap")),
      };
    }, game.root));
    await page.evaluate(async id => {
      if (id === "memory-match") (await import("/js/gameController.js")).returnToMainMenu();
      else (await import("/js/linkConnect/linkController.js")).returnToLinkMenu();
    }, game.id);
  }
  expect(gaps.every(({ resolved, token }) => resolved === token)).toBe(true);
  expect(gaps[0].resolved).toBe(gaps[1].resolved);
});
