import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
});

async function start(page, id) {
  // Isolate round lifecycle from the separately owned background transition.
  const reduced = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(async id => (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id), id);
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  await page.evaluate(async id => {
    // Keep tile decorations/images identical when comparing DOM resource counts.
    let seed = 20260907;
    Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.sound = gameState.settings.music = false;
    gameState.settings.mode = "easy";
    if (id === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun();
    else if (id === "link-connect") await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    else await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ mode: "easy", skipIntro: true });
  }, id);
  await expect(page.locator('[data-shell-region="board"]:visible')).toHaveCount(1);
  await expect.poll(() => page.evaluate(async id => {
    const { getMemoryShell } = await import("/js/memoryMatch/memoryShell.js");
    const { getLinkShell } = await import("/js/linkConnect/linkShell.js");
    const { getTripleShell } = await import("/js/tripleConnect/tripleShell.js");
    const { getActiveGameScope } = await import("/js/gameShell/gameShellLifecycle.js");
    const { getGameShellDiagnostics } = await import("/js/gameShell/gameShell.js");
    const shell = id === "memory-match" ? getMemoryShell() : id === "link-connect" ? getLinkShell() : getTripleShell();
    const { root } = shell.refs;
    const activeScope = getActiveGameScope();
    const diagnostics = getGameShellDiagnostics();
    const activeShell = diagnostics.activeShell;
    return document.documentElement.dataset.activeGame === id
      && !root.hidden
      && getComputedStyle(root).display !== "none"
      && Boolean(shell.scope)
      && shell.scope.active === true
      && shell.scope === activeScope
      && Boolean(activeShell)
      && activeShell.root === root
      && activeShell.scope === activeScope;
  }, id), { message: `Expected active ${id} shell and lifecycle scope to match.` }).toBe(true);
}

test("DOM contract, stable refs and repeated 20-mount batches return to resource baseline", async ({ page }, testInfo) => {
  test.setTimeout(60000);
  const cdp = await page.context().newCDPSession(page);
  const counters = async () => {
    // Detached images may stay alive until their in-flight requests settle.
    await page.waitForLoadState("networkidle");
    await cdp.send("HeapProfiler.collectGarbage");
    await cdp.send("HeapProfiler.collectGarbage");
    return {
      dom: await cdp.send("Memory.getDOMCounters"),
      heap: await cdp.send("Runtime.getHeapUsage"),
    };
  };
  const exit = () => page.evaluate(async () => (await import("/js/gameSelector.js")).showGameSelector());
  const runCycles = async (offset) => {
    for (let i = 0; i < 20; i++) {
      await start(page, (i + offset) % 2 ? "link-connect" : "memory-match");
      const contract = await page.evaluate(async () => {
        const { getMemoryShell } = await import("/js/memoryMatch/memoryShell.js");
        const { getLinkShell } = await import("/js/linkConnect/linkShell.js");
        const shell = document.documentElement.dataset.activeGame === "memory-match" ? getMemoryShell() : getLinkShell();
        const { root, ...refs } = shell.refs;
        window.lastScope = shell.scope;
        window.savedShellRefs ??= new Map();
        const previous = window.savedShellRefs.get(root.id);
        window.savedShellRefs.set(root.id, shell.refs);
        shell.update({ paused: true });
        const paused = root.dataset.shellPaused;
        shell.update({ paused: false });
        return { same: !previous || previous === shell.refs, names: Object.keys(refs), contained: Object.values(refs).every(element => root.contains(element)), role: root.getAttribute("role"), paused };
      });
      expect(contract).toEqual({ same: true, names: ["title", "progress", "hud", "milestones", "frame", "board"], contained: true, role: "region", paused: "true" });
      await exit();
      const clean = await page.evaluate(async () => {
        const { getActiveGameScope } = await import("/js/gameShell/gameShellLifecycle.js");
        return { active: getActiveGameScope(), resources: window.lastScope.diagnostics(), visible: document.querySelectorAll('[data-shell-region="board"]').length };
      });
      expect(clean.active).toBeNull();
      expect(Object.values(clean.resources)).not.toContain(true);
      expect(Object.entries(clean.resources).filter(([key]) => key !== "active").every(([, value]) => value === 0)).toBe(true);
      await page.evaluate(() => { delete window.lastScope; });
    }
  };
  await runCycles(0);
  const baseline = await counters();
  await runCycles(20);
  await page.evaluate(() => { delete window.savedShellRefs; });
  const after = await counters();
  expect(after.dom.jsEventListeners).toBeLessThanOrEqual(baseline.dom.jsEventListeners);
  expect(after.dom.nodes).toBeLessThanOrEqual(baseline.dom.nodes);
  expect(after.heap.usedSize).toBeLessThanOrEqual(baseline.heap.usedSize + 1024 * 1024);
  await testInfo.attach("gate-0-resource-baseline.json", {
    body: JSON.stringify({ baseline, after }, null, 2),
    contentType: "application/json",
  });
  expect(await page.locator('[id]').evaluateAll(elements => elements.map(e => e.id).filter((id, i, all) => all.indexOf(id) !== i))).toEqual([]);
  await cdp.detach();
});

