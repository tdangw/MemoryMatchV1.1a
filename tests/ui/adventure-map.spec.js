import { previewMapLevel, startMapLevel, closeLevelPreview } from './helpers/adventureNavigation.js';
import { expect, test } from "@playwright/test";


test('level submission locks difficulty and rejects repeated clicks until the launch settles', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
    window.__launchCount = 0;
    (await import('/js/adventureMap.js')).configureAdventureMap({ adapters: { 'memory-match': {
      goal: 'Ghép hết các cặp thẻ.', preview: () => ({ timeSeconds: 60, target: '6 cặp · 12 thẻ', hints: 3, assistNote: '' }),
      launch: () => { window.__launchCount++; return new Promise(resolve => { window.__finishLaunch = resolve; }); },
    } } });
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');
  });
  await previewMapLevel(page);
  const play = page.locator('#adventure-level-modal').getByRole('button', { name: 'Chơi', exact: true });
  await play.click();
  await expect(play).toBeDisabled();
  await expect(page.getByRole('radio', { name: 'Khó', exact: true })).toBeDisabled();
  await play.evaluate(button => { button.click(); button.click(); });
  expect(await page.evaluate(() => window.__launchCount)).toBe(1);
  await page.evaluate(() => window.__finishLaunch(false));
  await expect(play).toBeEnabled();
  await expect(page.getByRole('radio', { name: 'Khó', exact: true })).toBeDisabled();
  await expect(page.getByRole('radio', { name: 'Dễ', exact: true })).toBeEnabled();
  await closeLevelPreview(page);
});

for (const [gameId, progressKey] of [['memory-match', 'memoryMatch'], ['link-connect', 'linkConnect'], ['triple-connect', 'tripleConnect']]) {
  test(`${gameId} centers multi-digit levels and previews separate difficulty records`, async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.addInitScript(key => {
      const bestByLevel = Object.fromEntries(Array.from({ length: 99 }, (_, i) => [`easy:${i + 1}`, { stars: 2, score: 120, durationMs: 2000 }]));
      bestByLevel['normal:1'] = { stars: 1, score: 150, durationMs: 1800 };
      bestByLevel['hard:1'] = { stars: 1, score: 250, durationMs: 1500 };
      for (const [id,record] of Object.entries(bestByLevel)) { const level=Number(id.split(':')[1]); Object.assign(record,{cleared:true,rulesVersion:1,completedWaves:level<=10?2:level<=50?3:level<=90?4:5}); }
    localStorage.setItem('memoryMatchSave', JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 0, progress: { gameplaySeason: 1, [key]: { bestByLevel } }, settings: {}, appearance: {} } }));
    }, progressKey);
    await page.goto('/');
    await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
    for (const level of [1, 10, 99, 100]) {
      const bounds = await page.locator(`[data-level="${level}"]`).evaluate(button => {
        const node = button.getBoundingClientRect(), label = button.firstElementChild.getBoundingClientRect();
        return { dx: Math.abs(label.left + label.width / 2 - node.left - node.width / 2), dy: Math.abs(label.top + label.height / 2 - node.top - node.height / 2), fits: label.left >= node.left && label.right <= node.right, width: node.width };
      });
      expect(bounds.dx).toBeLessThan(1); expect(bounds.dy).toBeLessThan(1);
      expect(bounds.fits).toBe(true); expect(bounds.width).toBe(44);
    }
    await expect(page.locator('[data-level="100"]')).toBeInViewport();
    await previewMapLevel(page, 1, 'easy');
    await expect(page.locator('.adventure-level-modes label')).toHaveText(['C', 'B', 'A', 'S']);
    await expect(page.locator('#adventure-level-modal .app-modal__title')).toHaveText('Màn 1 · Dễ');
    await expect(page.locator('.adventure-level-details')).toContainText('Thời gian:');
    await expect(page.locator('.adventure-level-result, .adventure-level-stars')).toHaveCount(0);
    await page.getByRole('radio', { name: 'Khó', exact: true }).check();
    await expect(page.locator('#adventure-level-modal .app-modal__title')).toHaveText('Màn 1 · Khó');
    await expect(page.locator('.adventure-level-details')).toContainText('Mục tiêu:');
    await closeLevelPreview(page);
  });
  for (const mode of ['easy', 'normal', 'superHard']) {
    test(`${gameId} launches ${mode} only after confirming the level preview`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
      await page.evaluate(async id=>{
        const {gameState}=await import('/js/gameState.js');const key=(await import('/js/gameCatalog.js')).getGameProgressKey(id);
        for(const mode of ['easy','normal','hard']) gameState.progress[key].bestByLevel[mode+':1']={cleared:true,rulesVersion:1,completedWaves:2,score:100,stars:1};
        await (await import('/js/persistence.js')).savePersistentGameData({progress:gameState.progress});
      },gameId);
      await previewMapLevel(page, 1, mode);
      await expect(page.locator('.adventure-map-page')).toBeVisible();
      await page.locator('#adventure-level-modal').getByRole('button', { name: 'Chơi', exact: true }).click();
      await expect.poll(() => page.evaluate(async ({ gameId, mode }) => {
        const session = (await import('/js/sessionProgress.js')).getActiveSession(gameId, mode);
        return session ? { mode: session.mode, level: session.level } : null;
      }, { gameId, mode })).toEqual({ mode, level: 1 });
      await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
      await expect(page.locator('.level-reward-overlay')).toHaveCount(0);
      await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup', /.+/);
    });
  }
}

