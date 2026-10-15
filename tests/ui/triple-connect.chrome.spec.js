import { startMapLevel, previewMapLevel, closeLevelPreview } from './helpers/adventureNavigation.js';
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await page.locator(".game-selector__choice").filter({ hasText: "Triple Connect" }).click();
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
});
async function finishTripleIntro(page, clock = null) {
  const intro = page.locator("#triple-round-start-modal");
  if (!(await intro.count())) return;
  if (clock) await clock.fastForward(2500);
  else await expect(intro).toHaveCount(0, { timeout: 4000 });
}

test('Triple map previews normal modes and keeps theme access in the shared collection dock', async ({ page }) => {
  await expect(page.locator('.adventure-map-theme, .adventure-map-play, .adventure-map-sessions')).toHaveCount(0);
  await previewMapLevel(page, 1, 'hard');
  await expect(page.locator('.adventure-level-modes label')).toHaveText(['C', 'B', 'A', 'S']);
  await closeLevelPreview(page);
  await page.locator('[data-dock-action="collection"]').click();
  await expect(page.locator('#collection-modal')).toContainText('Bộ sưu tập');
  await page.locator('.adventure-screen [data-dock-action="map"]').click();
  await expect(page.locator('#collection-modal')).toHaveCount(0);
  await previewMapLevel(page);
  await expect(page.locator('#adventure-level-modal input[value="hard"]')).toBeChecked();
  await closeLevelPreview(page);
  await expect(page.locator('.adventure-map-node--level')).toHaveCount(100);
});

test('visiting the map and collection preserves a session until the player explicitly starts a new board', async ({ page }) => {
  const oldSeed = await page.evaluate(async () => {
    await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'normal', level: 1, seed: 'chrome-session', skipIntro: true });
    const { getActiveSession } = await import('/js/sessionProgress.js');
    const seed = getActiveSession('triple-connect', 'normal').seed;
    (await import('/js/gameSelector.js')).openGameMenu('triple-connect');
    return seed;
  });
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  await page.locator('[data-dock-action="collection"]').click();
  await page.locator('.adventure-screen [data-dock-action="map"]').click();
  await expect(page.locator('#collection-modal')).toHaveCount(0);
  expect(await page.evaluate(async () => (await import('/js/sessionProgress.js')).getActiveSession('triple-connect','normal').seed)).toBe(oldSeed);
  await startMapLevel(page, 1, 'normal');
  await finishTripleIntro(page);
  await expect.poll(() => page.evaluate(async () => (await import('/js/sessionProgress.js')).getActiveSession('triple-connect','normal')?.seed)).not.toBe(oldSeed);
});

test("Triple HUD uses the shared contract and mutually exclusive menus", async ({ page }) => {
  await startMapLevel(page);
  await finishTripleIntro(page);
  const shell = page.locator(".triple-connect-game");
  const progress = page.locator(".triple-connect__milestones .stat-star-progress");
  if (await shell.evaluate((node) => node.classList.contains("shell-compact-landscape"))) {
    // Compact landscape uses the shared shell contract: progress chrome is
    // hidden to preserve the board, while level/timer/tools remain in the HUD.
    await expect(progress).toBeHidden();
  } else {
    await expect(progress).toBeVisible();
  }
  await expect(page.locator(".triple-game-hud .stat-points")).toContainText("0");
  await expect(page.locator(".triple-game-hud .stat-timer")).toContainText(/0[01]:\d{2}/);
  await expect(page.locator(".triple-game-hud")).toHaveCSS(
    "background-image",
    /linear-gradient/,
  );
  await page.locator("#triple-actions-menu-toggle").click();
  await expect(page.locator('#game-exit-modal')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#game-exit-modal')).toHaveCount(0);
  await page.locator("#triple-tools-toggle").click();
  await expect(page.locator('#game-exit-modal')).toHaveCount(0);
  await expect(page.locator("#triple-tools-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#triple-tools-menu")).toBeHidden();
});

test("Triple uses the shared score and combo feedback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    window.__tripleFeedbackRun = await startTripleConnectRound({
      mode: "easy",
      seed: "shared-score-combo",
      skipIntro: true,
    });
  });
  const witness = await page.evaluate(() =>
    window.__tripleFeedbackRun.generated.witness.slice(0, 6),
  );
  for (const [index, command] of witness.entries()) {
    await page.locator(`[data-tile-id="${command.tileId}"]`).click();
    await page.waitForFunction(() =>
      document.querySelector("#triple-connect-container")?.dataset.triplePresenting === "false",
    );
    if (index === 2)
      await expect(page.locator(".tile-score-effect").last()).toContainText(/\+\d+ điểm/);
  }
  await expect(page.locator(".tile-score-effect").last()).toContainText(/\+\d+ điểm/);
  await expect(page.locator(".tile-combo-effect")).toContainText(/x2/);
});

