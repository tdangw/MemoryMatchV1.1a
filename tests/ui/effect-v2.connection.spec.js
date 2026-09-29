import { expect, test } from "@playwright/test";

test("Connection cleanup is idempotent before its first render", async ({ page }) => {
  await page.goto("/");
  const cleared = await page.evaluate(async () => {
    const { clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    clearConnectionV2(surface);
    clearConnectionV2(surface);
    return !surface.classList.contains("is-visible");
  });
  expect(cleared).toBe(true);
});

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
      const coreNodes = [
        surface.querySelector(".link-path-overlay__glow"),
        surface.querySelector(".link-path-overlay__beam"),
      ];
      nodes ||= coreNodes;
      seen.push({ id: effect.id, className: surface.className.baseVal, reused: coreNodes[0] === nodes[0] && coreNodes[1] === nodes[1] });
    }
    const idsBeforeClear = [...surface.querySelectorAll("[id]")].map(node => node.id);
    clearLinkPath();
    return { seen, idsBeforeClear, active: getEffectRegistry().diagnostics(), visible: surface.classList.contains("is-visible"), points: [...surface.querySelectorAll(".link-path-overlay__glow, .link-path-overlay__beam")].map(node => node.getAttribute("points")) };
  });
  expect(result.seen).toHaveLength(21);
  for (const entry of result.seen) {
    expect(entry.className).toContain(`link-path-overlay--${entry.id}`);
    expect(entry.reused).toBe(true);
  }
  expect(result.idsBeforeClear).toHaveLength(1);
  expect(result.idsBeforeClear[0]).toMatch(/^effect-v2-rainbow-gradient-\d+$/);
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
      const beam = surface.querySelector(".link-path-overlay__beam");
      const visibleChains = [...surface.querySelectorAll("[data-effect-chain-link]")]
        .filter((node) => node.getAttribute("display") !== "none").length;
      const visibleTravelers = [...surface.querySelectorAll("[data-effect-route-traveler]")]
        .filter((node) => node.getAttribute("display") !== "none").length;
      return {
        id: effect.id,
        family: effect.family,
        count: decorations.length,
        signature: [
          decorations.map((node) => node.getAttribute("class")).join("|"),
          beam.getAttribute("points").trim().split(/\s+/).length,
          getComputedStyle(beam).animationName,
          visibleChains,
          visibleTravelers,
        ].join(":"),
      };
    });
    clearConnectionV2(surface);
    surface.remove();
    return entries;
  });
  expect(signatures).toHaveLength(21);
  expect(new Set(signatures.map((entry) => entry.family)).size).toBeGreaterThanOrEqual(17);
  expect(new Set(signatures.map((entry) => `${entry.count}:${entry.signature}`)).size).toBeGreaterThanOrEqual(19);
});

test("Electric connection renders an organic cyan bolt with bounded pooled nodes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const { getEffectV2Path } = await import("/js/effects/effectCatalog.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(surface);
    const points = [{ x: 5, y: 15 }, { x: 48, y: 15 }, { x: 48, y: 82 }, { x: 92, y: 82 }];
    surface.getBoundingClientRect = () => ({ width: 360, height: 440 });
    renderConnectionV2({ surface, points, effect: getEffectV2Path("electric"), seed: 17 });
    const boltPoints = surface.querySelector(".link-path-overlay__beam").getAttribute("points").trim().split(/\s+/);
    clearConnectionV2(surface);
    const cleared = !surface.querySelector(".link-path-overlay__beam").hasAttribute("points");
    surface.remove();
    return { boltPoints: boltPoints.length, cleared };
  });
  expect(result.boltPoints).toBeGreaterThan(60);
  expect(result.cleared).toBe(true);
});

