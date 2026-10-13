import { expect, test } from "@playwright/test";

function parseTrayFlight(transform) {
  const match = String(transform).match(
    /translate\(([-\d.]+)px,\s*([-\d.]+)px\) scale\(([-\d.]+),\s*([-\d.]+)\)/,
  );
  if (!match) throw new Error(`Unexpected tray-flight transform: ${transform}`);
  return match.slice(1).map(Number);
}

test("Triple tray flight uses one surface coordinate space and scales to its slot", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const flight = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = await startTripleConnectDevelopmentRound({ seed: "tray-flight-geometry" });
    const surface = document.querySelector(".triple-connect__surface");
    const source = document.querySelector(".triple-connect__board .triple-connect__tile:not(:disabled)");
    const sourceRect = source.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    source.click();
    await run.whenIdle();
    const target = document.querySelector(".triple-connect__tray .triple-connect__tile");
    const ghost = document.querySelector(".triple-connect__tray-flight");
    const targetRect = target.getBoundingClientRect();
    const animation = ghost.getAnimations()[0];
    const keyframes = animation.effect.getKeyframes();
    await animation.finished.catch(() => {});
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return {
      source: sourceRect.toJSON(),
      surface: surfaceRect.toJSON(),
      target: targetRect.toJSON(),
      ghost: {
        left: Number.parseFloat(ghost.style.left),
        top: Number.parseFloat(ghost.style.top),
        width: Number.parseFloat(ghost.style.width),
        height: Number.parseFloat(ghost.style.height),
      },
      finalTransform: keyframes.at(-1).transform,
      transformOrigin: ghost.style.transformOrigin,
      targetOpacityAfter: target.style.opacity,
      ghostCountAfter: document.querySelectorAll(".triple-connect__tray-flight").length,
    };
  });
  const [dx, dy, scaleX, scaleY] = parseTrayFlight(flight.finalTransform);
  expect(flight.ghost.left).toBeCloseTo(flight.source.left - flight.surface.left, 2);
  expect(flight.ghost.top).toBeCloseTo(flight.source.top - flight.surface.top, 2);
  expect(flight.ghost.width).toBeCloseTo(flight.source.width, 2);
  expect(flight.ghost.height).toBeCloseTo(flight.source.height, 2);
  expect(flight.transformOrigin).toBe("left top");
  expect(dx).toBeCloseTo(flight.target.left - flight.source.left, 2);
  expect(dy).toBeCloseTo(flight.target.top - flight.source.top, 2);
  expect(scaleX).toBeCloseTo(flight.target.width / flight.source.width, 2);
  expect(scaleY).toBeCloseTo(flight.target.height / flight.source.height, 2);
  expect(flight.targetOpacityAfter).toBe("");
  expect(flight.ghostCountAfter).toBe(0);
});

test("Triple match commits before presentation and unmount cancels removal feedback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const witness = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    globalThis.__triplePresentationRun = (await startTripleConnectDevelopmentRound({ seed: "presentation" }));
    return globalThis.__triplePresentationRun.generated.witness.map(({ tileId }) => tileId);
  });
  for (const tileId of witness) {
    await page.locator(`[data-tile-id="${tileId}"]`).click();
    const matched = await page.evaluate(async () => { await globalThis.__triplePresentationRun.whenIdle(); return globalThis.__triplePresentationRun.getState().matchedTriples; });
    if (matched) break;
    await expect(page.locator('[data-triple-presenting="false"]')).toBeVisible();
  }
  await expect.poll(() => page.evaluate(() => globalThis.__triplePresentationRun.getState().matchedTriples)).toBe(1);
  await expect(page.locator(".triple-connect__tray [data-tile-id]")).toHaveCount(3);
  await expect(page.locator(".triple-connect__ghost.is-removing")).toHaveCount(3);
  await page.evaluate(async () => (await import("/js/gameShell/gameShell.js")).unmountActiveGameShell());
  await expect(page.locator(".triple-connect__ghost")).toHaveCount(0);
  await expect(page.locator(".triple-connect__line polyline")).toHaveCount(0);
});

