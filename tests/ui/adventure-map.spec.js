import { expect, test } from "@playwright/test";

for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) {
  for (const mode of ['endless', 'challenge']) {
    test(`${gameId} selects ${mode} from the same menu and starts at level 1`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
      await page.locator('.adventure-mode-toggle').click();
      await page.locator(`[data-mode="${mode}"]`).click();
      await expect.poll(() => page.evaluate(async ({ gameId, mode }) => {
        const session = (await import('/js/sessionProgress.js')).getActiveSession(gameId, mode);
        return session ? { mode: session.mode, level: session.level } : null;
      }, { gameId, mode })).toEqual({ mode, level: 1 });
      await expect(page.locator('.adventure-map-page')).toHaveCount(0);
      await expect(page.locator('#adventure-special-modal')).toHaveCount(0);
    });
  }
}

for (const [gameId, title, progressKey] of [['memory-match', 'Memory Match', 'memoryMatch'], ['link-connect', 'Link Connect', 'linkConnect'], ['triple-connect', 'Triple Connect', 'tripleConnect']]) {
  for (const viewport of [{ width: 412, height: 915 }, { width: 640, height: 360 }, { width: 1024, height: 900 }]) {
    test(`${gameId} compact map returns to the highest playable level at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(key => {
        const bestByLevel = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`easy:${index + 1}`, { stars: 2, score: 100 }]));
        localStorage.setItem('memoryMatchSave', JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 813, progress: { [key]: { bestByLevel } }, appearance: {}, settings: {} } }));
      }, progressKey);
      await page.goto('/');
      await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
      await expect(page.locator('.adventure-map-title')).toHaveText(title);
      await expect(page.locator('.adventure-map-node.is-current')).toHaveAttribute('data-level', '7');
      await expect(page.locator('[data-level="7"]')).toBeInViewport();
      await expect(page.locator('.adventure-map-theme, .adventure-map-completion, .adventure-map-sessions, .adventure-map-play, .adventure-chapter-controls')).toHaveCount(0);
      const node = await page.locator('[data-level="7"]').boundingBox();
      expect(node.width).toBeGreaterThanOrEqual(44);
      expect(node.width).toBeLessThan(58);
      const scenery = await page.evaluate(async () => {
        const sprites = [...document.querySelectorAll('.adventure-map-decoration')];
        const controls = [...document.querySelectorAll('.adventure-map-cell')];
        const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const image = new Image(); image.src = '/assets/adventure/garden-sprites.webp'; await image.decode();
        return { count: sprites.length, collisions: sprites.filter(sprite => controls.some(control => overlap(sprite.getBoundingClientRect(), control.getBoundingClientRect()))).length, width: image.naturalWidth, pointerEvents: getComputedStyle(sprites[0]).pointerEvents };
      });
      expect(scenery.count).toBeGreaterThanOrEqual(10);
      expect(scenery.count).toBeLessThanOrEqual(37);
      expect(scenery.collisions).toBe(0);
      expect(scenery.width).toBeGreaterThan(0);
      expect(scenery.pointerEvents).toBe('none');
      expect(await page.locator('.adventure-map-path path').first().evaluate(el => Number.parseFloat(getComputedStyle(el).strokeWidth))).toBeLessThan(15);
      await page.locator('.adventure-mode-toggle').click();
      await expect(page.locator('.adventure-mode-option')).toHaveCount(6);
      await page.locator('[data-mode="hard"]').click();
      await expect(page.locator('.adventure-mode-menu')).toBeHidden();
      await expect(page.locator('.adventure-mode-toggle')).toContainText('Khó');
      await page.locator('.adventure-map-scroll').evaluate(el => { el.scrollTop = 0; });
      await page.locator('[data-dock-action="settings"]').click();
      await page.getByRole('button', { name: 'Trang chủ', exact: true }).click();
      await expect(page.locator('.game-selector__choice')).toHaveCount(3);
      await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
      await expect(page.locator('[data-level="7"]')).toBeInViewport();
      await expect(page.locator('.adventure-mode-toggle')).toContainText('Khó');
      if (viewport.width === 412) await page.screenshot({ path: `.firebase/refined-${gameId}.png` });
      await page.locator('[data-level="7"]').click();
      await expect(page.locator('.adventure-map-page')).toHaveCount(0);
      await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
    });
  }
}

test('mode menu supports keyboard, escape and outside dismissal; special modes enter new rounds directly', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect'));
  const toggle = page.locator('.adventure-mode-toggle');
  await toggle.focus(); await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-mode="easy"]')).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('[data-mode="challenge"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click(); await page.locator('.adventure-map-title').click();
  await expect(page.locator('.adventure-mode-menu')).toBeHidden();
  await toggle.click(); await page.locator('[data-mode="challenge"]').click();
  await expect(page.locator('#triple-round-start-modal')).toContainText('Thử thách');
  await expect(page.locator('[data-triple-level]')).toHaveText('1');
  await expect(page.locator('#adventure-special-modal')).toHaveCount(0);
});

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
  await expect(page.locator('.adventure-map-completion, .adventure-map-theme, .adventure-map-sessions, .adventure-map-play, .adventure-chapter-controls')).toHaveCount(0);
  const alignment = await page.evaluate(() => {
    const trail = document.querySelector('.adventure-map-trail').getBoundingClientRect();
    const level = document.querySelector('[data-level="10"]').getBoundingClientRect();
    const chest = document.querySelector('[data-chest="1"]').getBoundingClientRect();
    return { levelY: level.top + level.height / 2, chestY: chest.top + chest.height / 2, distance: Math.abs(level.left - chest.left), trailWidth: trail.width };
  });
  expect(Math.abs(alignment.levelY - alignment.chestY)).toBeLessThanOrEqual(16);
  expect(alignment.distance).toBeGreaterThan(70);
  await page.evaluate(() => {
    window.__mapNode = document.querySelector('[data-level="1"]');
    window.__mapScroll = document.querySelector(".adventure-map-scroll").scrollTop;
  });
  await page.locator('.adventure-mode-toggle').click();
  await page.locator('[data-mode="hard"]').click();
  expect(await page.evaluate(() => document.querySelector('[data-level="1"]') === window.__mapNode)).toBe(true);
  expect(await page.locator('[data-level="1"]').getAttribute("aria-label")).toContain("0 sao");
  expect(await page.locator('[data-level="1"]').getAttribute("class")).toContain("is-cleared");
  expect(await page.evaluate(() => document.querySelector(".adventure-map-scroll").scrollTop)).toBe(await page.evaluate(() => window.__mapScroll));
  await page.locator('[data-chest="1"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-chest="1"] .adventure-map-chest-art')).toHaveCSS('background-position', '0% 100%');
  await page.locator('[data-chest="1"]').click();
  await page.getByRole("button", { name: "Nhận thưởng", exact: true }).click();
  await expect(page.locator("#adventure-chest-modal")).toContainText("Đã nhận thưởng");
  const coins = await page.evaluate(async () => (await import("/js/gameState.js")).gameState.coins);
  expect(coins).toBeGreaterThanOrEqual(780);
  expect(coins).toBeLessThanOrEqual(950);
  await page.locator("#adventure-chest-modal .app-modal__close").click();
  await expect(page.locator("#adventure-chest-modal")).toHaveCount(0);
  await expect(page.locator('[data-chest="1"] .adventure-map-chest-art')).toHaveCSS('background-position', '33.3333% 100%');
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
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toHaveAttribute("data-map-chapter", "2");
  await expect(page.locator('[data-level="101"]')).toBeEnabled();
  await expect(page.locator('[data-level="102"]')).toBeDisabled();
  const baseline = await page.evaluate(async () => (await import("/js/appPageLifecycle.js")).getAppPageScope().diagnostics());
  for (let index = 0; index < 5; index += 1) {
    await page.evaluate(() => { const scroll = document.querySelector('.adventure-map-scroll'); scroll.scrollTop = scroll.scrollHeight; scroll.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true })); });
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toHaveAttribute('data-map-chapter', '1');
    await expect(page.locator('[data-level="1"]')).toHaveClass(/is-cleared/);
    await expect(page.locator('[data-level="100"]')).toBeEnabled();
    await page.evaluate(() => { const scroll = document.querySelector('.adventure-map-scroll'); scroll.scrollTop = 0; scroll.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true })); });
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toHaveAttribute('data-map-chapter', '2');
  }
  expect(await page.locator(".adventure-map-node").count()).toBeLessThanOrEqual(122);
  await page.locator('[data-chest="10"]').scrollIntoViewIfNeeded();
  await page.locator('[data-chest="10"]').click();
  await page.getByRole('button', { name: 'Nhận thưởng', exact: true }).click();
  await expect(page.locator('#adventure-chest-modal')).toContainText('Đã nhận thưởng');
  await page.locator('#adventure-chest-modal .app-modal__close').click();
  await expect(page.locator('.app-modal-overlay')).toHaveCount(0);
  await expect(page.locator('#menu-container')).toHaveAttribute('data-map-chapter', '2');
  await page.evaluate(() => {
    const scroll = document.querySelector('.adventure-map-scroll');
    scroll.scrollTop = scroll.scrollHeight;
    window.__seamY = document.querySelector('[data-level="96"]').getBoundingClientRect().top;
    scroll.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
  });
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toHaveAttribute('data-map-chapter', '1');
  expect(await page.evaluate(() => Math.abs(document.querySelector('[data-level="96"]').getBoundingClientRect().top - window.__seamY))).toBeLessThan(1);
  await page.evaluate(() => {
    const scroll = document.querySelector('.adventure-map-scroll');
    scroll.scrollTop = 0;
    window.__seamY = document.querySelector('[data-level="105"]').getBoundingClientRect().top;
    scroll.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
  });
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toHaveAttribute('data-map-chapter', '2');
  expect(await page.evaluate(() => Math.abs(document.querySelector('[data-level="105"]').getBoundingClientRect().top - window.__seamY))).toBeLessThan(1);
  expect(await page.locator('.adventure-map-node').count()).toBeLessThanOrEqual(122);
  expect(await page.evaluate(async () => (await import("/js/appPageLifecycle.js")).getAppPageScope().diagnostics())).toEqual(baseline);
});