test("Fire connection renders a compact red jagged bolt inside the shared SVG pool", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const { getEffectV2Path } = await import("/js/effects/effectCatalog.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(surface);
    surface.getBoundingClientRect = () => ({ width: 360, height: 440 });
    renderConnectionV2({
      surface,
      points: [{ x: 8, y: 18 }, { x: 48, y: 18 }, { x: 48, y: 76 }, { x: 90, y: 76 }],
      effect: getEffectV2Path("fire"),
      seed: 5,
    });
    const boltPoints = surface.querySelector(".link-path-overlay__beam").getAttribute("points").trim().split(/\s+/);
    const sparks = [...surface.querySelectorAll(".effect-v2-connection__decoration--fire")]
      .map(node => Number(node.getAttribute("r")));
    const children = surface.children.length;
    clearConnectionV2(surface);
    surface.remove();
    return { boltPoints: boltPoints.length, sparks, children };
  });
  expect(result.boltPoints).toBeGreaterThan(48);
  expect(result.sparks).toHaveLength(2);
  expect(result.children).toBe(3);
});

test("Rainbow connection draws all seven spectrum colors with one reusable SVG gradient", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const { getEffectV2Path } = await import("/js/effects/effectCatalog.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(surface);
    surface.getBoundingClientRect = () => ({ width: 360, height: 440 });
    const effect = getEffectV2Path("rainbow");
    renderConnectionV2({ surface, points: [{ x: 8, y: 15 }, { x: 90, y: 82 }], effect, seed: 7 });
    const gradient = surface.querySelector("linearGradient");
    const firstGradient = gradient;
    renderConnectionV2({ surface, points: [{ x: 15, y: 8 }, { x: 82, y: 90 }], effect, seed: 8 });
    const result = {
      reusable: surface.querySelector("linearGradient") === firstGradient,
      colors: [...gradient.querySelectorAll("stop")].map(stop => stop.getAttribute("stop-color")),
      stroke: surface.style.getPropertyValue("--effect-v2-rainbow-stroke"),
    };
    clearConnectionV2(surface);
    surface.remove();
    return result;
  });
  expect(result.reusable).toBe(true);
  expect(result.colors).toHaveLength(7);
  expect(result.colors).toEqual(["#ff4f5d", "#ff9e35", "#ffe66b", "#67e89a", "#58cbff", "#7986ff", "#d88bff"]);
  expect(result.stroke).toMatch(/^url\(#effect-v2-rainbow-gradient-\d+\)$/);
});

test("Hydro bubbles follow the rendered wave path through a bounded SVG motion pool", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const { getEffectV2Path } = await import("/js/effects/effectCatalog.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(surface);
    surface.getBoundingClientRect = () => ({ width: 360, height: 440 });
    renderConnectionV2({
      surface,
      points: [{ x: 8, y: 14 }, { x: 52, y: 14 }, { x: 52, y: 84 }, { x: 92, y: 84 }],
      effect: getEffectV2Path("hydro"),
      seed: 11,
    });
    const motions = [...surface.querySelectorAll("animateMotion.effect-v2-connection__hydro-motion")];
    const beam = surface.querySelector(".link-path-overlay__beam");
    const glow = surface.querySelector(".link-path-overlay__glow");
    const beamSegments = beam.getAttribute("points").trim().split(/\s+/).length;
    const result = {
      count: motions.length,
      begins: motions.map(motion => motion.getAttribute("begin")),
      paths: motions.map(motion => motion.getAttribute("path")),
      beamSegments,
      beamWidth: Number.parseFloat(getComputedStyle(beam).strokeWidth),
      glowWidth: Number.parseFloat(getComputedStyle(glow).strokeWidth),
      children: surface.children.length,
    };
    clearConnectionV2(surface);
    surface.remove();
    return result;
  });
  expect(result.count).toBe(3);
  expect(result.begins).toEqual(["indefinite", "indefinite", "indefinite"]);
  expect(result.paths.every(path => path.startsWith("M8 14 L"))).toBe(true);
  expect(result.paths.every(path => (path.match(/ L/g) || []).length === result.beamSegments - 1)).toBe(true);
  expect(result.beamWidth).toBeLessThan(1.2);
  expect(result.glowWidth).toBeLessThan(1.9);
  expect(result.children).toBe(3);
});

