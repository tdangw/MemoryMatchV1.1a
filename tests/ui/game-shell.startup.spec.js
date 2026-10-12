import { expect, test } from '@playwright/test';

async function start(page, id, options = {}) {
  return page.evaluate(async ({ id, options }) => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'easy';
    gameState.settings.sound = false;
    gameState.settings.music = false;
    if (options.generated) gameState.appearance.themes[id === 'memory-match' ? 'memoryMatch' : id === 'link-connect' ? 'linkConnect' : 'tripleConnect'] = 'alphabet';
    if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun();
    else if (id === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy' });
    else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'easy', seed: 'startup-test', skipIntro: true });
    const { activeShell } = (await import('/js/gameShell/gameShell.js')).getGameShellDiagnostics();
    return activeShell.scope.startup.diagnostics();
  }, { id, options });
}

for (const id of ['memory-match', 'link-connect', 'triple-connect']) {
  test(`${id}: image-ready startup and generated theme have bounded decode`, async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.game-selector__choice').first()).toBeVisible();
    for (const generated of [false, true]) {
      const result = await start(page, id, { generated });
      expect(result.status).toBe('ready');
      expect(result.pending).toBe(0);
      expect(result.peakDecodeConcurrency).toBeLessThanOrEqual(4);
      expect(result.failedImages).toBe(0);
      await expect(page.locator('.game-shell-startup-status')).toHaveCount(0);
      await expect(page.locator('[data-shell-region="board"][aria-busy]')).toHaveCount(0);
    }
  });
  test(`${id}: failed images remain recognizable and startup settles`, async ({ page }) => {
    await page.route('**/assets/images/themes/**', route => route.abort());
    await page.goto('/');
    await expect(page.locator('.game-selector__choice').first()).toBeVisible();
    const result = await start(page, id);
    expect(result.status).toBe('ready');
    const images = await page.evaluate(async () => {
      const { activeShell } = (await import('/js/gameShell/gameShell.js')).getGameShellDiagnostics();
      return [...activeShell.root.querySelectorAll('[data-shell-region="board"] img:not([aria-hidden="true"])')].map(image => ({ source: image.getAttribute('src'), complete: image.complete, width: image.naturalWidth }));
    });
    expect(images.every(image => image.source.startsWith('data:image/svg+xml') && image.complete && image.width > 0)).toBe(true);
  });
}

test('the opening popup remains responsive while board images decode in the background', async ({ page }) => {
  let releaseImages;
  const imageGate = new Promise(resolve => { releaseImages = resolve; });
  await page.route('**/assets/images/themes/**', async route => {
    await imageGate;
    await route.continue();
  });
  await page.goto('/');
  await expect(page.locator('.game-selector__choice').first()).toBeVisible();
  await page.evaluate(async () => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect');
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.mode = 'easy';
    gameState.settings.sound = false;
    gameState.settings.music = false;
    window.startupPopupTest = (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'easy' });
  });
  await expect(page.locator('.level-reward-overlay')).toBeVisible();
  await expect(page.locator('.game-shell-startup-status')).toHaveCount(0);
  await expect(page.locator('#link-board')).toHaveCSS('visibility', 'visible');
  await expect(page.locator('#link-board')).toHaveAttribute('aria-busy', 'true');
  releaseImages();
  const result = await page.evaluate(async () => {
    await window.startupPopupTest;
    const { activeShell } = (await import('/js/gameShell/gameShell.js')).getGameShellDiagnostics();
    return activeShell.scope.startup.diagnostics();
  });
  expect(result.status).toBe('ready');
});

test('cancel during decode, restart and late results cannot mutate a new mount (30 cycles)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.game-selector__choice').first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { createGameShellStartup } = await import('/js/gameShell/gameShellStartup.js');
    const { createGameShell } = await import('/js/gameShell/gameShell.js');
    const shell = createGameShell({ title: 'Startup fixture' });
    document.body.append(shell.refs.root);
    const failures = [];
    const outcomes = [];
    for (let cycle = 0; cycle < 30; cycle++) {
      const old = shell.mount();
      const images = Array.from({ length: 12 }, (_, i) => {
        const image = document.createElement('img');
        image.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg"><text>${i % 6}</text></svg>`);
        return image;
      });
      shell.refs.board.replaceChildren(...images);
      const late = [];
      images.forEach(image => { image.decode = () => new Promise(resolve => late.push(resolve)); });
      const startup = createGameShellStartup(old, shell.refs, error => failures.push(error.message));
      let entered;
      const started = new Promise(resolve => { entered = resolve; });
      const pending = startup.run(async () => {
        const decode = startup.decodeBoard();
        entered();
        await decode;
        shell.refs.board.dataset.stale = 'true';
      });
      await started;
      const next = shell.mount();
      const fresh = createGameShellStartup(next, shell.refs, error => failures.push(error.message));
      const busyBefore = shell.refs.board.getAttribute('aria-busy');
      old.dispose();
      late.forEach(resolve => resolve());
      const cancelled = await pending;
      const busyAfter = shell.refs.board.getAttribute('aria-busy');
      const freshReady = fresh.run(async () => 'fresh');
      await freshReady;
      outcomes.push({ cancelled, before: busyBefore, after: busyAfter, stale: shell.refs.board.dataset.stale || null, resources: old.diagnostics(), status: startup.status });
      next.dispose();
    }
    shell.refs.root.remove();
    return { failures, outcomes };
  });
  expect(result.failures).toEqual([]);
  for (const outcome of result.outcomes) {
    expect(outcome).toMatchObject({ cancelled: null, before: 'true', after: 'true', stale: null, status: 'cancelled' });
    expect(Object.entries(outcome.resources).filter(([key]) => key !== 'active').every(([, value]) => value === 0)).toBe(true);
  }
});

test('all games can cancel a pending start immediately without saving a partial round', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.game-selector__choice').first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const memory = await import('/js/gameController.js');
    const link = await import('/js/linkConnect/linkController.js');
    const triple = await import('/js/tripleConnect/tripleController.js');
    const { getGameShellDiagnostics } = await import('/js/gameShell/gameShell.js');
    const outcomes = [];
    for (let i = 0; i < 20; i++) for (const [id, start] of [['memory', () => memory.startNewMemoryRun()], ['link', () => link.startLinkLevel({ mode: 'easy' })], ['triple', () => triple.startTripleConnectRound({ mode: 'easy', seed: 'cancel' })]]) {
      const before = localStorage.getItem('memoryMatchSave');
      const pending = start();
      const scope = getGameShellDiagnostics().activeScope;
      scope.dispose();
      const value = await pending;
      outcomes.push({ id, value, stableSave: before === localStorage.getItem('memoryMatchSave'), resources: scope.diagnostics() });
    }
    return outcomes;
  });
  for (const outcome of result) {
    expect(outcome.value).toBeNull();
    expect(outcome.stableSave).toBe(true);
    expect(Object.entries(outcome.resources).filter(([key]) => key !== 'active').every(([, value]) => value === 0)).toBe(true);
  }
});
