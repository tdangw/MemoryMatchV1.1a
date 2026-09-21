import { expect, test } from "@playwright/test";

test("Link V2 connection surface reuses its SVG nodes and clears without stale decorations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { drawLinkPath, clearLinkPath } = await import("/js/linkConnect/linkRenderer.js");
    const { LINK_PATH_EFFECTS } = await import("/js/linkConnect/linkEffects.js");
    const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    controller.startLinkLevel({ mode: "easy" });
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    const surface = document.querySelector("#link-path-overlay");
    const seen = [];
    let nodes;
    for (const effect of LINK_PATH_EFFECTS) {
      gameState.appearance.linkPathEffect = effect.id;
      drawLinkPath(connection.path, linkGameState.board);
      const children = [...surface.children];
      nodes ||= children.slice(0, 2);
      seen.push({ id: effect.id, className: surface.className.baseVal, reused: children[0] === nodes[0] && children[1] === nodes[1] });
    }
    const idsBeforeClear = [...surface.querySelectorAll("[id]")].map(node => node.id);
    clearLinkPath();
    return { seen, idsBeforeClear, active: getEffectRegistry().diagnostics(), visible: surface.classList.contains("is-visible"), points: [...surface.querySelectorAll("polyline")].map(node => node.getAttribute("points")) };
  });
  expect(result.seen).toHaveLength(21);
  for (const entry of result.seen) {
    expect(entry.className).toContain(`link-path-overlay--${entry.id}`);
    expect(entry.reused).toBe(true);
  }
  expect(result.idsBeforeClear).toEqual([]);
  expect(result.active.connection).toBe(0);
  expect(result.visible).toBe(false);
  expect(result.points).toEqual([null, null]);
});

test("Link V2 connection handle is disposed when switching games", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const selector = await import("/js/gameSelector.js");
    selector.openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { drawLinkPath } = await import("/js/linkConnect/linkRenderer.js");
    const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    controller.startLinkLevel({ mode: "easy" });
    drawLinkPath(findAvailableConnections(linkGameState.board.grid)[0].path, linkGameState.board);
    const registry = getEffectRegistry();
    const before = registry.diagnostics();
    selector.openGameMenu("memory-match");
    const root = document.querySelector("#link-connect-container");
    return { before, after: registry.diagnostics(), surfaceRetained: Boolean(document.querySelector("#link-path-overlay")), rootHidden: root?.hidden };
  });
  expect(result.before.connection).toBe(1);
  expect(result.after.connection).toBe(0);
  expect(result.surfaceRetained).toBe(true);
  expect(result.rootHidden).toBe(true);
});

test("Link V2 connection returns to its resource baseline after 100 draw and switch cycles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const selector = await import("/js/gameSelector.js");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { drawLinkPath } = await import("/js/linkConnect/linkRenderer.js");
    const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    let maximum = 0;
    for (let cycle = 0; cycle < 100; cycle++) {
      selector.openGameMenu("link-connect");
      controller.startLinkLevel({ mode: "easy" });
      drawLinkPath(findAvailableConnections(linkGameState.board.grid)[0].path, linkGameState.board);
      maximum = Math.max(maximum, getEffectRegistry().diagnostics().connection);
      selector.openGameMenu("memory-match");
      if (getEffectRegistry().diagnostics().connection !== 0) throw new Error("stale connection handle");
    }
    const surface = document.querySelector("#link-path-overlay");
    return { maximum, children: surface?.children.length, paths: surface?.querySelectorAll("polyline").length };
  });
  expect(result.maximum).toBe(1);
  expect(result.children).toBeLessThanOrEqual(3);
  expect(result.paths).toBe(2);
});
