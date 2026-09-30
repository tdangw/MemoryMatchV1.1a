import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await page.locator(".game-selector__choice").filter({ hasText: "Triple Connect" }).click();
  await expect(page.locator("#menu-container .menu-item").first()).toBeVisible();
});
async function finishTripleIntro(page, clock = null) {
  const intro = page.locator("#triple-round-start-modal");
  if (!(await intro.count())) return;
  if (clock) await clock.fastForward(2500);
  else await expect(intro).toHaveCount(0, { timeout: 4000 });
}

test("Triple start picker shares theme flow and catalog labels", async ({ page }) => {
  await page.getByText("Bắt đầu", { exact: true }).click();
  const picker = page.locator("#triple-difficulty-modal");
  await expect(picker.locator(".app-modal")).toHaveCSS(
    "background-image",
    /rgba\(24, 38, 64, 0\.97\).*rgba\(10, 20, 38, 0\.97\)/,
  );
  await expect(picker.locator(".app-modal__title")).toHaveCSS(
    "color",
    "rgb(242, 191, 91)",
  );
  await expect(picker.locator(".app-modal__close")).toHaveCSS(
    "color",
    "rgb(245, 247, 251)",
  );
  await expect(picker.locator(".difficulty-content > .difficulty-theme")).toBeVisible();
  await expect(picker.locator(".difficulty-theme")).toContainText("Chủ đề đang dùng");
  await expect(picker.locator(".difficulty-option")).toHaveText([
    "Dễ",
    "Trung bình",
    "Khó",
    "Siêu khó",
    "Vô tận",
    "Thử thách",
  ]);
  await picker.getByRole("button", { name: "Đổi" }).click();
  await expect(page.locator("#collection-modal")).toContainText("Bộ sưu tập · Triple Connect");
  await page.locator("#collection-modal").getByRole("button", { name: "Đóng" }).click();
  await expect(page.locator("#triple-difficulty-modal .difficulty-theme")).toBeVisible();
  await expect(page.locator("#triple-difficulty-modal .difficulty-option")).toHaveText([
    "Dễ",
    "Trung bình",
    "Khó",
    "Siêu khó",
    "Vô tận",
    "Thử thách",
  ]);
});
test("Triple continue picker preserves session choice and labels", async ({ page }) => {
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    await startTripleConnectRound({ mode: "normal", level: 3, seed: "chrome-session" });
  });
  await finishTripleIntro(page);
  await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("triple-connect");
  });
  await page.getByText("Tiếp tục", { exact: true }).click();
  await expect(page.locator("#triple-session-picker-modal .app-modal")).toHaveCSS(
    "background-image",
    /rgba\(24, 38, 64, 0\.97\).*rgba\(10, 20, 38, 0\.97\)/,
  );
  await expect(page.locator("#triple-session-picker-modal .app-modal__title")).toHaveCSS(
    "color",
    "rgb(242, 191, 91)",
  );
  await expect(page.locator("#triple-session-picker-modal .difficulty-theme")).toBeVisible();
  await expect(page.locator("#triple-session-picker-modal .difficulty-option")).toHaveText(["Trung bình - Level 3"]);
  await page.locator("#triple-session-picker-modal").getByRole("button", { name: "Đổi" }).click();
  await page.locator("#collection-modal").getByRole("button", { name: "Đóng" }).click();
  await expect(page.locator("#triple-session-picker-modal .difficulty-option")).toHaveText(["Trung bình - Level 3"]);
});
test("Triple HUD uses the shared contract and mutually exclusive menus", async ({ page }) => {
  await page.getByText("Bắt đầu", { exact: true }).click();
  await page.getByRole("button", { name: "Dễ" }).click();
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

test("Triple menu, start modal and timer follow the shared round contract", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("#menu-container .menu-item")).toHaveText([
    "Bắt đầu", "Bộ sưu tập", "Cửa hàng", "Hướng dẫn", "Cài đặt", "Home",
  ]);
  await page.locator("#menu-container").getByText("Hướng dẫn", { exact: true }).click();
  await expect(page.locator("#info-modal")).toContainText("thẻ bị lớp trên che");
  await page.locator("#info-modal").getByRole("button", { name: "Đóng" }).click();
  await page.getByText("Bắt đầu", { exact: true }).click();
  await page.getByRole("button", { name: "Dễ" }).click();
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
  await page.getByText("Bắt đầu", { exact: true }).click();
  await page.getByRole("button", { name: "Dễ" }).click();
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
