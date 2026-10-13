import { expect, test } from "@playwright/test";

test("chapter nodes stay mounted on mode changes, shared clear stays distinct from mode stars and chests claim once", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.addInitScript(() => {
    const bestByLevel = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`easy:${index + 1}`, { score: 100, stars: 3 }]));
    localStorage.setItem("memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 700, progress: { memoryMatch: { bestByLevel } }, settings: {}, appearance: {} } }));
  });
  await page.goto("/");
  await page.evaluate(async () => (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("memory-match"));
  await expect(page.locator(".adventure-map-node--level")).toHaveCount(100);
  await expect(page.locator(".adventure-map-node--chest")).toHaveCount(10);
  await expect(page.locator('[data-level="11"]')).toBeEnabled();
  await expect(page.locator('[data-level="12"]')).toBeDisabled();
  await expect(page.locator('.adventure-back')).toHaveCount(0);
  await expect(page.locator('.adventure-account')).toHaveAccessibleName('Tài khoản');
  await expect(page.locator('.adventure-account')).toHaveText('');
  await expect(page.locator('.adventure-map-completion')).toContainText('10/100');
  const alignment = await page.evaluate(() => {
    const trail = document.querySelector('.adventure-map-trail').getBoundingClientRect();
    const level = document.querySelector('[data-level="10"]').getBoundingClientRect();
    const chest = document.querySelector('[data-chest="1"]').getBoundingClientRect();
    return { levelY: level.top + level.height / 2, chestY: chest.top + chest.height / 2, distance: Math.abs(level.left - chest.left), trailWidth: trail.width };
  });
  expect(Math.abs(alignment.levelY - alignment.chestY)).toBeLessThan(1);
  expect(alignment.distance).toBeGreaterThan(70);
  await page.evaluate(() => {
    window.__mapNode = document.querySelector('[data-level="1"]');
    window.__mapScroll = document.querySelector(".adventure-map-scroll").scrollTop;
  });
  await page.locator('[data-mode="hard"]').click();
  expect(await page.evaluate(() => document.querySelector('[data-level="1"]') === window.__mapNode)).toBe(true);
  expect(await page.locator('[data-level="1"]').getAttribute("aria-label")).toContain("0 sao");
  expect(await page.locator('[data-level="1"]').getAttribute("class")).toContain("is-cleared");
  expect(await page.evaluate(() => document.querySelector(".adventure-map-scroll").scrollTop)).toBe(await page.evaluate(() => window.__mapScroll));
  await page.locator('[data-chest="1"]').scrollIntoViewIfNeeded();
  await page.locator('[data-chest="1"]').click();
  await page.getByRole("button", { name: "Nhận thưởng", exact: true }).click();
  await expect(page.locator("#adventure-chest-modal")).toContainText("Đã nhận thưởng");
  const coins = await page.evaluate(async () => (await import("/js/gameState.js")).gameState.coins);
  expect(coins).toBeGreaterThanOrEqual(780);
  expect(coins).toBeLessThanOrEqual(950);
  await page.locator("#adventure-chest-modal .app-modal__close").click();
  await expect(page.locator("#adventure-chest-modal")).toHaveCount(0);
  await page.locator('[data-chest="1"]').click();
  await expect(page.locator("#adventure-chest-modal")).not.toContainText("Nhận thưởng");
  expect(await page.evaluate(async () => (await import("/js/gameState.js")).gameState.coins)).toBe(coins);
  await page.locator("#adventure-chest-modal .app-modal__close").click();
  await expect(page.locator('.app-modal-overlay')).toHaveCount(0);
  await page.screenshot({ path: ".firebase/adventure-map-mobile.png" });
});

