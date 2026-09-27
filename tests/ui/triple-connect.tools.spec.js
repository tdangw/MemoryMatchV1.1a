import { expect, test } from "@playwright/test";

test("Triple HUD uses the shared action menu and keeps tools separate", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    startTripleConnectDevelopmentRound({ seed: "hud" });
  });
  const viewport = page.viewportSize();
  if (viewport.height < 500) {
    await page.waitForFunction(() =>
      document
        .querySelector(".triple-connect-game")
        ?.classList.contains("shell-compact-landscape"),
    );
  }
  const actions = page.locator("#triple-actions-menu-toggle");
  await expect(actions).toHaveClass(/game-menu-toggle/);
  await actions.click();
  await expect(actions).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#triple-actions-menu")).toBeVisible();
  await expect(
    page.locator("#triple-actions-menu [data-triple-action]"),
  ).toHaveCount(8);
  await expect(page.locator("#triple-tools-menu")).toBeHidden();
  const bounds = await page
    .locator("#triple-actions-menu")
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: innerWidth,
        height: innerHeight,
      };
    });
  expect(bounds.left).toBeGreaterThanOrEqual(-1);
  expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1);
  expect(bounds.top).toBeGreaterThanOrEqual(-1);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height + 1);
});

test("Triple Time commits inventory, timer, and session in one transaction", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const { grantTripleItem } = await import(
      "/js/tripleConnect/tripleItems.js"
    );
    const run = startTripleConnectDevelopmentRound({ seed: "tools" });
    grantTripleItem("time");
    return {
      time: run.getState().status,
      timer: document.querySelector("[data-triple-timer]").textContent,
    };
  });
  expect(before.time).toBe("playing");
  await page.locator("#triple-tools-toggle").click();
  await expect(page.locator("#triple-tools-menu")).toBeVisible();
  await page.locator('[data-triple-item="time"]').click();
  await expect(page.locator("[data-triple-timer]")).toHaveText("01:34");
  await expect(page.locator('[data-triple-item-count="time"]')).toHaveText("0");
  const saved = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession(
      "triple-connect",
      "easy",
    ),
  );
  expect(saved.remainingTime).toBe(94);
});

test("Triple Time is not available in Endless", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    startTripleConnectDevelopmentRound({
      seed: "endless-time",
      mode: "endless",
    });
  });
  await expect(page.locator('[data-triple-item="time"]')).toBeHidden();
});

test("Triple Time restores its committed inventory and timer after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const { grantTripleItem } = await import(
      "/js/tripleConnect/tripleItems.js"
    );
    startTripleConnectDevelopmentRound({ seed: "time-reload" });
    grantTripleItem("time");
  });
  await page.locator("#triple-tools-toggle").click();
  await page.locator('[data-triple-item="time"]').click();
  await page.reload();
  const restored = await page.evaluate(async () => {
    const { continueTripleConnectSession } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const { getTripleItemCount } = await import(
      "/js/tripleConnect/tripleItems.js"
    );
    const run = continueTripleConnectSession(
      getActiveSession("triple-connect", "easy"),
    );
    return {
      restored: Boolean(run),
      timer: document.querySelector("[data-triple-timer]")?.textContent,
      count: getTripleItemCount("time"),
    };
  });
  expect(restored).toEqual({ restored: true, timer: "01:34", count: 0 });
});

test("Triple Time rolls back coin, inventory, timer, and session when persistence fails", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const { grantTripleItem } = await import(
      "/js/tripleConnect/tripleItems.js"
    );
    const { gameState } = await import("/js/gameState.js");
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const run = startTripleConnectDevelopmentRound({ seed: "time-rollback" });
    gameState.coins = 31;
    grantTripleItem("time");
    const before = {
      coins: gameState.coins,
      count: gameState.progress.tripleConnect.items.time,
      timer: document.querySelector("[data-triple-timer]").textContent,
      state: JSON.stringify(run.getState()),
      session: JSON.stringify(getActiveSession("triple-connect", "easy")),
    };
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function forceFailure(key, value) {
      if (key === "memoryMatchSave")
        throw new Error("forced transaction failure");
      return original.call(this, key, value);
    };
    try {
      document.querySelector('[data-triple-item="time"]').click();
    } finally {
      Storage.prototype.setItem = original;
    }
    return {
      before,
      after: {
        coins: gameState.coins,
        count: gameState.progress.tripleConnect.items.time,
        timer: document.querySelector("[data-triple-timer]").textContent,
        state: JSON.stringify(run.getState()),
        session: JSON.stringify(getActiveSession("triple-connect", "easy")),
      },
    };
  });
  expect(result.after).toEqual(result.before);
});

