import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 360, height: 640 }, { width: 411, height: 914 }, { width: 640, height: 360 }, { width: 914, height: 411 }]) {
  test(`Triple development slice keeps one keyed board at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".game-selector__choice")).toHaveCount(2);
    await page.evaluate(async () => (await import("/js/tripleConnect/tripleController.js")).startTripleConnectDevelopmentRound({ seed: "ui" }));
    await expect(page.locator("#triple-connect-container")).toBeVisible();
    await expect(page.locator(".triple-connect__board .triple-connect__tile")).toHaveCount(12);
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

for (const [mode, tileCount] of [["normal", 24], ["hard", 36], ["superHard", 60], ["endless", 60]]) {
  test(`Triple ${mode} development round uses its own board layout`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async ({ selectedMode }) => {
      const controller = await import("/js/tripleConnect/tripleController.js");
      controller.startTripleConnectDevelopmentRound({ mode: selectedMode, seed: `layout-${selectedMode}` });
    }, { selectedMode: mode });
    await expect(page.locator(".triple-connect__board .triple-connect__tile")).toHaveCount(tileCount);
  });
}

test("Triple Hint consumes one persisted hint only after identifying playable tiles", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    controller.startTripleConnectDevelopmentRound({ seed: "hint" });
  });
  const hint = page.locator('[data-triple-item="hint"]');
  await expect(hint).toContainText("3");
  await hint.click();
  await expect(hint).toContainText("2");
  await expect(page.locator(".triple-connect__tile.is-hinted")).toHaveCount(2);
});

test("Triple timers count down normally and up in Endless", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    controller.startTripleConnectDevelopmentRound({ seed: "timer", mode: "easy" });
  });
  await expect(page.locator("[data-triple-timer]")).toHaveText("00:59", { timeout: 2500 });
  await page.evaluate(async () => {
    const controller = await import("/js/tripleConnect/tripleController.js");
    controller.startTripleConnectDevelopmentRound({ seed: "endless-timer", mode: "endless" });
  });
  await expect(page.locator("[data-triple-timer]")).toHaveText("00:01", { timeout: 2500 });
});
