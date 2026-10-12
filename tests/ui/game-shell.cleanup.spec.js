import { expect, test } from "@playwright/test";

async function startMemory(page, { clock = false } = {}) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  if (clock) await page.clock.install();
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.sound = gameState.settings.music = false;
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("memory-match");
    await (await import("/js/gameController.js")).startNewMemoryRun(7);
  });
}

test("defeat navigation cleanup preserves the session captured before menu reset", async ({ page }) => {
  await startMemory(page, { clock: true });
  await page.clock.runFor(8000);
  await page.evaluate(async () => { (await import("/js/gameState.js")).gameState.remainingTime = 1; });
  await page.clock.runFor(1100);
  await expect(page.locator("#time-up-modal")).toBeVisible();
  const snapshot = () => page.evaluate(async () => structuredClone((await import("/js/sessionProgress.js")).getActiveSession("memory-match", "easy")));
  const before = await snapshot();
  expect(before.level).toBe(7);
  expect(before.remainingTime).toBe(0, "An expired board must not retain a positive checkpoint time.");
  await page.locator("#time-up-modal").getByRole("button", { name: "Về Menu" }).click();
  await expect(page.locator("#game-container")).toBeHidden();
  expect(await snapshot()).toEqual(before);
});

test("clearing settled loot cancels its filled animation and pending collection", async ({ page }) => {
  await startMemory(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(async () => {
    window.lootLanded = false;
    window.lootCollected = false;
    const element = (await import("/js/lootEffects.js")).playLootDrop(document.querySelector(".tile"), {
      holdMs: 10000,
      onSettled: () => { window.lootLanded = true; },
      onCollected: () => { window.lootCollected = true; },
    });
    window.lootAnimation = element.getAnimations()[0];
  });
  await page.waitForFunction(() => window.lootLanded);
  await page.evaluate(async () => (await import("/js/lootEffects.js")).clearLootEffects());
  expect(await page.evaluate(() => window.lootAnimation.playState)).toBe("idle");
  await expect(page.locator(".game-loot-drop")).toHaveCount(0);
  expect(await page.evaluate(() => window.lootCollected)).toBe(false);
});