test("Triple Shuffle preserves tray, multiset, cover graph, and clears undo after solver verification", async ({
  page,
}) => {
  await page.goto("/");
  const before = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const { grantTripleItem } = await import(
      "/js/tripleConnect/tripleItems.js"
    );
    const run = startTripleConnectDevelopmentRound({ seed: "shuffle" });
    grantTripleItem("shuffle");
    document
      .querySelector(
        ".triple-connect__board .triple-connect__tile:not(:disabled)",
      )
      .click();
    window.__tripleShuffleRun = run;
    const state = run.getState();
    return {
      tray: [...state.tray],
      types: Object.fromEntries(
        Object.entries(state.tiles).map(([id, tile]) => [id, tile.type]),
      ),
      counters: {
        moves: state.moves,
        misses: state.misses,
        combo: state.combo,
        score: state.score,
        matchedTriples: state.matchedTriples,
      },
      undoLength: state.undoHistory.length,
    };
  });
  expect(before.undoLength).toBeGreaterThan(0);
  await page.locator("#triple-tools-toggle").click();
  await page.locator('[data-triple-item="shuffle"]').click();
  const after = await page.evaluate(async () => {
    const { assertTripleStateInvariant } = await import(
      "/js/tripleConnect/tripleState.js"
    );
    const { solveTripleState } = await import(
      "/js/tripleConnect/tripleSolver.js"
    );
    const { getTripleLayout, createTripleCoverGraph } = await import(
      "/js/tripleConnect/tripleBoard.js"
    );
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const state = window.__tripleShuffleRun.getState();
    const session = getActiveSession("triple-connect", "easy");
    assertTripleStateInvariant(state);
    const layout = getTripleLayout(session.layoutId);
    const slotGraph = createTripleCoverGraph(layout);
    const bySlot = Object.fromEntries(
      Object.values(state.tiles).map((tile) => [tile.slotId, tile.id]),
    );
    const coverGraphMatchesLayout = Object.values(state.tiles).every(
      (tile) =>
        JSON.stringify(state.coverGraph[tile.id]) ===
        JSON.stringify(slotGraph[tile.slotId].map((slotId) => bySlot[slotId])),
    );
    const solved = solveTripleState({
      initialState: state,
      maxNodes: 5000,
      maxMemo: 2000,
      deadlineMs: 20,
    });
    return {
      tray: [...state.tray],
      types: Object.fromEntries(
        Object.entries(state.tiles).map(([id, tile]) => [id, tile.type]),
      ),
      counters: {
        moves: state.moves,
        misses: state.misses,
        combo: state.combo,
        score: state.score,
        matchedTriples: state.matchedTriples,
      },
      undoLength: state.undoHistory.length,
      coverGraphMatchesLayout,
      solver: { status: solved.status, witnessLength: solved.witness.length },
      session,
    };
  });
  expect(after.tray).toEqual(before.tray);
  expect(after.types).toEqual(before.types);
  expect(after.counters).toEqual(before.counters);
  expect(after.undoLength).toBe(0);
  expect(after.coverGraphMatchesLayout).toBe(true);
  expect(after.solver.status).toBe("solved");
  expect(after.solver.witnessLength).toBeGreaterThan(0);
  expect(after.session.snapshot.undoHistory).toBeUndefined();
});