test("Remaining named effects stay on their legal route with distinct bounded SVG treatments", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const { getEffectV2Path } = await import("/js/effects/effectCatalog.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(surface);
    surface.getBoundingClientRect = () => ({ width: 360, height: 440 });
    surface.style.setProperty("--link-path-animation-duration", "760ms");
    const points = [{ x: 8, y: 18 }, { x: 52, y: 18 }, { x: 52, y: 82 }, { x: 92, y: 82 }];
    const entries = [];
    for (const id of ["dashed", "bullet", "kame", "halo", "sonic", "chains", "meteor", "poison"]) {
      renderConnectionV2({ surface, points, effect: getEffectV2Path(id), seed: 41 });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const beamPoints = surface.querySelector(".link-path-overlay__beam").getAttribute("points").trim().split(/\s+/);
      const travelers = [...surface.querySelectorAll("[data-effect-route-traveler]")]
        .filter((node) => node.getAttribute("display") !== "none");
      const chainCenters = [...surface.querySelectorAll("[data-effect-chain-link]")]
        .filter((node) => node.getAttribute("display") !== "none")
        .map((node) => [Number(node.getAttribute("cx")), Number(node.getAttribute("cy"))]);
      entries.push({
        id,
        keepsBends: beamPoints.includes("52,18") && beamPoints.includes("52,82"),
        endpoints: [beamPoints[0], beamPoints.at(-1)],
        animation: getComputedStyle(surface.querySelector(".link-path-overlay__beam")).animationName,
        travelerPaths: travelers.map((node) => node.querySelector("animateMotion").getAttribute("path")),
        chainCenters,
      });
    }
    const poolSize = surface.querySelectorAll("[data-effect-decoration], [data-effect-matrix-digit], [data-effect-chain-link], [data-effect-route-traveler]").length;
    clearConnectionV2(surface);
    surface.remove();
    return { entries, poolSize };
  });
  expect(result.entries.every(({ endpoints }) => endpoints[0] === "8,18" && endpoints[1] === "92,82")).toBe(true);
  expect(result.entries.every(({ keepsBends }) => keepsBends)).toBe(true);
  expect(result.entries.find(({ id }) => id === "sonic").animation).toContain("link-sonic-pulse");
  expect(new Set(result.entries.filter(({ id }) => ["dashed", "bullet", "kame", "sonic", "meteor", "poison"].includes(id)).map(({ animation }) => animation)).size).toBe(6);
  for (const id of ["bullet", "meteor"]) {
    expect(result.entries.find((entry) => entry.id === id).travelerPaths).toEqual(
      expect.arrayContaining(["M8 18 L52 18 L52 82 L92 82"]),
    );
  }
  expect(result.entries.find(({ id }) => id === "chains").chainCenters.every((point) => (
    (Math.abs(point[1] - 18) < .001 && point[0] >= 8 && point[0] <= 52)
    || (Math.abs(point[0] - 52) < .001 && point[1] >= 18 && point[1] <= 82)
    || (Math.abs(point[1] - 82) < .001 && point[0] >= 52 && point[0] <= 92)
  ))).toBe(true);
  expect(result.poolSize).toBe(32);
});

