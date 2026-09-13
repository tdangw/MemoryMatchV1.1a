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
