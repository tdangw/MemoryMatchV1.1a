import { startMapLevel } from './helpers/adventureNavigation.js';
import { expect, test } from "@playwright/test";

async function winActiveTripleRound(page, clock = null) {
  const start = page.locator("#triple-round-start-modal");
  if (await start.count()) {
    if (clock) await clock.fastForward(2500);
    else await expect(start).toHaveCount(0, { timeout: 4000 });
  }
  await playTripleWitness(page, clock);
  await expect(page.locator("#level-summary-modal")).toBeVisible({ timeout: 8000 });
}

async function playTripleWitness(page, clock = null, count = Infinity) {
  const witness = await page.evaluate(
    (limit) => window.__tripleRun.generated.witness.slice(0, limit),
    count,
  );
  for (const command of witness) {
    await page.locator(`[data-tile-id="${command.tileId}"]`).click();
    if (clock) await clock.fastForward(300);
    await page.waitForFunction(
      () =>
        !document.querySelector(
          ".triple-connect__tray-flight, .triple-connect__ghost",
        ),
    );
  }
}

async function advanceSeconds(clock, seconds) {
  for (let tick = 0; tick < seconds; tick += 1) await clock.fastForward(1000);
}

test("Triple retains its saved session on reload and starts a fresh board only when its level is selected", async ({ page }) => {
  await page.goto('/');
  const session = await page.evaluate(async () => {
    await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'normal', level: 1, seed: 'stored-session', skipIntro: true });
    return (await import('/js/sessionProgress.js')).getActiveSession('triple-connect','normal');
  });
  expect(session).toMatchObject({ mode: 'normal', level: 1, seed: expect.stringMatching(/^stored-session:/), layoutId: 'normal' });
  await page.reload();
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('triple-connect'));
  await expect(page.locator('#menu-container')).not.toContainText('Tiếp tục');
  expect(await page.evaluate(async () => (await import('/js/sessionProgress.js')).getActiveSession('triple-connect','normal').seed)).toBe(session.seed);
  await startMapLevel(page, 1, 'normal');
  await expect(page.locator('[data-triple-level]')).toHaveText('1-1');
  await expect.poll(() => page.evaluate(async () => (await import('/js/sessionProgress.js')).getActiveSession('triple-connect','normal')?.seed)).not.toBe(session.seed);
});

test("Triple hides malformed sessions instead of offering a broken Continue path", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({ mode: "easy", skipIntro: true });
  });
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.progress.tripleConnect.sessionsByMode.easy.layoutId =
      "unknown-layout";
    (await import("/js/gameSelector.js")).openGameMenu("triple-connect");
  });
  await expect(
    page.locator("#menu-container.triple-connect-menu"),
  ).not.toContainText("Tiếp tục");
});

test("Triple win settles once, clears Continue, and Next starts the following level", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({ mode: "easy", level: 1, skipIntro: true });
  });
  await winActiveTripleRound(page);

  const terminal = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession(
      "triple-connect",
      "easy",
    ),
  );
  expect(terminal).toBeNull();
  await page.getByRole("button", { name: "Màn tiếp theo" }).click();
  await expect(page.locator("[data-triple-total-stars]")).toHaveText("3");
  await expect(page.locator("[data-triple-level]")).toHaveText("2-1");
  await expect(page.locator("#triple-round-start-modal")).toHaveCount(0, { timeout: 4000 });
  const nextSession = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession(
      "triple-connect",
      "easy",
    ),
  );
  expect(nextSession).toMatchObject({
    mode: "easy",
    level: 2,
    layoutId: "easy",
  });
});

