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

test("Link V2 connection restarts pooled line animations on every draw", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { drawLinkPath, clearLinkPath } = await import("/js/linkConnect/linkRenderer.js");
    controller.startLinkLevel({ mode: "easy" });
    const path = findAvailableConnections(linkGameState.board.grid)[0].path;
    const surface = document.querySelector("#link-path-overlay");
    drawLinkPath(path, linkGameState.board);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const nodes = [...surface.querySelectorAll("polyline")];
    clearLinkPath();
    drawLinkPath(path, linkGameState.board);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const animations = nodes.flatMap((node) => node.getAnimations({ subtree: false }));
    return {
      reused: nodes.every((node) => node.isConnected),
      animationCount: animations.length,
      allRunning: animations.every((animation) => animation.playState === "running"),
      allRestarted: animations.every((animation) => Number(animation.currentTime) < 32),
    };
  });
  expect(result.reused).toBe(true);
  expect(result.animationCount).toBe(2);
  expect(result.allRunning).toBe(true);
  expect(result.allRestarted).toBe(true);
});

test("Link V2 connection keeps catalog decorations bounded in its persistent SVG pool", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const signatures = await page.evaluate(async () => {
    const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const { EFFECT_V2_PATHS } = await import("/js/effects/effectCatalog.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(surface);
    const entries = EFFECT_V2_PATHS.map((effect) => {
      renderConnectionV2({ surface, points: [{ x: 5, y: 5 }, { x: 45, y: 35 }, { x: 90, y: 80 }], effect, seed: 7 });
      const decorations = [...surface.querySelectorAll("[data-effect-decoration]")]
        .filter((node) => node.getAttribute("display") !== "none");
      return { id: effect.id, family: effect.family, count: decorations.length, signature: decorations.map((node) => node.getAttribute("class")).join("|") };
    });
    clearConnectionV2(surface);
    surface.remove();
    return entries;
  });
  expect(signatures).toHaveLength(21);
  expect(new Set(signatures.map((entry) => entry.family)).size).toBeGreaterThanOrEqual(17);
  expect(new Set(signatures.map((entry) => `${entry.count}:${entry.signature}`)).size).toBeGreaterThanOrEqual(17);
});

test("Triple V2 connection owns one handle and releases it after presentation cleanup", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { presentTripleConnection, clearTripleEffects } = await import("/js/tripleConnect/tripleEffectAdapter.js");
    const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    const frame = document.createElement("div");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    frame.append(surface);
    document.body.append(frame);
    frame.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
    const targets = [10, 45, 80].map((left) => {
      const tile = document.createElement("div");
      tile.getBoundingClientRect = () => ({ left, top: 40, width: 10, height: 10 });
      frame.append(tile);
      return tile;
    });
    const rendered = presentTripleConnection({ surface, targets, effectId: "electric" });
    const before = getEffectRegistry().diagnostics().connection;
    clearTripleEffects(surface);
    const after = getEffectRegistry().diagnostics().connection;
    const details = { rendered, before, after, visible: surface.classList.contains("is-visible"), children: surface.children.length };
    frame.remove();
    return details;
  });
  expect(result.rendered).toBe(true);
  expect(result.before).toBe(1);
  expect(result.after).toBe(0);
  expect(result.visible).toBe(false);
  expect(result.children).toBe(0);
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