for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) {
  for (const mode of ['endless', 'challenge']) {
    test(`${gameId} previews ${mode} before confirming a new run at level 1`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
      await page.locator(`[data-special-mode="${mode}"]`).click();
      await expect(page.locator('#adventure-level-modal')).toBeVisible();
      await expect(page.locator('.adventure-map-page')).toBeVisible();
      await expect(page.locator('#adventure-level-modal input[type="radio"]')).toHaveCount(0);
      await expect(page.locator('#adventure-level-modal')).toContainText(mode === 'endless' ? 'Không giới hạn' : 'Thời gian:');
      expect(await page.evaluate(async ({gameId,mode}) => (await import('/js/sessionProgress.js')).getActiveSession(gameId,mode), {gameId,mode})).toBeNull();
      await page.locator('#adventure-level-modal').getByRole('button',{name:'Chơi',exact:true}).click();
      await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
      await expect(page.locator('.level-reward-overlay, #triple-round-start-modal')).toHaveCount(0);
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
        for (const [id,record] of Object.entries(bestByLevel)) { const level=Number(id.split(':')[1]); Object.assign(record,{cleared:true,rulesVersion:1,completedWaves:level<=10?2:level<=50?3:level<=90?4:5}); }
    localStorage.setItem('memoryMatchSave', JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 813, progress: { gameplaySeason: 1, [key]: { bestByLevel } }, appearance: {}, settings: {} } }));
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
      await expect(page.locator('.adventure-mode-toggle, .adventure-wallet')).toHaveCount(0);
      const home = await page.locator('.adventure-exit').boundingBox();
      const settings = await page.locator('[data-dock-action="settings"]').boundingBox();
      expect(home.y).toBeLessThan(settings.y);
      expect(home.x).toBeGreaterThan(viewport.width / 2 - 50);
      await expect(page.locator('.adventure-header .adventure-account')).toHaveCount(0);
      const fixed = await page.locator('.adventure-special-modes').boundingBox();
      await page.locator('.adventure-map-scroll').evaluate(el => { el.scrollTop = 0; });
      const afterScroll = await page.locator('.adventure-special-modes').boundingBox();
      expect(afterScroll).toEqual(fixed);
      await page.locator('[data-level="7"]').scrollIntoViewIfNeeded();
      await previewMapLevel(page, 7, 'easy');
      await expect(page.locator('.adventure-level-modes label')).toHaveText(['C', 'B', 'A', 'S']);
      await expect(page.locator('.adventure-level-details')).toContainText('Gợi ý:');
      if (viewport.width === 412) await page.screenshot({ path: `.firebase/level-preview-${gameId}.png` });
      await closeLevelPreview(page);
      await page.locator('[data-dock-action="settings"]').click();
      await expect(page.locator('#settings-modal').getByRole('button', { name: 'Trang chủ', exact: true })).toHaveCount(0);
      await page.locator('.adventure-screen [data-dock-action="map"]').click();
      await expect(page.locator('#settings-modal')).toHaveCount(0);
      await page.locator('.adventure-exit').click();
      await expect(page.locator('.game-selector__choice')).toHaveCount(3);
      await expect(page.locator('.adventure-wallet')).toHaveCount(0);
      await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), gameId);
      await expect(page.locator('[data-level="7"]')).toBeInViewport();
      await previewMapLevel(page, 7);
      await expect(page.locator('#adventure-level-modal input[value="easy"]')).toBeChecked();
      await closeLevelPreview(page);
      if (viewport.width === 412) await page.screenshot({ path: `.firebase/refined-${gameId}.png` });
      await startMapLevel(page, 7);
      await expect(page.locator('.adventure-map-page')).toHaveCount(0);
      await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
      await expect(page.locator('.level-reward-overlay')).toHaveCount(0);
      await expect(page.locator('.game-shell-root:visible')).not.toHaveAttribute('data-shell-startup', /.+/);
    });
  }
}