test("Plasma stays smooth while Spiral coils around every legal routed segment", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const { getEffectV2Path } = await import("/js/effects/effectCatalog.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(surface);
    surface.getBoundingClientRect = () => ({ width: 360, height: 440 });
    const points = [{ x: 8, y: 18 }, { x: 52, y: 18 }, { x: 52, y: 82 }, { x: 92, y: 82 }];
    const read = (id) => {
      renderConnectionV2({ surface, points, effect: getEffectV2Path(id), seed: 3 });
      const rendered = surface.querySelector(".link-path-overlay__beam").getAttribute("points").trim().split(/\s+/);
      const firstRouteBend = rendered.indexOf("52,18");
      const firstSegment = rendered.slice(0, firstRouteBend + 1).map((value) => value.split(",").map(Number));
      return {
        count: rendered.length,
        startsAtSource: rendered[0] === "8,18",
        endsAtTarget: rendered.at(-1) === "92,82",
        keepsRouteBends: rendered.includes("52,18") && rendered.includes("52,82"),
        firstSegmentVerticalRange: Math.max(...firstSegment.map(([, y]) => y)) - Math.min(...firstSegment.map(([, y]) => y)),
        firstSegmentLoopsBackward: firstSegment.some(([x], pointIndex) => pointIndex > 0 && x < firstSegment[pointIndex - 1][0]),
        decorations: [...surface.querySelectorAll(".effect-v2-connection__decoration")]
          .filter(node => node.getAttribute("display") !== "none").length,
        children: surface.children.length,
      };
    };
    const plasma = read("plasma");
    const spiral = read("spiral");
    clearConnectionV2(surface);
    surface.remove();
    return { plasma, spiral };
  });
  expect(result.plasma.startsAtSource && result.plasma.endsAtTarget).toBe(true);
  expect(result.spiral.startsAtSource && result.spiral.endsAtTarget).toBe(true);
  expect(result.spiral.keepsRouteBends).toBe(true);
  expect(result.spiral.count).toBeGreaterThan(45);
  expect(result.spiral.firstSegmentVerticalRange).toBeGreaterThan(3);
  expect(result.spiral.firstSegmentLoopsBackward).toBe(true);
  expect(result.spiral.decorations).toBe(0);
  expect(result.spiral.children).toBe(3);
});

test("Matrix renders a bounded binary stream aligned to its exact route", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
    const { getEffectV2Path } = await import("/js/effects/effectCatalog.js");
    const { LINK_CONNECT_TIMING } = await import("/js/linkConnect/linkConfig.js");
    const surface = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.append(surface);
    surface.getBoundingClientRect = () => ({ width: 360, height: 440 });
    renderConnectionV2({
      surface,
      points: [{ x: 8, y: 16 }, { x: 76, y: 16 }, { x: 76, y: 84 }],
      effect: getEffectV2Path("matrix"),
      seed: 29,
    });
    const digits = [...surface.querySelectorAll(".effect-v2-connection__matrix-digit")]
      .filter(node => node.getAttribute("display") !== "none");
    const beam = surface.querySelector(".link-path-overlay__beam");
    const glow = surface.querySelector(".link-path-overlay__glow");
    const result = {
      count: digits.length,
      bits: digits.map(node => node.textContent),
      positions: digits.map(node => [Number(node.getAttribute("x")), Number(node.getAttribute("y"))]),
      lineDisplays: [getComputedStyle(beam).display, getComputedStyle(glow).display],
      matrixTiming: digits.map((node) => {
        const style = getComputedStyle(node);
        const toMs = (value) => value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
        return {
          duration: toMs(style.animationDuration),
          delay: toMs(style.animationDelay),
          iterations: style.animationIterationCount,
        };
      }),
      pathAnimationMs: LINK_CONNECT_TIMING.pathAnimationMs,
      children: surface.children.length,
    };
    clearConnectionV2(surface);
    surface.remove();
    return result;
  });
  expect(result.count).toBe(16);
  expect(result.bits.every(bit => bit === "0" || bit === "1")).toBe(true);
  expect(result.positions.every(([x, y]) => {
    const onHorizontalRoute = Math.abs(y - 16) < .001 && x >= 8 && x <= 76;
    const onVerticalRoute = Math.abs(x - 76) < .001 && y >= 16 && y <= 84;
    return onHorizontalRoute || onVerticalRoute;
  })).toBe(true);
  expect(result.lineDisplays).toEqual(["none", "none"]);
  expect(result.matrixTiming.every(({ iterations }) => iterations === "1")).toBe(true);
  expect(Math.max(...result.matrixTiming.map(({ duration, delay }) => duration + delay))).toBeLessThanOrEqual(result.pathAnimationMs);
  expect(result.children).toBe(3);
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
    return {
      maximum,
      children: surface?.children.length,
      corePaths: surface?.querySelectorAll(".link-path-overlay__glow, .link-path-overlay__beam").length,
    };
  });
  expect(result.maximum).toBe(1);
  expect(result.children).toBeLessThanOrEqual(4);
  expect(result.corePaths).toBe(2);
});