test("switch during preview, loot, coin, tooltip and closing modal cancels old work", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await start(page, "memory-match");
  await page.evaluate(async () => {
    window.staleCalls = 0;
    const source = document.querySelector(".tile");
    const target = document.querySelector("#memory-game-coins");
    (await import("/js/coinRewards.js")).playCoinRewardFlight(source, target, 4);
    (await import("/js/lootEffects.js")).playLootDrop(source, { target, onCollected: () => window.staleCalls++ });
    const modal = (await import("/js/modal.js")).openAppModal({ id: "lifecycle-modal", title: "Test", onClose: () => window.staleCalls++ });
    modal.close();
  });
  await page.locator("#btn-hint").dispatchEvent("pointerover", { pointerType: "mouse" });
  await start(page, "link-connect");
  await expect(page.locator("#lifecycle-modal, .game-loot-drop, .game-coin-reward-flight, .game-coin-gain-label")).toHaveCount(0);
  await expect(page.locator("#app-tooltip")).toBeHidden();
  // Advance far beyond the old preview and reward deadlines without waiting wall time.
  await page.clock.runFor(15000);
  expect(await page.evaluate(async () => (await import("/js/linkConnect/linkState.js")).linkGameState.isLocked)).toBe(false);
  expect(await page.evaluate(() => window.staleCalls)).toBe(0);
  await expect(page.locator("#game-container")).toBeHidden();
  await expect(page.locator(".game-coin-gain-label, .game-loot-drop, #lifecycle-modal")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("replacing a modal ID disposes old listeners and callback", async ({ page }) => {
  await start(page, "memory-match");
  await page.evaluate(async () => {
    const { openAppModal } = await import("/js/modal.js");
    window.oldModalCalls = 0;
    for (let i = 0; i < 20; i++) openAppModal({ id: "same-modal", title: "Test", onClose: () => window.oldModalCalls++ });
  });
  await expect(page.locator("#same-modal")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("#same-modal")).toHaveCount(0);
  expect(await page.evaluate(() => window.oldModalCalls)).toBe(1);
});

test("restarting a playing round cancels countdown and play-time checkpoint timers and preserves shell nodes", async ({ page }) => {
  test.setTimeout(60000);
  await page.clock.install();
  for (const id of ["memory-match", "link-connect"]) {
    await start(page, id);
    await page.clock.runFor(15000);
    const result = await page.evaluate(async id => {
      const { getMemoryShell } = await import("/js/memoryMatch/memoryShell.js");
      const { getLinkShell } = await import("/js/linkConnect/linkShell.js");
      const shell = id === "memory-match" ? getMemoryShell() : getLinkShell();
      const previous = shell.scope;
      const refs = shell.refs;
      const running = previous.diagnostics().interval;
      (await import('/js/playMetrics.js')).finishPlayMetrics();
      const afterMetricsFinish = previous.diagnostics().interval;
      window.staleRoundCalls = 0;
      previous.timeout(() => window.staleRoundCalls++, 1000);
      if (id === "memory-match") await (await import("/js/gameController.js")).restartMemoryLevel();
      else await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy", restart: true });
      return { running, afterMetricsFinish, sameRefs: refs === shell.refs, old: previous.diagnostics(), changed: previous !== shell.scope };
    }, id);
    expect(result.running).toBe(2);
    expect(result.afterMetricsFinish).toBe(1);
    expect(result.sameRefs && result.changed).toBe(true);
    expect(Object.values(result.old).every(value => value === false || value === 0)).toBe(true);
    await page.clock.runFor(15000);
    expect(await page.evaluate(() => window.staleRoundCalls)).toBe(0);
  }
});

test("new shell creates semantic slots without rebuilding the board on update", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { createGameShell } = await import("/js/gameShell/gameShell.js");
    const shell = createGameShell({ title: "Test" });
    document.body.append(shell.refs.root);
    shell.mount();
    const tile = document.createElement("button");
    shell.refs.board.append(tile);
    shell.update({ paused: true });
    shell.unmount();
    shell.unmount();
    shell.mount();
    const result = { count: shell.refs.root.querySelectorAll("[data-shell-region]").length, same: shell.refs.board.firstChild === tile, title: shell.refs.title.textContent };
    shell.unmount();
    shell.refs.root.remove();
    return result;
  });
  expect(result).toEqual({ count: 6, same: true, title: "Test" });
});