test("Triple commits score state before its presentation lifecycle completes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const witness = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    globalThis.__triplePresentationRun = (await startTripleConnectDevelopmentRound({ seed: "score-anchor" }));
    return globalThis.__triplePresentationRun.generated.witness.map(({ tileId }) => tileId);
  });
  for (const tileId of witness) {
    await page.locator(`[data-tile-id="${tileId}"]`).click();
    if (await page.evaluate(async () => { await globalThis.__triplePresentationRun.whenIdle(); return globalThis.__triplePresentationRun.getState().matchedTriples; })) break;
    await expect(page.locator('[data-triple-presenting="true"]')).toBeVisible();
    await expect(page.locator('[data-triple-presenting="false"]')).toBeVisible();
  }
  const committed = await page.evaluate(() => {
    const state = globalThis.__triplePresentationRun.getState();
    return { matchedTriples: state.matchedTriples, score: state.score };
  });
  expect(committed.matchedTriples).toBe(1);
  expect(committed.score).toBeGreaterThan(0);
});

test("Triple commits a match immediately while its removal effect plays", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const timeline = await page.evaluate(async () => {
    const waitFor = (predicate, message) => new Promise((resolve, reject) => {
      const deadline = window.setTimeout(() => reject(new Error(message)), 2000);
      const check = () => {
        if (predicate()) {
          window.clearTimeout(deadline);
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = (await startTripleConnectDevelopmentRound({ seed: "tray-match-timeline" }));
    const matchIds = run.generated.witness.slice(0, 3).map((command) => command.tileId);
    for (const tileId of matchIds.slice(0, 2)) {
      document.querySelector(`[data-tile-id="${tileId}"]`)?.click();
      await run.whenIdle();
      await waitFor(
        () => document.querySelector('[data-triple-presenting="false"]'),
        "tray arrival did not settle",
      );
    }
    document.querySelector(`[data-tile-id="${matchIds[2]}"]`)?.click();
    await run.whenIdle();
    const beforeArrival = {
      flight: document.querySelectorAll(".triple-connect__tray-flight").length,
      removing: document.querySelectorAll(".triple-connect__ghost.is-removing").length,
      score: Boolean(document.querySelector(".tile-score-effect")),
    };
    await waitFor(
      () => document.querySelectorAll(".triple-connect__ghost.is-removing").length === 3,
      "removal feedback did not start",
    );
    const removalStarted = {
      score: Boolean(document.querySelector(".tile-score-effect")),
      ghosts: document.querySelectorAll(".triple-connect__ghost").length,
      removing: document.querySelectorAll(".triple-connect__ghost.is-removing").length,
      tray: document.querySelectorAll(".triple-connect__tray [data-tile-id]").length,
    };
    return {
      beforeArrival,
      removalStarted,
    };
  });
  expect(timeline.beforeArrival).toEqual({ flight: 1, removing: 0, score: false });
  expect(timeline.removalStarted).toEqual({ score: true, ghosts: 3, removing: 3, tray: 3 });
});

test("Triple flies the third matching card beside its pair, not to the tray end", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const landing = await page.evaluate(async () => {
    const waitForIdle = () => new Promise((resolve, reject) => {
      const deadline = window.setTimeout(() => reject(new Error("tray flight did not settle")), 2000);
      const check = () => {
        if (document.querySelector('[data-triple-presenting="false"]')) {
          window.clearTimeout(deadline);
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = (await startTripleConnectDevelopmentRound({ seed: "tray-match-insert" }));
    const matchIds = run.generated.witness.slice(0, 3).map(({ tileId }) => tileId);
    document.querySelector(`[data-tile-id="${matchIds[0]}"]`)?.click();
    await run.whenIdle();
    await waitForIdle();
    const other = [...document.querySelectorAll(".triple-connect__board .triple-connect__tile:not(:disabled)")]
      .find((tile) => !matchIds.includes(tile.dataset.tileId));
    const otherId = other?.dataset.tileId;
    other?.click();
    await run.whenIdle();
    await waitForIdle();
    document.querySelector(`[data-tile-id="${matchIds[1]}"]`)?.click();
    await run.whenIdle();
    await waitForIdle();
    document.querySelector(`[data-tile-id="${matchIds[2]}"]`)?.click();
    await run.whenIdle();
    await new Promise((resolve, reject) => {
      const deadline = window.setTimeout(() => reject(new Error("match feedback did not begin")), 2000);
      const check = () => {
        if (document.querySelectorAll(".triple-connect__ghost.is-removing").length === 3) {
          window.clearTimeout(deadline);
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
    const surface = document.querySelector(".triple-connect__surface").getBoundingClientRect();
    const slot = document.querySelectorAll(".triple-connect__tray-slot")[2].getBoundingClientRect();
    const selected = document.querySelector(`.triple-connect__ghost[data-tile-id="${matchIds[2]}"]`);
    return {
      left: Number.parseFloat(selected.style.left),
      top: Number.parseFloat(selected.style.top),
      width: Number.parseFloat(selected.style.width),
      height: Number.parseFloat(selected.style.height),
      otherSlot: document.querySelector(`[data-tile-id="${otherId}"]`)
        ?.closest("[data-triple-tray-slot]")?.dataset.tripleTraySlot,
      expected: {
        left: slot.left - surface.left,
        top: slot.top - surface.top,
        width: slot.width,
        height: slot.height,
      },
    };
  });
  expect(landing.left).toBeCloseTo(landing.expected.left, 1);
  expect(landing.top).toBeCloseTo(landing.expected.top, 1);
  expect(landing.width).toBeCloseTo(landing.expected.width, 1);
  expect(landing.height).toBeCloseTo(landing.expected.height, 1);
  expect(landing.otherSlot).toBe("3");
});

test("Triple reduced motion settles to the same committed match without ghosts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = (await startTripleConnectDevelopmentRound({ seed: "reduced" }));
    for (const command of run.generated.witness) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
      await run.whenIdle();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (run.getState().matchedTriples) break;
    }
    return run.getState().matchedTriples;
  });
  expect(result).toBe(1);
  await expect(page.locator(".triple-connect__ghost, .triple-connect__line polyline")).toHaveCount(0);
});

test("Triple reduced-motion tray feedback cleans up within the 100 ms budget", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const elapsed = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = await startTripleConnectDevelopmentRound({ seed: "reduced-tray-budget" });
    const source = document.querySelector(".triple-connect__board .triple-connect__tile:not(:disabled)");
    const startedAt = performance.now();
    source.click();
    await run.whenIdle();
    await new Promise((resolve, reject) => {
      const deadline = window.setTimeout(() => reject(new Error("tray feedback did not settle")), 200);
      const check = () => {
        if (!document.querySelector(".triple-connect__tray .is-tray-arrived")) {
          window.clearTimeout(deadline);
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
    return performance.now() - startedAt;
  });
  expect(elapsed).toBeLessThanOrEqual(110);
  await expect(page.locator(".triple-connect__tray-flight, .triple-connect__ghost")).toHaveCount(0);
});

test("Triple accepts a second tap while a tray flight is presenting", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = (await startTripleConnectDevelopmentRound({ seed: "flight-input-lock" }));
    const tiles = [...document.querySelectorAll(".triple-connect__board .triple-connect__tile:not(:disabled)")];
    tiles[0].click();
    await run.whenIdle();
    tiles[1].click();
    await run.whenIdle();
    const duringFlight = {
      moves: run.getState().moves,
      misses: run.getState().misses,
    };
    await new Promise((resolve) => setTimeout(resolve, 340));
    tiles[1].click();
    await run.whenIdle();
    return {
      duringFlight,
      afterFlight: {
        moves: run.getState().moves,
        misses: run.getState().misses,
      },
    };
  });
  expect(result.duringFlight).toEqual({ moves: 2, misses: 0 });
  expect(result.afterFlight.moves).toBe(2);
});

test("Triple tray flights clean up across repeated mount cycles", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    const shellApi = await import("/js/gameShell/gameShell.js");
    for (let index = 0; index < 20; index += 1) {
      (await controller.startTripleConnectDevelopmentRound({ seed: `flight-cleanup-${index}` }));
      document.querySelector(".triple-connect__board .triple-connect__tile:not(:disabled)")?.click();
      shellApi.unmountActiveGameShell();
    }
    return {
      ghosts: document.querySelectorAll(".triple-connect__ghost").length,
      paths: document.querySelectorAll(".triple-connect__line polyline").length,
      diagnostics: shellApi.getGameShellDiagnostics(),
    };
  });
  expect(result.ghosts).toBe(0);
  expect(result.paths).toBe(0);
  expect(result.diagnostics.activeShell).toBeNull();
});
