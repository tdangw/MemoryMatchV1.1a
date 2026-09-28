import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 360, height: 640 }, { width: 411, height: 914 }, { width: 640, height: 360 }, { width: 914, height: 411 }]) {
  test(`Triple development slice keeps one keyed board at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".game-selector__choice")).toHaveCount(3);
    await page.evaluate(async () => (await import("/js/tripleConnect/tripleController.js")).startTripleConnectDevelopmentRound({ seed: "ui" }));
    await expect(page.locator("#triple-connect-container")).toBeVisible();
    await expect(page.locator(".triple-connect__board .triple-connect__tile")).toHaveCount(27);
    const state = await page.evaluate(async () => {
      const controller = await import("/js/tripleConnect/tripleController.js");
      const run = controller.startTripleConnectDevelopmentRound({ seed: "interaction" });
      const first = document.querySelector(".triple-connect__board .triple-connect__tile:not(:disabled)");
      first.click();
      return run.getState();
    });
    expect(state.tray).toHaveLength(1);
  });
}

for (const [mode, visibleTileCount, totalTileCount] of [["normal", 46, 54], ["hard", 65, 78], ["superHard", 100, 120], ["endless", 100, 120]]) {
  test(`Triple ${mode} development round uses its own board layout`, async ({ page }) => {
    await page.goto("/");
    const state = await page.evaluate(async ({ selectedMode }) => {
      const controller = await import("/js/tripleConnect/tripleController.js");
      return controller.startTripleConnectDevelopmentRound({ mode: selectedMode, seed: `layout-${selectedMode}` }).getState();
    }, { selectedMode: mode });
    await expect(page.locator(".triple-connect__board .triple-connect__tile")).toHaveCount(visibleTileCount);
    expect(Object.keys(state.tiles)).toHaveLength(totalTileCount);
  });
}

test("Triple hidden pile keeps hidden identities out of DOM and reveals its next card", async ({ page }) => {
  await page.goto("/");
  const pile = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const { getExposedTileIds } = await import("/js/tripleConnect/tripleState.js");
    const run = startTripleConnectDevelopmentRound({ mode: "normal", seed: "hidden-pile" });
    const exposed = new Set(getExposedTileIds(run.getState()));
    const entry = Object.entries(run.getState().cornerStacks).find(([, value]) => exposed.has(value.tileIds.at(-1)));
    return { pileId: entry[0], hiddenId: entry[1].tileIds[0], nextId: entry[1].tileIds.at(-2), topId: entry[1].tileIds.at(-1), total: Object.keys(run.getState().tiles).length };
  });
  expect(pile.total).toBe(54);
  await expect(page.locator(`[data-tile-id="${pile.hiddenId}"]`)).toHaveCount(0);
  await page.locator(`[data-tile-id="${pile.topId}"]`).click();
  await expect(page.locator(`[data-tile-id="${pile.nextId}"]`)).toHaveCount(1);
});

test("Triple Hint consumes one persisted hint only after identifying playable tiles", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    controller.startTripleConnectDevelopmentRound({ seed: "hint" });
  });
  await page.locator("#triple-tools-toggle").click();
  const hint = page.locator('[data-triple-item="hint"]');
  await expect(hint).toContainText("3");
  await hint.click();
  await expect(hint).toContainText("2");
  await expect(page.locator(".triple-connect__tile.is-hinted")).toHaveCount(3);
  await page.waitForTimeout(1200);
  await expect(page.locator(".triple-connect__tile.is-hinted")).toHaveCount(3);
});

test("Triple timers count down normally and up in Endless", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    controller.startTripleConnectDevelopmentRound({ seed: "timer", mode: "easy" });
  });
  await expect(page.locator("[data-triple-timer]")).toHaveText("01:32", { timeout: 2500 });
  await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    controller.startTripleConnectDevelopmentRound({ seed: "endless-timer", mode: "endless" });
  });
  await expect(page.locator("[data-triple-timer]")).toHaveText("00:01", { timeout: 2500 });
});

test("Triple Undo restores the exact last stable selection", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    const { grantTripleItem } = await import("/js/tripleConnect/tripleItems.js");
    controller.startTripleConnectDevelopmentRound({ seed: "undo" });
    grantTripleItem("undo");
    document.querySelector(".triple-connect__board .triple-connect__tile:not(:disabled)").click();
  });
  await expect(page.locator(".triple-connect__tray .triple-connect__tile")).toHaveCount(1);
  await page.evaluate(() => document.querySelector('[data-triple-item="undo"]').click());
  await expect(page.locator(".triple-connect__tray .triple-connect__tile")).toHaveCount(0);
});

test("Triple clears completed line animations before the next resolved triple", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "exit-cleanup" });
    for (const command of run.generated.witness.slice(0, 6)) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    const line = document.querySelector(".triple-connect__line");
    return { matched: run.getState().matchedTriples, animations: line.getAnimations().length, visible: line.classList.contains("is-visible") };
  });
  expect(result).toEqual({ matched: 2, animations: 0, visible: false });
});