test("Triple completion grants the approved reward from the highest combo exactly once", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({ mode: "easy", level: 1, skipIntro: true });
  });
  await winActiveTripleRound(page);
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return {
      coins: gameState.coins,
      totalStars: gameState.progress.tripleConnect.totalStars,
      best: gameState.progress.tripleConnect.bestByLevel["easy:1"],
    };
  });
  expect(result).toEqual({
    coins: 23,
    totalStars: 3,
    best: expect.objectContaining({ stars: 3 }),
  });
  expect(result.best.score).toBeGreaterThan(198);
  const summary = page.locator("#level-summary-modal");
  await expect(summary.locator('.summary-coins strong')).toHaveText('+18');
  await expect(summary.locator('.summary-points strong')).toHaveText(String(result.best.score));
  await expect(summary.locator('.level-summary__stat')).toHaveCount(3);
  await expect(
    page.getByLabel(`Kỷ lục: ${result.best.score.toLocaleString("vi-VN")} điểm`),
  ).toBeVisible();
});

test("Triple terminal HUD, popup, and saved result use the same time-bonus score", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({
      mode: "easy",
      level: 2,
      skipIntro: true,
    });
  });
  await winActiveTripleRound(page);

  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return {
      state: window.__tripleRun.getState(),
      best: gameState.progress.tripleConnect.bestByLevel["easy:2"],
      hudScore: document.querySelector('[data-triple-stat="score"]')?.textContent,
      hudStars: document.querySelectorAll(
        "[data-triple-stars] .star-progress__milestone.is-earned",
      ).length,
      popupStars: document.querySelectorAll(
        "#level-summary-modal .level-summary__star--earned",
      ).length,
      popupScore: document.querySelector("#level-summary-modal .level-summary__score")?.textContent,
    };
  });

  expect(result.state.score).toBeGreaterThan(0);
  expect(result.best).toMatchObject({ score: result.state.score });
  expect(result.hudScore).toBe(String(result.state.score));
  expect(result.hudStars).toBe(result.best.stars);
  expect(result.popupStars).toBe(result.best.stars);
  await expect(page.locator("#level-summary-modal .level-summary__score")).toHaveText(
    `${result.state.score}`,
  );
});

test("Triple match transaction rolls back state, progress, and session when persistence fails", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({ mode: "easy", level: 1, skipIntro: true });
  });
  await playTripleWitness(page, null, 2);
  const before = await page.evaluate(async () => {
    await (await import("/js/persistence.js")).flushPersistentWrites();
    const { gameState } = await import("/js/gameState.js");
    window.__tripleStorePut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "profile") throw new DOMException("terminal persistence failure", "QuotaExceededError");
      return window.__tripleStorePut.apply(this, args);
    };
    return structuredClone({
      state: window.__tripleRun.getState(),
      coins: gameState.coins,
      progress: gameState.progress.tripleConnect,
    });
  });
  const finalTileId = await page.evaluate(
    () => window.__tripleRun.generated.witness[2].tileId,
  );
  await page
    .locator(`.triple-connect__board [data-tile-id="${finalTileId}"]`)
    .click();
  await expect(page.locator("#persistence-recovery-modal")).toBeVisible();
  await page.evaluate(async () => { await (await import("/js/persistence.js")).flushPersistentWrites(); });
  const after = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return structuredClone({
      state: window.__tripleRun.getState(),
      coins: gameState.coins,
      progress: gameState.progress.tripleConnect,
    });
  });
  expect(after).toEqual(before);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = window.__tripleStorePut;
    delete window.__tripleStorePut;
  });
});