test("Triple combo bar counts down and expires the active combo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    window.__tripleComboRun = await startTripleConnectRound({
      mode: "easy",
      seed: "combo-window-expiry",
      skipIntro: true,
    });
  });
  const witness = await page.evaluate(() => window.__tripleComboRun.generated.witness.slice(0, 3));
  for (const command of witness) await page.locator(`[data-tile-id="${command.tileId}"]`).click();

  const combo = page.locator('#triple-connect-container [data-triple-stat="combo"]');
  const progress = page.locator("#triple-connect-container .combo-window-progress");
  await expect(combo).toHaveText("1");
  await expect(progress).toHaveCount(1);
  await expect(progress).toHaveCSS("opacity", "1");
  await page.clock.fastForward(19_000);
  await expect(combo).toHaveText("1");
  await page.clock.fastForward(1_100);
  await expect(combo).toHaveText("0");
  await expect(progress).toHaveCSS("opacity", "0");
  await expect(progress).toHaveCount(1);
});

test("Triple menu, start modal and timer follow the shared round contract", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator('[data-dock-action]')).toHaveText(['Cửa hàng', 'Bộ sưu tập', 'Bản đồ', 'Xếp hạng', 'Cài đặt']);
  await page.evaluate(async () => (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ mode: "easy", level: 1 }));
  const start = page.locator("#triple-round-start-modal");
  await expect(start).toContainText(/Màn 1.*Dễ.*Chủ đề.*Mục tiêu: 9 bộ thẻ.*Gợi ý: 3/s);
  const timer = page.locator("[data-triple-timer]");
  const before = await timer.textContent();
  await page.waitForTimeout(1100);
  await expect(timer).toHaveText(before || "01:00");
  await finishTripleIntro(page);
  const timerProgress = page.locator(".triple-game-hud");
  const transitionDuration = await timerProgress.evaluate((node) =>
    getComputedStyle(node, "::after").transitionDuration,
  );
  expect(transitionDuration).toBe("0.25s");
  const progressBefore = Number(await timerProgress.evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--game-timer-progress"),
  ));
  await page.waitForTimeout(300);
  const progressAfter = Number(await timerProgress.evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--game-timer-progress"),
  ));
  expect(progressAfter).toBeLessThan(progressBefore);
  await page.waitForTimeout(1100);
  await expect(timer).not.toHaveText(before || "01:00");
  await page.locator("#triple-actions-menu-toggle").click();
  await expect(page.locator('#game-exit-modal .app-modal__footer button')).toHaveText(['Tiếp tục', 'Chơi lại', 'Cài đặt', 'Thoát game']);
});

test("Triple Continue resumes without replaying the start modal", async ({ page }) => {
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    await startTripleConnectRound({ mode: "easy", seed: "continue-no-intro" });
  });
  await finishTripleIntro(page);
  await page.evaluate(async () => {
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const { continueTripleConnectSession } = await import("/js/tripleConnect/tripleController.js");
    await continueTripleConnectSession(getActiveSession("triple-connect", "easy"));
  });
  await expect(page.locator("#triple-round-start-modal")).toHaveCount(0);
});

test("Triple timer pauses in the background and resumes from the same timestamp", async ({ page }) => {
  await page.clock.install();
  await startMapLevel(page);
  await finishTripleIntro(page, page.clock);
  const timer = page.locator("[data-triple-timer]");
  await page.clock.fastForward(1100);
  await expect(timer).toHaveText("01:32");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(3000);
  await expect(timer).toHaveText("01:32");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(1000);
  await expect(timer).toHaveText("01:31");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(2500);
  await expect(timer).toHaveText("01:31");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(1000);
  await expect(timer).toHaveText("01:30");
});
