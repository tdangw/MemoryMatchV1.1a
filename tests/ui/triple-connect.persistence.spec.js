import { expect, test } from "@playwright/test";

test("Triple development checkpoint restores after reload without undo history", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "persist" });
    for (const command of run.generated.witness) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
      await new Promise((resolve) => setTimeout(resolve, 280));
      if (run.getState().matchedTriples) break;
    }
    return { matched: run.getState().matchedTriples, score: run.getState().score };
  });
  expect(before).toEqual({ matched: 1, score: 10 });
  await page.reload();
  const restored = await page.evaluate(async () => {
    const { continueTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = continueTripleConnectDevelopmentRound();
    return { matched: run?.getState().matchedTriples, score: run?.getState().score, history: run?.getState().undoHistory.length };
  });
  expect(restored).toEqual({ matched: 1, score: 10, history: 0 });
});

test("Triple hidden pile Continue restores the revealed top and fixed asset mapping", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const { getExposedTileIds } = await import("/js/tripleConnect/tripleState.js");
    const run = startTripleConnectDevelopmentRound({ mode: "normal", seed: "persist-hidden-pile" });
    const current = run.getState();
    const pile = Object.values(current.cornerStacks).find((value) => getExposedTileIds(current).includes(value.tileIds.at(-1)));
    document.querySelector(`[data-tile-id="${pile.tileIds.at(-1)}"]`).click();
    await new Promise((resolve) => setTimeout(resolve, 280));
    const next = run.getState();
    return {
      revealedId: pile.tileIds.at(-2),
      exposed: getExposedTileIds(next),
      cornerStacks: next.cornerStacks,
      assets: next.assetPathsByType,
    };
  });
  expect(before.exposed).toContain(before.revealedId);
  await page.reload();
  const restored = await page.evaluate(async () => {
    const { continueTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const { getExposedTileIds } = await import("/js/tripleConnect/tripleState.js");
    const run = continueTripleConnectDevelopmentRound({ mode: "normal" });
    return { exposed: getExposedTileIds(run.getState()), cornerStacks: run.getState().cornerStacks, assets: run.getState().assetPathsByType };
  });
  expect(restored.exposed).toContain(before.revealedId);
  expect(restored.cornerStacks).toEqual(before.cornerStacks);
  expect(restored.assets).toEqual(before.assets);
});

test("Triple tray expansion persists once and applies immediately to the active round", async ({ page }) => {
  await page.goto("/");
  const purchased = await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    const { gameState } = await import("/js/gameState.js");
    const { purchaseTripleTrayExpansion } = await import("/js/tripleConnect/tripleTransactions.js");
    const run = controller.startTripleConnectDevelopmentRound({ seed: "expanded-tray" });
    gameState.coins = 3000;
    return { bought: purchaseTripleTrayExpansion(), capacity: run.getState().trayCapacity, owned: gameState.progress.tripleConnect.trayExpansionOwned };
  });
  expect(purchased).toEqual({ bought: true, capacity: 10, owned: true });
  await expect(page.locator(".triple-connect__tray")).toHaveAttribute("data-triple-tray-capacity", "10");
  await expect(page.locator(".triple-connect__tray-slot:not([hidden])")).toHaveCount(10);
  const trayMetrics = await page.locator(".triple-connect__tray-slot:not([hidden])").evaluateAll((slots) => {
    const rects = slots.map((slot) => slot.getBoundingClientRect());
    return {
      rows: new Set(rects.map((rect) => Math.round(rect.top))).size,
      heights: rects.map((rect) => Math.round(rect.height)),
    };
  });
  const viewport = page.viewportSize();
  const portraitGrid = viewport.width <= 520 && viewport.height > viewport.width;
  expect(trayMetrics.rows).toBe(portraitGrid ? 2 : 1);
  expect(new Set(trayMetrics.heights).size).toBe(1);
  if (portraitGrid) expect(trayMetrics.heights[0]).toBeGreaterThanOrEqual(40);
  await page.reload();
  const restored = await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    const run = controller.continueTripleConnectDevelopmentRound();
    return { capacity: run?.getState().trayCapacity, owned: (await import("/js/gameState.js")).gameState.progress.tripleConnect.trayExpansionOwned };
  });
  expect(restored).toEqual({ capacity: 10, owned: true });
});

test("Triple tray expansion is one-time and rolls back when persistence fails", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { purchaseTripleTrayExpansion } = await import("/js/tripleConnect/tripleTransactions.js");
    gameState.coins = 6000;
    gameState.progress.tripleConnect.trayExpansionOwned = false;
    const first = purchaseTripleTrayExpansion();
    const afterFirst = { coins: gameState.coins, owned: gameState.progress.tripleConnect.trayExpansionOwned };
    const duplicate = purchaseTripleTrayExpansion();
    const afterDuplicate = { coins: gameState.coins, owned: gameState.progress.tripleConnect.trayExpansionOwned };
    gameState.coins = 3000;
    gameState.progress.tripleConnect.trayExpansionOwned = false;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("storage unavailable"); };
    const failed = purchaseTripleTrayExpansion();
    Storage.prototype.setItem = originalSetItem;
    return {
      first,
      afterFirst,
      duplicate,
      afterDuplicate,
      failed,
      afterFailure: { coins: gameState.coins, owned: gameState.progress.tripleConnect.trayExpansionOwned },
    };
  });
  expect(result).toEqual({
    first: true,
    afterFirst: { coins: 3000, owned: true },
    duplicate: false,
    afterDuplicate: { coins: 3000, owned: true },
    failed: false,
    afterFailure: { coins: 3000, owned: false },
  });
});
