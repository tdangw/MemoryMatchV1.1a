import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await page.locator(".game-selector__choice").filter({ hasText: "Triple Connect" }).click();
});

test("Triple start picker shares theme flow and catalog labels", async ({ page }) => {
  await page.getByText("Bắt đầu", { exact: true }).click();
  const picker = page.locator("#triple-difficulty-modal");
  await expect(picker.locator(".difficulty-content > .difficulty-theme")).toBeVisible();
  await expect(picker.locator(".difficulty-theme")).toContainText("Chủ đề đang dùng");
  await expect(picker.locator(".difficulty-option")).toHaveText([
    "Dễ18 thẻ · 2 lớp · 75 giây",
    "Trung bình36 thẻ · 3 lớp · 105 giây",
    "Khó54 thẻ · 4 lớp · 150 giây",
    "Siêu khó75 thẻ · 5 lớp · 210 giây",
    "Vô tận75 thẻ · 5 lớp · không giới hạn thời gian",
    "Thử tháchMàn thử thách với số thẻ, lớp và thời gian riêng",
  ]);
  await picker.getByRole("button", { name: "Đổi" }).click();
  await expect(page.locator("#collection-modal")).toContainText("Bộ sưu tập · Triple Connect");
  await page.locator("#collection-modal").getByRole("button", { name: "Đóng" }).click();
  await expect(page.locator("#triple-difficulty-modal .difficulty-theme")).toBeVisible();
  await expect(page.locator("#triple-difficulty-modal .difficulty-option")).toHaveText([
    "Dễ18 thẻ · 2 lớp · 75 giây",
    "Trung bình36 thẻ · 3 lớp · 105 giây",
    "Khó54 thẻ · 4 lớp · 150 giây",
    "Siêu khó75 thẻ · 5 lớp · 210 giây",
    "Vô tận75 thẻ · 5 lớp · không giới hạn thời gian",
    "Thử tháchMàn thử thách với số thẻ, lớp và thời gian riêng",
  ]);
});

test("Triple continue picker preserves session choice and labels", async ({ page }) => {
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    startTripleConnectRound({ mode: "normal", level: 3, seed: "chrome-session" });
  });
  await page.locator("#triple-round-start-modal").getByRole("button", { name: "Bắt đầu" }).click();
  await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("triple-connect");
  });
  await page.getByText("Tiếp tục", { exact: true }).click();
  await expect(page.locator("#triple-session-picker-modal .difficulty-theme")).toBeVisible();
  await expect(page.locator("#triple-session-picker-modal .difficulty-option")).toHaveText(["Trung bình - Level 3"]);
  await page.locator("#triple-session-picker-modal").getByRole("button", { name: "Đổi" }).click();
  await page.locator("#collection-modal").getByRole("button", { name: "Đóng" }).click();
  await expect(page.locator("#triple-session-picker-modal .difficulty-option")).toHaveText(["Trung bình - Level 3"]);
});

test("Triple HUD uses the shared contract and mutually exclusive menus", async ({ page }) => {
  await page.getByText("Bắt đầu", { exact: true }).click();
  await page.getByRole("button", { name: "Dễ" }).click();
  await page.locator("#triple-round-start-modal").getByRole("button", { name: "Bắt đầu" }).click();
  const shell = page.locator(".triple-connect-game");
  const progress = page.locator(".triple-game-progress-hud .stat-star-progress");
  if (await shell.evaluate((node) => node.classList.contains("shell-compact-landscape"))) {
    // Compact landscape uses the shared shell contract: progress chrome is
    // hidden to preserve the board, while level/timer/tools remain in the HUD.
    await expect(progress).toBeHidden();
  } else {
    await expect(progress).toBeVisible();
  }
  await expect(page.locator(".triple-game-hud .stat-score")).toContainText("0");
  await expect(page.locator(".triple-game-hud .stat-timer")).toContainText(/0[01]:\d{2}/);
  await page.locator("#triple-actions-menu-toggle").click();
  await expect(page.locator("#triple-actions-menu")).toBeVisible();
  await page.locator("#triple-tools-toggle").click();
  await expect(page.locator("#triple-actions-menu")).toBeHidden();
  await expect(page.locator("#triple-tools-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#triple-tools-menu")).toBeHidden();
});

test("Triple menu, start modal and timer follow the shared round contract", async ({ page }) => {
  await expect(page.locator("#menu-container .menu-item")).toContainText([
    "Hướng dẫn", "Cài đặt", "Thông tin", "Home",
  ]);
  await page.locator("#menu-container").getByText("Hướng dẫn", { exact: true }).click();
  await expect(page.locator("#info-modal")).toContainText("thẻ bị lớp trên che");
  await page.locator("#info-modal").getByRole("button", { name: "Đóng" }).click();
  await page.getByText("Bắt đầu", { exact: true }).click();
  await page.getByRole("button", { name: "Dễ" }).click();
  const start = page.locator("#triple-round-start-modal");
  await expect(start).toContainText(/18 thẻ.*2 lớp.*Chủ đề.*khay đầy 7 ô/s);
  const timer = page.locator("[data-triple-timer]");
  const before = await timer.textContent();
  await page.waitForTimeout(1100);
  await expect(timer).toHaveText(before || "01:00");
  await start.getByRole("button", { name: "Bắt đầu" }).click();
  await expect(start).toBeHidden();
  const timerProgress = page.locator(".triple-game-hud");
  const progressBefore = Number(await timerProgress.evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--game-timer-progress"),
  ));
  await page.waitForTimeout(150);
  const progressAfter = Number(await timerProgress.evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--game-timer-progress"),
  ));
  expect(progressAfter).toBeLessThan(progressBefore);
  await page.waitForTimeout(1100);
  await expect(timer).not.toHaveText(before || "01:00");
  await page.locator("#triple-actions-menu-toggle").click();
  await expect(page.locator("#triple-actions-menu .game-action-item")).toHaveText([
    "Chơi lại", "Menu", "Cài đặt", "Cửa hàng", "Bộ sưu tập", "Hướng dẫn", "Thông tin", "Xóa dữ liệu",
  ]);
});

test("Triple Continue resumes without replaying the start modal", async ({ page }) => {
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    startTripleConnectRound({ mode: "easy", seed: "continue-no-intro" });
  });
  await page.locator("#triple-round-start-modal").getByRole("button", { name: "Bắt đầu" }).click();
  await page.evaluate(async () => {
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const { continueTripleConnectSession } = await import("/js/tripleConnect/tripleController.js");
    continueTripleConnectSession(getActiveSession("triple-connect", "easy"));
  });
  await expect(page.locator("#triple-round-start-modal")).toHaveCount(0);
});

test("Triple timer pauses in the background and resumes from the same timestamp", async ({ page }) => {
  await page.clock.install();
  await page.getByText("Bắt đầu", { exact: true }).click();
  await page.getByRole("button", { name: "Dễ" }).click();
  await page.locator("#triple-round-start-modal").getByRole("button", { name: "Bắt đầu" }).click();
  const timer = page.locator("[data-triple-timer]");
  await page.clock.fastForward(1100);
  await expect(timer).toHaveText("01:14");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(3000);
  await expect(timer).toHaveText("01:14");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(1000);
  await expect(timer).toHaveText("01:13");
});
