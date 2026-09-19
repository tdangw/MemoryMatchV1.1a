import { expect, test } from "@playwright/test";

test("Triple match commits before presentation and unmount cancels ghosts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "presentation" });
    const byType = {};
    for (const command of run.generated.witness) {
      const node = document.querySelector(`[data-tile-id="${command.tileId}"]`);
      node.click();
      if (run.getState().matchedTriples) break;
      await new Promise((resolve) => setTimeout(resolve, 320));
    }
    return { matched: run.getState().matchedTriples, shell: run.shell.refs.root.id };
  });
  expect(result.matched).toBe(1);
  await expect(page.locator(".triple-connect__line polyline")).toHaveCount(2);
  await page.evaluate(async () => (await import("/js/gameShell/gameShell.js")).unmountActiveGameShell());
  await expect(page.locator(".triple-connect__ghost")).toHaveCount(0);
  await expect(page.locator(".triple-connect__line polyline")).toHaveCount(0);
});

test("Triple reduced motion settles to the same committed match without ghosts", async ({ page }) => {
  await page.goto("/");
  const matched = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "reduced" });
    for (const command of run.generated.witness) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
      await new Promise((resolve) => setTimeout(resolve, 240));
      if (run.getState().matchedTriples) break;
    }
    return run.getState().matchedTriples;
  });
  expect(matched).toBe(1);
  await expect(page.locator(".triple-connect__ghost, .triple-connect__line polyline")).toHaveCount(0);
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
    await new Promise((resolve) => setTimeout(resolve, 260));
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
