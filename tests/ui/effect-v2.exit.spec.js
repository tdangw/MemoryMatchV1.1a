import { expect, test } from "@playwright/test";

test("Link exit families keep portal, blackhole and implode distinct and clean transient geometry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { clearLinkTransientEffects, playLinkMatchExit } = await import("/js/linkConnect/linkRenderer.js");
    await controller.startLinkLevel({ mode: "easy" });
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    const output = {};
    for (const id of ["portal", "blackhole", "implode", "collide"]) {
      gameState.appearance.linkExitEffect = id;
      const tiles = playLinkMatchExit(connection.start, connection.end);
      output[id] = {
        names: tiles.map(tile => getComputedStyle(tile).animationName),
        pull: tiles.map(tile => [tile.style.getPropertyValue("--link-exit-pull-x"), tile.style.getPropertyValue("--link-exit-pull-y")]),
        collide: tiles.map(tile => [tile.style.getPropertyValue("--link-exit-collide-x"), tile.style.getPropertyValue("--link-exit-collide-y")]),
      };
      clearLinkTransientEffects();
    }
    const tiles = [...document.querySelectorAll(".link-tile")].slice(0, 2);
    return { output, after: tiles.map(tile => [tile.style.getPropertyValue("--link-exit-pull-x"), tile.style.getPropertyValue("--link-exit-pull-y")]) };
  });
  expect(result.output.portal.names).toEqual(["link-tile-portal", "link-tile-portal"]);
  expect(result.output.blackhole.names).toEqual(["link-tile-blackhole", "link-tile-blackhole"]);
  expect(result.output.implode.names).toEqual(["link-tile-implode", "link-tile-implode"]);
  expect(result.output.collide.names).toEqual(["link-tile-collide", "link-tile-collide"]);
  expect(result.output.blackhole.pull.flat()).toEqual(expect.not.arrayContaining([""]));
  expect(result.output.portal.pull.flat()).toEqual(["", "", "", ""]);
  expect(result.output.implode.pull.flat()).toEqual(["", "", "", ""]);
  expect(result.output.collide.collide.flat()).toEqual(expect.not.arrayContaining([""]));
  expect(result.after.flat()).toEqual(["", "", "", ""]);
});

test("Default and dissolve exits do not brighten both matched tiles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const filters = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { clearLinkTransientEffects, playLinkMatchExit } = await import("/js/linkConnect/linkRenderer.js");
    await controller.startLinkLevel({ mode: "easy" });
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    const output = [];
    for (const id of ["default", "dissolve"]) {
      gameState.appearance.linkExitEffect = id;
      const tiles = playLinkMatchExit(connection.start, connection.end);
      output.push(...tiles.flatMap((tile) => [tile, tile.querySelector("img")])
        .filter(Boolean)
        .flatMap((node) => node.getAnimations().flatMap((animation) => animation.effect.getKeyframes()))
        .map((frame) => frame.filter || "none"));
      clearLinkTransientEffects();
    }
    return output;
  });
  expect(filters.every((filter) => !filter.includes("brightness"))).toBe(true);
});

test("Link V2 connection and exit use a static reduced-motion representation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { drawLinkPath, playLinkMatchExit, clearLinkTransientEffects } = await import("/js/linkConnect/linkRenderer.js");
    await controller.startLinkLevel({ mode: "easy" });
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    gameState.appearance.linkExitEffect = "pixel";
    drawLinkPath(connection.path, linkGameState.board);
    const tiles = playLinkMatchExit(connection.start, connection.end);
    const animations = [...document.querySelectorAll("#link-path-overlay *, .link-tile.is-removing, .link-tile.is-removing img")]
      .flatMap(node => node.getAnimations()).filter(animation => animation.playState === "running").length;
    const opacity = tiles.map(tile => getComputedStyle(tile).opacity);
    clearLinkTransientEffects();
    return { animations, opacity, stale: document.querySelectorAll(".link-tile.is-removing, .has-canvas-exit").length };
  });
  expect(result.animations).toBe(0);
  expect(result.opacity).toEqual(["0", "0"]);
  expect(result.stale).toBe(0);
});