test("home catalogs default to Memory and remember the most recently played game after reload", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-dock-action="collection"]').click();
  await expect(page.locator("#collection-modal")).toBeVisible();
  await expect(page.locator("#catalog-game-picker")).toHaveCount(0);
  await page.locator("#collection-modal .app-modal__close").click();
  await expect(page.locator("#collection-modal")).toHaveCount(0);
  await page.evaluate(async () => {
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("triple-connect");
    await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ skipIntro: true });
    await (await import("/js/persistence.js")).flushPersistentWrites();
  });
  await page.reload();
  await page.locator('[data-dock-action="collection"]').click();
  await expect(page.locator("#collection-modal")).toContainText("Triple Connect");
});

test("completed chapters archive safely and repeated chapter navigation keeps page resources bounded", async ({ page }) => {
  await page.addInitScript(() => {
    const bestByLevel = Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`${index % 2 ? "easy" : "hard"}:${index + 1}`, { score: 10, stars: 0 }]));
    localStorage.setItem("memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 0, progress: { linkConnect: { bestByLevel } }, settings: {}, appearance: {} } }));
  });
  await page.goto("/");
  await page.evaluate(async () => (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("link-connect"));
  await expect(page.locator(".adventure-chapter-label")).toHaveText("Chặng 2");
  await expect(page.locator('[data-level="101"]')).toBeEnabled();
  await expect(page.locator('[data-level="102"]')).toBeDisabled();
  const baseline = await page.evaluate(async () => (await import("/js/appPageLifecycle.js")).getAppPageScope().diagnostics());
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "Chặng trước" }).click();
    await expect(page.locator('#menu-container[data-map-ready="true"] .adventure-chapter-label')).toHaveText("Chặng 1");
    await expect(page.locator('[data-level="1"]')).toHaveClass(/is-cleared/);
    await expect(page.locator('[data-level="100"]')).toBeEnabled();
    await page.getByRole("button", { name: "Chặng sau" }).click();
    await expect(page.locator('#menu-container[data-map-ready="true"] .adventure-chapter-label')).toHaveText("Chặng 2");
  }
  expect(await page.locator(".adventure-map-node").count()).toBeLessThanOrEqual(122);
  await page.locator('[data-chest="10"]').scrollIntoViewIfNeeded();
  await page.locator('[data-chest="10"]').click();
  await page.getByRole('button', { name: 'Nhận thưởng', exact: true }).click();
  await expect(page.locator('#adventure-chest-modal')).toContainText('Đã nhận thưởng');
  await page.locator('#adventure-chest-modal .app-modal__close').click();
  await expect(page.locator('.app-modal-overlay')).toHaveCount(0);
  await expect(page.locator('.adventure-chapter-label')).toHaveText('Chặng 2');
  await page.evaluate(() => {
    const scroll = document.querySelector('.adventure-map-scroll');
    scroll.scrollTop = scroll.scrollHeight;
    window.__seamY = document.querySelector('[data-level="96"]').getBoundingClientRect().top;
    scroll.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
  });
  await expect(page.locator('#menu-container[data-map-ready="true"] .adventure-chapter-label')).toHaveText('Chặng 1');
  expect(await page.evaluate(() => Math.abs(document.querySelector('[data-level="96"]').getBoundingClientRect().top - window.__seamY))).toBeLessThan(1);
  await page.evaluate(() => {
    const scroll = document.querySelector('.adventure-map-scroll');
    scroll.scrollTop = 0;
    window.__seamY = document.querySelector('[data-level="105"]').getBoundingClientRect().top;
    scroll.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
  });
  await expect(page.locator('#menu-container[data-map-ready="true"] .adventure-chapter-label')).toHaveText('Chặng 2');
  expect(await page.evaluate(() => Math.abs(document.querySelector('[data-level="105"]').getBoundingClientRect().top - window.__seamY))).toBeLessThan(1);
  expect(await page.locator('.adventure-map-node').count()).toBeLessThanOrEqual(122);
  expect(await page.evaluate(async () => (await import("/js/appPageLifecycle.js")).getAppPageScope().diagnostics())).toEqual(baseline);
});
