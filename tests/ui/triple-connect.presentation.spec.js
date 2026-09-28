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
  const flight = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    startTripleConnectDevelopmentRound({ seed: "tray-flight-geometry" });
    const surface = document.querySelector(".triple-connect__surface");
    const source = document.querySelector(".triple-connect__board .triple-connect__tile:not(:disabled)");
    const sourceRect = source.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    source.click();
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

test("Triple match commits before presentation and unmount cancels the tray preview", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const witness = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    globalThis.__triplePresentationRun = startTripleConnectDevelopmentRound({ seed: "presentation" });
    return globalThis.__triplePresentationRun.generated.witness.map(({ tileId }) => tileId);
  });
  for (const tileId of witness) {
    await page.locator(`[data-tile-id="${tileId}"]`).click();
    const matched = await page.evaluate(() => globalThis.__triplePresentationRun.getState().matchedTriples);
    if (matched) break;
    await expect(page.locator('[data-triple-presenting="false"]')).toBeVisible();
  }
  await expect.poll(() => page.evaluate(() => globalThis.__triplePresentationRun.getState().matchedTriples)).toBe(1);
  await expect(page.locator(".triple-connect__tray [data-tile-id]")).toHaveCount(3);
  await page.evaluate(async () => (await import("/js/gameShell/gameShell.js")).unmountActiveGameShell());
  await expect(page.locator(".triple-connect__ghost")).toHaveCount(0);
  await expect(page.locator(".triple-connect__line polyline")).toHaveCount(0);
});

test("Triple commits score state before its presentation lifecycle completes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const witness = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    globalThis.__triplePresentationRun = startTripleConnectDevelopmentRound({ seed: "score-anchor" });
    return globalThis.__triplePresentationRun.generated.witness.map(({ tileId }) => tileId);
  });
  for (const tileId of witness) {
    await page.locator(`[data-tile-id="${tileId}"]`).click();
    if (await page.evaluate(() => globalThis.__triplePresentationRun.getState().matchedTriples)) break;
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

test("Triple shows the complete tray match before exit and compaction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
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
    const run = startTripleConnectDevelopmentRound({ seed: "tray-match-timeline" });
    const matchIds = run.generated.witness.slice(0, 3).map((command) => command.tileId);
    for (const tileId of matchIds.slice(0, 2)) {
      document.querySelector(`[data-tile-id="${tileId}"]`)?.click();
      await waitFor(
        () => document.querySelector('[data-triple-presenting="false"]'),
        "tray arrival did not settle",
      );
    }
    document.querySelector(`[data-tile-id="${matchIds[2]}"]`)?.click();
    await waitFor(
      () => {
        const trayIds = [...document.querySelectorAll(".triple-connect__tray [data-tile-id]")]
          .map((tile) => tile.dataset.tileId);
        return matchIds.every((tileId) => trayIds.includes(tileId));
      },
      "complete tray match did not render",
    );
    const trayBeforeExit = [...document.querySelectorAll(".triple-connect__tray [data-tile-id]")]
      .map((tile) => tile.dataset.tileId);
    const scoreBeforeExit = Boolean(document.querySelector(".tile-score-effect"));
    await waitFor(
      () => Boolean(document.querySelector(".tile-score-effect")),
      "exit feedback did not start",
    );
    const exitStarted = {
      score: Boolean(document.querySelector(".tile-score-effect")),
      ghosts: document.querySelectorAll(".triple-connect__ghost").length,
    };
    await waitFor(
      () => document.querySelectorAll(".triple-connect__tray [data-tile-id]").length === 0,
      "tray compaction did not finish",
    );
    return {
      matchIds,
      trayBeforeExit,
      scoreBeforeExit,
      exitStarted,
      trayAfterExit: document.querySelectorAll(".triple-connect__tray [data-tile-id]").length,
    };
  });
  expect(timeline.trayBeforeExit).toEqual(expect.arrayContaining(timeline.matchIds));
  expect(timeline.scoreBeforeExit).toBe(false);
  expect(timeline.exitStarted).toEqual({ score: true, ghosts: 3 });
  expect(timeline.trayAfterExit).toBe(0);
});

test("Triple reduced motion settles to the same committed match without ghosts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "reduced" });
    for (const command of run.generated.witness) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
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
  const elapsed = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    startTripleConnectDevelopmentRound({ seed: "reduced-tray-budget" });
    const source = document.querySelector(".triple-connect__board .triple-connect__tile:not(:disabled)");
    const startedAt = performance.now();
    source.click();
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

test("Triple ignores a second tap while a tray flight is presenting", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "flight-input-lock" });
    const tiles = [...document.querySelectorAll(".triple-connect__board .triple-connect__tile:not(:disabled)")];
    tiles[0].click();
    tiles[1].click();
    const duringFlight = {
      moves: run.getState().moves,
      misses: run.getState().misses,
    };
    await new Promise((resolve) => setTimeout(resolve, 340));
    tiles[1].click();
    return {
      duringFlight,
      afterFlight: {
        moves: run.getState().moves,
        misses: run.getState().misses,
      },
    };
  });
  expect(result.duringFlight).toEqual({ moves: 1, misses: 0 });
  expect(result.afterFlight.moves).toBe(2);
});

test("Triple tray flights clean up across repeated mount cycles", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    const shellApi = await import("/js/gameShell/gameShell.js");
    for (let index = 0; index < 20; index += 1) {
      controller.startTripleConnectDevelopmentRound({ seed: `flight-cleanup-${index}` });
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