test("Electric exit starts at the same impact instant as its travelling bolt", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { drawLinkPath, playLinkMatchExit, clearLinkTransientEffects } = await import("/js/linkConnect/linkRenderer.js");
    await controller.startLinkLevel({ mode: "easy" });
    gameState.appearance.linkPathEffect = "electric";
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    drawLinkPath(connection.path, linkGameState.board);
    const tiles = playLinkMatchExit(connection.start, connection.end);
    const surface = document.querySelector("#link-path-overlay");
    const beam = surface.querySelector(".link-path-overlay__beam");
    const beforeCleanup = {
      pathImpactDelay: surface.style.getPropertyValue("--effect-v2-connection-impact-delay"),
      beamDurations: getComputedStyle(beam).animationDuration,
      exitDelays: tiles.map(tile => getComputedStyle(tile).animationDelay),
      impactDecoration: Boolean(surface.querySelector(".effect-v2-connection__decoration--impact")),
    };
    clearLinkTransientEffects();
    return {
      beforeCleanup,
      exitDelayCleared: tiles.every(tile => !tile.style.getPropertyValue("--link-tile-exit-delay")),
    };
  });
  expect(result.beforeCleanup.pathImpactDelay).toBe("260ms");
  expect(result.beforeCleanup.beamDurations).toContain("0.26s");
  expect(result.beforeCleanup.exitDelays).toEqual(["0.26s", "0.26s"]);
  expect(result.beforeCleanup.impactDecoration).toBe(true);
  expect(result.exitDelayCleared).toBe(true);
});

test("Fire exit follows the same short impact timeline as Electric", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { drawLinkPath, playLinkMatchExit, clearLinkTransientEffects } = await import("/js/linkConnect/linkRenderer.js");
    await controller.startLinkLevel({ mode: "easy" });
    gameState.appearance.linkPathEffect = "fire";
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    drawLinkPath(connection.path, linkGameState.board);
    const tiles = playLinkMatchExit(connection.start, connection.end);
    const surface = document.querySelector("#link-path-overlay");
    const result = {
      pathImpactDelay: surface.style.getPropertyValue("--effect-v2-connection-impact-delay"),
      exitDelays: tiles.map(tile => getComputedStyle(tile).animationDelay),
      sparks: surface.querySelectorAll(".effect-v2-connection__decoration--fire").length,
    };
    clearLinkTransientEffects();
    return result;
  });
  expect(result.pathImpactDelay).toBe("260ms");
  expect(result.exitDelays).toEqual(["0.26s", "0.26s"]);
  expect(result.sparks).toBe(4);
});

test("every saved Link exit ID resolves, renders, and releases its transient state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { LINK_EXIT_EFFECTS } = await import("/js/linkConnect/linkEffects.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { clearLinkTransientEffects, playLinkMatchExit } = await import("/js/linkConnect/linkRenderer.js");
    await controller.startLinkLevel({ mode: "easy" });
    await Promise.all([...document.querySelectorAll("#link-board-frame .link-tile img:not(.link-tile__frost-overlay)")]
      .map(image => image.decode().catch(() => undefined)));
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    const rendered = LINK_EXIT_EFFECTS.map(({ id, className }) => {
      gameState.appearance.linkExitEffect = id;
      const tiles = playLinkMatchExit(connection.start, connection.end);
      const applied = tiles.length === 2 && tiles.every(tile => tile.classList.contains(className));
      clearLinkTransientEffects();
      return { id, applied, stale: document.querySelectorAll(".link-tile.is-removing, .has-canvas-exit").length };
    });
    return rendered;
  });
  expect(result).toHaveLength(21);
  expect(result).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: "default", applied: true, stale: 0 }),
    expect.objectContaining({ id: "blackhole", applied: true, stale: 0 }),
    expect.objectContaining({ id: "ghost", applied: true, stale: 0 }),
  ]));
  expect(result.every(entry => entry.applied && entry.stale === 0)).toBe(true);
});

