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

test('Triple map shares theme flow and separates ordinary from special modes', async ({ page }) => {
  await expect(page.locator('.adventure-mode-tab')).toHaveText(['Dễ', 'Trung bình', 'Khó', 'Siêu khó']);
  await expect(page.locator('.adventure-special-button')).toHaveText(['Vô tận', 'Thử thách']);
  await page.locator('[data-mode="hard"]').click();
  await page.locator('.adventure-map-theme').click();
  await expect(page.locator('#collection-modal')).toContainText('Bộ sưu tập · Triple Connect');
  await page.locator('#collection-modal .app-modal__close').click();
  await expect(page.locator('#collection-modal')).toHaveCount(0);
  await expect(page.locator('[data-mode="hard"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.adventure-map-node--level')).toHaveCount(100);
});

test('Triple map preserves its resumable session across collection visits', async ({ page }) => {
  await page.evaluate(async () => {
    await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'normal', level: 3, seed: 'chrome-session', skipIntro: true });
    (await import('/js/gameSelector.js')).openGameMenu('triple-connect');
  });
  await page.locator('[data-resume-mode="normal"]').click();
  const preview = page.locator('#adventure-level-modal');
  await expect(preview).toContainText('Màn 3 · Trung bình');
  await expect(preview.getByRole('button', {name: 'Tiếp tục', exact: true})).toBeVisible();
  await preview.locator('.app-modal__close').click();
  await expect(preview).toHaveCount(0);
  await page.locator('.adventure-map-theme').click();
  await page.locator('#collection-modal .app-modal__close').click();
  await expect(page.locator('#collection-modal')).toHaveCount(0);
  await expect(page.locator('[data-resume-mode="normal"]')).toHaveText('Tiếp tục Trung bình · Màn 3');
});

test("Triple HUD uses the shared contract and mutually exclusive menus", async ({ page }) => {
  await page.locator('[data-level="1"]').click();
  await page.getByRole("button", { name: "Chơi", exact: true }).click();
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
  await expect(page.locator("#triple-actions-menu")).toBeVisible();
  await page.locator("#triple-tools-toggle").click();
  await expect(page.locator("#triple-actions-menu")).toBeHidden();
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
  await expect(page.locator('[data-dock-action]')).toHaveText(['Cửa hàng', 'Bộ sưu tập', 'Xếp hạng', 'Cài đặt']);
  await page.locator('[data-level="1"]').click();
  await page.getByRole("button", { name: "Chơi", exact: true }).click();
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
  await expect(page.locator("#triple-actions-menu .game-action-item")).toHaveText([
    "Chơi lại", "Menu", "Cài đặt", "Cửa hàng", "Bộ sưu tập", "Hướng dẫn", "Xóa dữ liệu",
  ]);
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
  await page.locator('[data-level="1"]').click();
  await page.getByRole("button", { name: "Chơi", exact: true }).click();
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
