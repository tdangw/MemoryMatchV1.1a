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
    const run = await continueTripleConnectDevelopmentRound();
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
    const run = await continueTripleConnectDevelopmentRound({ mode: "normal" });
    return { exposed: getExposedTileIds(run.getState()), cornerStacks: run.getState().cornerStacks, assets: run.getState().assetPathsByType };
  });
  expect(restored.exposed).toContain(before.revealedId);
  expect(restored.cornerStacks).toEqual(before.cornerStacks);
  expect(restored.assets).toEqual(before.assets);
});

test("Triple tray expansion purchases one slot at a time and applies immediately to the active round", async ({ page }) => {
  await page.goto("/");
  const purchased = await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    const { gameState } = await import("/js/gameState.js");
    const { purchaseTripleTrayExpansion } = await import("/js/tripleConnect/tripleTransactions.js");
    const run = controller.startTripleConnectDevelopmentRound({ seed: "expanded-tray" });
    gameState.coins = 9000;
    const purchases = [];
    for (let slot = 1; slot <= 3; slot += 1) {
      purchases.push({
        bought: purchaseTripleTrayExpansion(),
        capacity: run.getState().trayCapacity,
        slots: gameState.progress.tripleConnect.trayExpansionSlots,
        coins: gameState.coins,
      });
    }
    return { purchases, owned: gameState.progress.tripleConnect.trayExpansionOwned };
  });
  expect(purchased).toEqual({
    purchases: [
      { bought: true, capacity: 8, slots: 1, coins: 6000 },
      { bought: true, capacity: 9, slots: 2, coins: 3000 },
      { bought: true, capacity: 10, slots: 3, coins: 0 },
    ],
    owned: true,
  });
  await expect(page.locator(".triple-connect__tray")).toHaveAttribute("data-triple-tray-capacity", "10");
  await expect(page.locator(".triple-connect__tray-slot")).toHaveCount(10);
  await expect(page.locator('[data-triple-tray-locked="true"]')).toHaveCount(0);
  const trayMetrics = await page.locator(".triple-connect__tray-slot").evaluateAll((slots) => {
    const rects = slots.map((slot) => slot.getBoundingClientRect());
    return {
      rows: new Set(rects.map((rect) => Math.round(rect.top))).size,
      heights: rects.map((rect) => Math.round(rect.height)),
    };
  });
  expect(trayMetrics.rows).toBe(1);
  expect(new Set(trayMetrics.heights).size).toBe(1);
  await page.reload();
  const restored = await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    const run = await controller.continueTripleConnectDevelopmentRound();
    const { gameState } = await import("/js/gameState.js");
    return { capacity: run?.getState().trayCapacity, slots: gameState.progress.tripleConnect.trayExpansionSlots, owned: gameState.progress.tripleConnect.trayExpansionOwned };
  });
  expect(restored).toEqual({ capacity: 10, slots: 3, owned: true });
});

test("Triple tray expansion stops at three slots and rolls back when persistence fails", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { purchaseTripleTrayExpansion } = await import("/js/tripleConnect/tripleTransactions.js");
    gameState.coins = 12000;
    gameState.progress.tripleConnect.trayExpansionSlots = 0;
    gameState.progress.tripleConnect.trayExpansionOwned = false;
    const first = purchaseTripleTrayExpansion();
    const second = purchaseTripleTrayExpansion();
    const third = purchaseTripleTrayExpansion();
    const afterThird = { coins: gameState.coins, slots: gameState.progress.tripleConnect.trayExpansionSlots, owned: gameState.progress.tripleConnect.trayExpansionOwned };
    const fourth = purchaseTripleTrayExpansion();
    const afterFourth = { coins: gameState.coins, slots: gameState.progress.tripleConnect.trayExpansionSlots, owned: gameState.progress.tripleConnect.trayExpansionOwned };
    gameState.coins = 3000;
    gameState.progress.tripleConnect.trayExpansionSlots = 0;
    gameState.progress.tripleConnect.trayExpansionOwned = false;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("storage unavailable"); };
    const failed = purchaseTripleTrayExpansion();
    Storage.prototype.setItem = originalSetItem;
    return {
      first,
      second,
      third,
      afterThird,
      fourth,
      afterFourth,
      failed,
      afterFailure: { coins: gameState.coins, slots: gameState.progress.tripleConnect.trayExpansionSlots, owned: gameState.progress.tripleConnect.trayExpansionOwned },
    };
  });
  expect(result).toEqual({
    first: true,
    second: true,
    third: true,
    afterThird: { coins: 3000, slots: 3, owned: true },
    fourth: false,
    afterFourth: { coins: 3000, slots: 3, owned: true },
    failed: false,
    afterFailure: { coins: 3000, slots: 0, owned: false },
  });
});

test("Triple opens the tray expansion purchase directly from a locked slot", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    gameState.coins = 3000;
    startTripleConnectDevelopmentRound({ seed: "tray-direct-purchase" });
  });

  const unlock = page.locator('[data-triple-tray-unlock="true"]:visible').first();
  await expect(unlock).toHaveAccessibleName("Mở thêm 1 ô khay với 3000 Xu");
  await unlock.click();
  await expect(page.locator("#shop-confirm-modal")).toContainText(
    "Mở thêm 1 ô khay",
  );
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await expect(page.locator("#shop-confirm-modal")).toHaveCount(0);
  await expect(page.locator(".triple-connect__tray")).toHaveAttribute(
    "data-triple-tray-capacity",
    "8",
  );
  await expect(page.locator('[data-triple-tray-locked="true"]')).toHaveCount(2);
});

test("Triple legacy tray expansion save keeps all three unlocked slots", async ({ page }) => {
  await page.goto("/");
  const migrated = await page.evaluate(async () => {
    const { gameState, hydrateGameState } = await import("/js/gameState.js");
    hydrateGameState({ progress: { tripleConnect: { trayExpansionOwned: true } } });
    return {
      slots: gameState.progress.tripleConnect.trayExpansionSlots,
      owned: gameState.progress.tripleConnect.trayExpansionOwned,
    };
  });
  expect(migrated).toEqual({ slots: 3, owned: true });
});