test("Link canvas exits reuse one board surface and release it during cleanup", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { playLinkMatchExit } = await import("/js/linkConnect/linkRenderer.js");
    await controller.startLinkLevel({ mode: "easy" });
    gameState.appearance.linkExitEffect = "finedust";
    await Promise.all([...document.querySelectorAll("#link-board-frame .link-tile img:not(.link-tile__frost-overlay)")]
      .map(image => image.decode().catch(() => undefined)));
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    playLinkMatchExit(connection.start, connection.end);
  });
  const canvas = page.locator("#link-board-frame .link-card-exit-effect");
  await expect(canvas).toHaveCount(1);
  await canvas.evaluate(node => { globalThis.__effectV2Canvas = node; });
  await page.waitForTimeout(900);
  await page.evaluate(async () => {
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { playLinkMatchExit } = await import("/js/linkConnect/linkRenderer.js");
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    playLinkMatchExit(connection.start, connection.end);
  });
  await expect(canvas).toHaveCount(1);
  expect(await canvas.evaluate(node => node === globalThis.__effectV2Canvas)).toBe(true);
  await page.evaluate(async () => (await import("/js/linkConnect/linkRenderer.js")).clearLinkTransientEffects());
  await expect(canvas).toHaveCount(0);
});

test("Canvas exit keeps its source cards hidden until match cleanup removes them", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { clearLinkTransientEffects, playLinkMatchExit } = await import("/js/linkConnect/linkRenderer.js");
    await controller.startLinkLevel({ mode: "easy" });
    gameState.appearance.linkExitEffect = "finedust";
    await Promise.all([...document.querySelectorAll("#link-board-frame .link-tile img:not(.link-tile__frost-overlay)")]
      .map(image => image.decode().catch(() => undefined)));
    const connection = findAvailableConnections(linkGameState.board.grid)[0];
    const tiles = playLinkMatchExit(connection.start, connection.end);
    await new Promise(resolve => setTimeout(resolve, 790));
    const beforeCleanup = tiles.map(tile => ({
      canvasExit: tile.classList.contains("has-canvas-exit"),
      imageOpacity: getComputedStyle(tile.querySelector("img")).opacity,
    }));
    clearLinkTransientEffects();
    return {
      beforeCleanup,
      afterCleanup: tiles.map(tile => tile.classList.contains("has-canvas-exit")),
    };
  });
  expect(result.beforeCleanup).toEqual([
    { canvasExit: true, imageOpacity: "0" },
    { canvasExit: true, imageOpacity: "0" },
  ]);
  expect(result.afterCleanup).toEqual([false, false]);
});

test("Link canvas exit returns to baseline after 100 render, cleanup, and switch cycles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const selector = await import("/js/gameSelector.js");
    const controller = await import("/js/linkConnect/linkController.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { findAvailableConnections } = await import("/js/linkConnect/pathfinder.js");
    const { gameState } = await import("/js/gameState.js");
    const { clearLinkTransientEffects, playLinkMatchExit } = await import("/js/linkConnect/linkRenderer.js");
    const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    let maximum = 0;
    for (let cycle = 0; cycle < 100; cycle += 1) {
      selector.openGameMenu("link-connect");
      await controller.startLinkLevel({ mode: "easy" });
      gameState.appearance.linkExitEffect = "finedust";
      await Promise.all([...document.querySelectorAll("#link-board-frame .link-tile img:not(.link-tile__frost-overlay)")]
        .map(image => image.decode().catch(() => undefined)));
      const connection = findAvailableConnections(linkGameState.board.grid)[0];
      playLinkMatchExit(connection.start, connection.end);
      maximum = Math.max(maximum, getEffectRegistry().diagnostics().canvas);
      clearLinkTransientEffects();
      if (getEffectRegistry().diagnostics().canvas !== 0) throw new Error("stale canvas handle");
      selector.openGameMenu("memory-match");
    }
    return { maximum, canvas: document.querySelectorAll(".link-card-exit-effect").length };
  });
  expect(result.maximum).toBe(1);
  expect(result.canvas).toBe(0);
});