test('level preview supports native keyboard choices, escape/focus restoration and bounded modal ownership', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect'));
  await page.evaluate(async()=>{const {gameState}=await import('/js/gameState.js');gameState.progress.tripleConnect.bestByLevel['easy:1']={cleared:true,rulesVersion:1,completedWaves:2,score:100,stars:1};});
  const baseline = await page.evaluate(async () => (await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics());
  for (let index = 0; index < 12; index++) {
    await previewMapLevel(page);
    await page.getByRole('radio', { name: 'Dễ', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Trung bình', exact: true })).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(page.locator('#adventure-level-modal')).toHaveCount(0);
    await expect(page.locator('[data-level="1"]')).toBeFocused();
  }
  expect(await page.evaluate(async () => (await import('/js/appPageLifecycle.js')).getAppPageScope().diagnostics())).toEqual(baseline);
  await page.locator('[data-special-mode="challenge"]').click();
  await expect(page.locator('#adventure-level-modal .app-modal__title')).toHaveText('Thử thách');
  await expect(page.locator('#adventure-level-modal .adventure-level-details')).toContainText('6 bộ ba');
  await expect(page.locator('#adventure-level-modal small')).toHaveCount(0);
  await expect(page.locator('.game-shell-root:visible')).toHaveCount(0);
});

test("chapter nodes stay mounted on mode changes, shared clear stays distinct from mode stars and chests claim once", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.addInitScript(() => {
    const bestByLevel = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`easy:${index + 1}`, { score: 100, stars: 3 }]));
    for (const [id,record] of Object.entries(bestByLevel)) { const level=Number(id.split(':')[1]); Object.assign(record,{cleared:true,rulesVersion:1,completedWaves:level<=10?2:level<=50?3:level<=90?4:5}); }
    localStorage.setItem("memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 700, progress: { gameplaySeason: 1, memoryMatch: { bestByLevel } }, settings: {}, appearance: {} } }));
  });
  await page.goto("/");
  await page.evaluate(async () => (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("memory-match"));
  await expect(page.locator(".adventure-map-node--level")).toHaveCount(100);
  await expect(page.locator(".adventure-map-node--chest")).toHaveCount(10);
  await expect(page.locator('[data-level="11"]')).toBeEnabled();
  await expect(page.locator('[data-level="12"]')).toBeDisabled();
  await expect(page.locator('.adventure-back')).toHaveCount(0);
  await expect(page.locator('.adventure-account')).toHaveCount(0);
  await expect(page.locator('.adventure-map-completion, .adventure-map-theme, .adventure-map-sessions, .adventure-map-play, .adventure-chapter-controls')).toHaveCount(0);
  const alignment = await page.evaluate(() => {
    const trail = document.querySelector('.adventure-map-trail').getBoundingClientRect();
    const level = document.querySelector('[data-level="10"]').getBoundingClientRect();
    const chest = document.querySelector('[data-chest="1"]').getBoundingClientRect();
    return { levelY: level.top + level.height / 2, chestY: chest.top + chest.height / 2, distance: Math.abs(level.left - chest.left), trailWidth: trail.width };
  });
  expect(Math.abs(alignment.levelY - alignment.chestY)).toBeLessThanOrEqual(16);
  expect(alignment.distance).toBeGreaterThan(70);
  await page.locator('[data-level="1"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    window.__mapNode = document.querySelector('[data-level="1"]');
    window.__mapScroll = document.querySelector(".adventure-map-scroll").scrollTop;
  });
  await previewMapLevel(page, 1, 'normal');
  await closeLevelPreview(page);
  expect(await page.evaluate(() => document.querySelector('[data-level="1"]') === window.__mapNode)).toBe(true);
  expect(await page.locator('[data-level="1"]').getAttribute("aria-label")).toContain("0 sao");
  expect(await page.locator('[data-level="1"]').getAttribute("class")).toContain("is-cleared");
  expect(await page.evaluate(() => document.querySelector(".adventure-map-scroll").scrollTop)).toBe(await page.evaluate(() => window.__mapScroll));
  await page.locator('[data-chest="1"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-chest="1"] .treasure-art')).toHaveCount(1);
  await page.locator('[data-chest="1"]').click();
  await page.getByRole("button", { name: "Mở rương", exact: true }).click();
  await expect(page.locator("#adventure-chest-modal")).toContainText("Bạn đã mở Rương Mầm Non");
  const coins = await page.evaluate(async () => (await import("/js/gameState.js")).gameState.coins);
  expect(coins).toBe(730);
  await page.locator("#adventure-chest-modal .app-modal__close").click();
  await expect(page.locator("#adventure-chest-modal")).toHaveCount(0);
  await expect(page.locator('[data-chest="1"]')).toHaveAttribute('data-treasure-art-state', 'B:false');
  await page.locator('[data-chest="1"]').click();
  await expect(page.locator("#adventure-chest-modal .treasure-card.is-claimed")).toHaveCount(1);
  await expect(page.getByRole("button", {name:"Mở rương",exact:true})).toHaveCount(0);
  expect(await page.evaluate(async () => (await import("/js/gameState.js")).gameState.coins)).toBe(coins);
  await page.locator("#adventure-chest-modal .app-modal__close").click();
  await expect(page.locator('.app-modal-overlay')).toHaveCount(0);
  await page.screenshot({ path: ".firebase/adventure-map-mobile.png" });
});