test("Triple applies equipped effects and plays the shared match sound", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const effect = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { sounds } = await import("/js/sound.js");
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    gameState.appearance.triplePathEffect = "electric";
    gameState.appearance.tripleExitEffect = "burn";
    gameState.settings.sound = true;
    let matchPlays = 0;
    sounds.match.play = () => { matchPlays += 1; return Promise.resolve(); };
    const run = await startTripleConnectRound({ mode: "easy", level: 1, skipIntro: true });
    for (const command of run.generated.witness) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
      await Promise.resolve();
      if (document.querySelector(".triple-connect__line polyline")) break;
      await new Promise((resolve) => setTimeout(resolve, 280));
    }
    return {
      lineClass: document.querySelector(".triple-connect__line")?.className.baseVal,
      paths: [...document.querySelectorAll(".triple-connect__line polyline")].map((node) => node.className.baseVal),
      ghosts: [...document.querySelectorAll(".triple-connect__ghost")].map((node) => node.className),
      exitAnimations: [...document.querySelectorAll(".triple-connect__ghost")]
        .flatMap((node) => node.getAnimations())
        .filter((animation) => animation.playState === "running").length,
      matchPlays,
    };
  });
  expect(effect.lineClass).toContain("link-path-overlay--electric");
  expect(effect.paths).toEqual(expect.arrayContaining(["link-path-overlay__glow", "link-path-overlay__beam"]));
  expect(effect.ghosts).toEqual(expect.arrayContaining([expect.stringContaining("triple-connect__exit--burn")]));
  expect(effect.exitAnimations).toBeGreaterThan(0);
  expect(effect.matchPlays).toBeGreaterThan(0);
  await expect(page.locator(".triple-connect__ghost")).toHaveCount(0);
});

test("Triple preserves representative Link path and exit effect IDs through its adapter", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  for (const [pathId, exitId] of [
    ["electric", "burn"],
    ["magic", "portal"],
    ["matrix", "freeze"],
    ["meteor", "electric-shock"],
  ]) {
    const witness = await page.evaluate(async ({ pathId: selectedPath, exitId: selectedExit }) => {
      const { gameState } = await import("/js/gameState.js");
      const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
      gameState.appearance.triplePathEffect = selectedPath;
      gameState.appearance.tripleExitEffect = selectedExit;
      return (await startTripleConnectRound({ mode: "easy", seed: `adapter-${selectedPath}-${selectedExit}`, skipIntro: true })).generated.witness.slice(0, 3);
    }, { pathId, exitId });
    for (const command of witness.slice(0, 2)) {
      await page.locator(`[data-tile-id="${command.tileId}"]`).click();
      const flight = page.locator(".triple-connect__tray-flight");
      await flight.waitFor({ state: "visible" });
      await flight.waitFor({ state: "detached" });
    }
    await page.evaluate(() => {
      window.__observedTripleExits = [];
      window.__exitObserver = new MutationObserver(records => {
        for (const record of records) {
          const candidates = record.type === "attributes" ? [record.target] : record.addedNodes;
          for (const node of candidates) {
            if (node instanceof Element && node.matches(".triple-connect__ghost")) window.__observedTripleExits.push(node.className);
          }
        }
      });
      window.__exitObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    });
    await page.locator(`[data-tile-id="${witness[2].tileId}"]`).click();
    await expect(page.locator(".triple-connect__line")).toHaveClass(
      new RegExp(`link-path-overlay--${pathId}`),
    );
    await expect.poll(() => page.evaluate(id => window.__observedTripleExits.some(classes => classes.split(" ").includes(`triple-connect__exit--${id}`)), exitId)).toBe(true);
    await expect(page.locator(".triple-connect__ghost")).toHaveCount(0);
    await page.evaluate(() => { window.__exitObserver.disconnect(); delete window.__exitObserver; });
  }
});

test("Triple Endless advances without resetting accumulated elapsed time", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({ mode: "endless", level: 4, skipIntro: true });
  });
  await advanceSeconds(page.clock, 5);
  await winActiveTripleRound(page, page.clock);
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.locator("[data-triple-level]")).toHaveText("5-1");
  await page.clock.fastForward(2500);
  await expect(page.locator("#triple-round-start-modal")).toHaveCount(0);
  const session = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession(
      "triple-connect",
      "endless",
    ),
  );
  expect(session).toMatchObject({ mode: "endless", level: 5 });
  expect(session.remainingTime).toBeGreaterThanOrEqual(5);
});