test("disposing an active scope cannot leave its shell visible", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { createGameShell, getGameShellDiagnostics } = await import("/js/gameShell/gameShell.js");
    const { createGameShellLifecycle, activateGameScope } = await import("/js/gameShell/gameShellLifecycle.js");
    const shell = createGameShell({ title: "Ownership" });
    document.body.append(shell.refs.root);
    shell.mount();
    activateGameScope(createGameShellLifecycle());
    const diagnostics = getGameShellDiagnostics();
    const result = {
      hidden: shell.refs.root.hidden,
      display: shell.refs.root.style.display,
      active: shell.scope.active,
      activeShell: diagnostics.activeShell,
    };
    shell.refs.root.remove();
    return result;
  });
  expect(result).toEqual({ hidden: true, display: "none", active: false, activeShell: null });
});

test("100 Memory, Link and Triple switches leave no active scope or owned resources", async ({ page }) => {
  test.setTimeout(60000);
  const exit = () => page.evaluate(async () => (await import("/js/gameSelector.js")).showGameSelector());
  for (let index = 0; index < 100; index += 1) {
    const id = ["memory-match", "link-connect", "triple-connect"][index % 3];
    await start(page, id);
    const mounted = await page.evaluate(async id => {
      const { getMemoryShell } = await import("/js/memoryMatch/memoryShell.js");
      const { getLinkShell } = await import("/js/linkConnect/linkShell.js");
      const { getTripleShell } = await import("/js/tripleConnect/tripleShell.js");
      const shell = id === "memory-match" ? getMemoryShell() : id === "link-connect" ? getLinkShell() : getTripleShell();
      window.stressScope = shell.scope;
      return shell.scope.diagnostics().active;
    }, id);
    expect(mounted).toBe(true);
    await exit();
    const released = await page.evaluate(async () => {
      const { getActiveGameScope } = await import("/js/gameShell/gameShellLifecycle.js");
      const diagnostics = window.stressScope.diagnostics();
      return {
        activeScope: getActiveGameScope(),
        inactive: diagnostics.active === false,
        resourcesReleased: Object.entries(diagnostics)
          .filter(([key]) => key !== "active")
          .every(([, value]) => value === 0),
      };
    });
    expect(released).toEqual({ activeScope: null, inactive: true, resourcesReleased: true });
  }
});

test("render-performance harness records comparable warm start and idle metrics", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const samples = [];
  for (const id of ["memory-match", "link-connect", "triple-connect"]) {
    const startedAt = await page.evaluate(() => performance.now());
    await start(page, id);
    const boardReady = await page.evaluate((startAt) => performance.now() - startAt, startedAt);
    // Do not charge first paint, image decode, and layout settling to idle.
    await page.waitForTimeout(300);
    const frames = await page.evaluate(async () => {
      const values = []; let previous = performance.now();
      for (let index = 0; index < 20; index += 1) {
        await new Promise(requestAnimationFrame);
        const now = performance.now(); values.push(now - previous); previous = now;
      }
      return values.sort((left, right) => left - right);
    });
    samples.push({ id, boardReady, idleFrameP95: frames[Math.ceil(frames.length * .95) - 1] });
    await page.evaluate(async () => (await import("/js/gameSelector.js")).showGameSelector());
  }
  await testInfo.attach("render-performance-warm.json", {
    body: JSON.stringify({ viewport: testInfo.project.use.viewport, samples }, null, 2),
    contentType: "application/json",
  });
  expect(samples.every((sample) => Number.isFinite(sample.boardReady) && sample.boardReady >= 0)).toBe(true);
  expect(samples.every((sample) => Number.isFinite(sample.idleFrameP95) && sample.idleFrameP95 <= 25)).toBe(true);
});