test("catalog access follows the selected game and remains separate from home placeholders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-dock-action="shop"], [data-dock-action="collection"]')).toHaveCount(0);
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match'));
  await page.locator('[data-dock-action="collection"]').click();
  await expect(page.locator("#collection-modal")).toBeVisible();
  await expect(page.locator("#catalog-game-picker")).toHaveCount(0);
  await page.locator('.adventure-screen [data-dock-action="map"]').click();
  await expect(page.locator("#collection-modal")).toHaveCount(0);
  await page.evaluate(async () => {
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu("triple-connect");
    await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ skipIntro: true });
    await (await import("/js/persistence.js")).flushPersistentWrites();
  });
  await page.reload();
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect'));
  await page.locator('[data-dock-action="collection"]').click();
  await expect(page.locator('#collection-modal .app-modal__title')).toHaveText('Bộ sưu tập');
  await expect(page.locator('#catalog-collection-triple-connect-tabs')).toBeVisible();
  await expect(page.locator('#catalog-collection-triple-connect-panel')).toBeVisible();
});

test("completed chapters archive safely and repeated chapter navigation keeps page resources bounded", async ({ page }) => {
  await page.addInitScript(() => {
    const bestByLevel = Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`easy:${index + 1}`, { score: 10, stars: 0 }]));
    for (const [id,record] of Object.entries(bestByLevel)) { const level=Number(id.split(':')[1]); Object.assign(record,{cleared:true,rulesVersion:1,completedWaves:level<=10?2:level<=50?3:level<=90?4:5}); }
    localStorage.setItem("memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 1, data: { coins: 0, progress: { gameplaySeason: 1, linkConnect: { bestByLevel } }, settings: {}, appearance: {} } }));
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
  await page.getByRole('button', { name: 'Mở rương', exact: true }).click();
  await expect(page.locator('#adventure-chest-modal')).toContainText('Bạn đã mở Rương Mầm Non');
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