test("Triple Challenge advances deterministically through its staged timer and continues past level seven", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({ mode: "challenge", level: 1, seed: "challenge-level-1", skipIntro: true });
  });
  await expect(page.locator("[data-triple-timer]")).toHaveText("01:15");
  await winActiveTripleRound(page);
  await page.getByRole("button", { name: "Màn tiếp theo" }).click();
  await expect(page.locator("[data-triple-level]")).toHaveText("2-1");
  await expect(page.locator("[data-triple-timer]")).toHaveText("01:25");
  await expect(page.locator("#triple-round-start-modal")).toHaveCount(0, { timeout: 4000 });
  const levelTwo = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession("triple-connect", "challenge"),
  );
  expect(levelTwo).toMatchObject({ mode: "challenge", level: 2, layoutId: "challenge-2", remainingTime: 85 });

  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({ mode: "challenge", level: 7, seed: "challenge-level-7", skipIntro: true });
  });
  await expect(page.locator("[data-triple-timer]")).toHaveText("03:30");
  await winActiveTripleRound(page);
  await page.getByRole("button", { name: "Màn tiếp theo" }).click();
  await expect(page.locator('[data-triple-level]')).toHaveText('8-1');
  // HUD mounts before the intro completes and the playable session is persisted.
  await expect(page.locator('#triple-round-start-modal')).toHaveCount(0, { timeout: 4000 });
  await expect.poll(() => page.evaluate(async () => (await import('/js/sessionProgress.js')).getActiveSession('triple-connect', 'challenge')?.level)).toBe(8);
  const continued = await page.evaluate(async () => (await import('/js/sessionProgress.js')).getActiveSession('triple-connect', 'challenge'));
  expect(continued.level).toBe(8);
  expect(continued.snapshot.tiles.length).toBeLessThanOrEqual(93);
});

test("Triple time-up clears the session and opens one loss modal", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = await startTripleConnectRound({ mode: "easy", skipIntro: true });
  });
  // The round timer is attached after the shell mount lifecycle; advance past
  // the configured 75 seconds rather than assuming its first interval is at 0.
  await advanceSeconds(page.clock, 90);
  await expect(page.locator("#time-up-modal")).toBeVisible();
  await expect(page.locator("#time-up-modal")).toHaveCount(1);
  await expect(page.locator("#time-up-modal")).toContainText("Bạn đã thua");
  await expect(page.locator("#time-up-modal")).toContainText(
    "Bạn có thể chơi lại hoặc trở về bản đồ.",
  );
  const terminal = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession(
      "triple-connect",
      "easy",
    ),
  );
  expect(terminal).toBeNull();
});

test("Triple settles one loss after a seventh non-matching tray tile", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const { getExposedTileIds } = await import(
      "/js/tripleConnect/tripleState.js"
    );
    const run = await startTripleConnectRound({ mode: "hard", seed: "tray-full", skipIntro: true });
    const usedTypes = new Set();
    for (let count = 0; count < 7; count += 1) {
      const active = run.getState();
      const tileId = getExposedTileIds(active).find(
        (id) => !usedTypes.has(active.tiles[id].type),
      );
      if (!tileId)
        throw new Error("Fixture did not expose seven distinct types.");
      usedTypes.add(active.tiles[tileId].type);
      document.querySelector(`[data-tile-id="${tileId}"]`)?.click();
      await new Promise((resolve) => setTimeout(resolve, 280));
    }
  });
  await expect(page.locator("#time-up-modal")).toHaveCount(1);
  await expect(page.locator("#time-up-modal")).toContainText(
    "Bạn có thể chơi lại hoặc trở về bản đồ.",
  );
  const terminal = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession(
      "triple-connect",
      "hard",
    ),
  );
  expect(terminal).toBeNull();
});

test("Triple cancels a settling round before restart so its stale callback cannot open a modal", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const run = await startTripleConnectRound({
      mode: "easy",
      seed: "stale-settlement",
      skipIntro: true,
    });
    for (const command of run.generated.witness)
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
    await startTripleConnectRound({ mode: "normal", level: 2, skipIntro: true });
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
  await expect(page.locator("#triple-round-summary-modal")).toHaveCount(0);
  await expect(page.locator("[data-triple-level]")).toHaveText("2-1");
  const session = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession(
      "triple-connect",
      "normal",
    ),
  );
  expect(session).toMatchObject({ mode: "normal", level: 2 });
});