test("Triple Shuffle persistence failure leaves runtime state and inventory unchanged", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const { grantTripleItem } = await import(
      "/js/tripleConnect/tripleItems.js"
    );
    const { gameState } = await import("/js/gameState.js");
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const run = startTripleConnectDevelopmentRound({
      seed: "shuffle-rollback",
    });
    grantTripleItem("shuffle");
    document
      .querySelector(
        ".triple-connect__board .triple-connect__tile:not(:disabled)",
      )
      .click();
    const before = {
      count: gameState.progress.tripleConnect.items.shuffle,
      state: JSON.stringify(run.getState()),
      session: JSON.stringify(getActiveSession("triple-connect", "easy")),
    };
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function forceFailure(key, value) {
      if (key === "memoryMatchSave")
        throw new Error("forced transaction failure");
      return original.call(this, key, value);
    };
    try {
      document.querySelector('[data-triple-item="shuffle"]').click();
    } finally {
      Storage.prototype.setItem = original;
    }
    return {
      before,
      after: {
        count: gameState.progress.tripleConnect.items.shuffle,
        state: JSON.stringify(run.getState()),
        session: JSON.stringify(getActiveSession("triple-connect", "easy")),
      },
    };
  });
  expect(result.after).toEqual(result.before);
});

test("Triple purchase rolls back coins and inventory when persistence fails", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { purchaseTripleItem } = await import(
      "/js/tripleConnect/tripleTransactions.js"
    );
    gameState.coins = 31;
    gameState.progress.tripleConnect.items.time = 0;
    const before = {
      coins: gameState.coins,
      time: gameState.progress.tripleConnect.items.time,
    };
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function forceFailure(key, value) {
      if (key === "memoryMatchSave") throw new Error("forced purchase failure");
      return original.call(this, key, value);
    };
    let purchased;
    try {
      purchased = purchaseTripleItem("time");
    } finally {
      Storage.prototype.setItem = original;
    }
    return {
      purchased,
      before,
      after: {
        coins: gameState.coins,
        time: gameState.progress.tripleConnect.items.time,
      },
    };
  });
  expect(result.purchased).toBe(false);
  expect(result.after).toEqual(result.before);
});

test("Triple Shuffle layout cleanup remains bounded across remounts", async ({
  page,
}) => {
  await page.goto("/");
  const diagnostics = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const { getGameShellLayoutDiagnostics } = await import(
      "/js/gameShell/gameShellLayout.js"
    );
    const { getTripleShell } = await import("/js/tripleConnect/tripleShell.js");
    ["easy", "normal", "hard", "superHard", "easy"].forEach((mode, index) =>
      startTripleConnectDevelopmentRound({ mode, seed: `layout-${index}` }),
    );
    const mounted = getGameShellLayoutDiagnostics();
    getTripleShell().unmount();
    return { mounted, unmounted: getGameShellLayoutDiagnostics() };
  });
  expect(diagnostics.mounted).toMatchObject({
    active: 1,
    observers: 1,
    listeners: 5,
  });
  expect(diagnostics.unmounted).toMatchObject({
    active: 0,
    observers: 0,
    listeners: 0,
    pendingFrames: 0,
  });
});

test("Triple returns shell layout resources to baseline after 20 restart, mode, and orientation cycles", async ({
  page,
}) => {
  await page.goto("/");
  const viewports = [
    { width: 360, height: 640 },
    { width: 640, height: 360 },
    { width: 411, height: 914 },
    { width: 914, height: 411 },
  ];
  const modes = ["easy", "normal", "hard", "superHard", "endless"];
  for (let cycle = 0; cycle < 20; cycle += 1) {
    await page.setViewportSize(viewports[cycle % viewports.length]);
    const released = await page.evaluate(async ({ mode, cycleId }) => {
      const { startTripleConnectDevelopmentRound } = await import(
        "/js/tripleConnect/tripleController.js"
      );
      const { getTripleShell } = await import("/js/tripleConnect/tripleShell.js");
      const { unmountActiveGameShell } = await import("/js/gameShell/gameShell.js");
      startTripleConnectDevelopmentRound({ mode, seed: `cycle-${cycleId}` });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const scope = getTripleShell().scope;
      unmountActiveGameShell();
      return scope.diagnostics();
    }, { mode: modes[cycle % modes.length], cycleId: cycle });
    expect(released).toEqual({
      active: false,
      listener: 0,
      timeout: 0,
      interval: 0,
      frame: 0,
      animation: 0,
      node: 0,
      cleanup: 0,
    });
  }
  const diagnostics = await page.evaluate(async () =>
    (await import("/js/gameShell/gameShellLayout.js")).getGameShellLayoutDiagnostics(),
  );
  expect(diagnostics).toMatchObject({
    active: 0,
    observers: 0,
    listeners: 0,
    pendingFrames: 0,
  });
});
