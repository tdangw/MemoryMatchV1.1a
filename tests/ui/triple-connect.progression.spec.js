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

test("Triple saves a validated level session and exposes it through Continue", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = startTripleConnectRound({ mode: "normal", level: 3, skipIntro: true });
  });
  const session = await page.evaluate(async () => {
    const { getActiveSession } = await import("/js/sessionProgress.js");
    return getActiveSession("triple-connect", "normal");
  });

  expect(session).toMatchObject({
    mode: "normal",
    level: 3,
    seed: expect.stringMatching(/^triple-normal-level-3-/),
    layoutId: "normal",
  });
  await page.reload();
  await page.evaluate(async () =>
    (await import("/js/gameSelector.js")).openGameMenu("triple-connect"),
  );
  await expect(
    page.locator("#menu-container.triple-connect-menu"),
  ).toContainText("Tiếp tục");
  await page
    .locator("#menu-container.triple-connect-menu .menu-item")
    .filter({ hasText: "Tiếp tục" })
    .click();
  await page
    .locator("#triple-session-picker-modal .difficulty-option")
    .filter({ hasText: "Trung bình - Level 3" })
    .click();
  await expect(page.locator("[data-triple-total-stars]")).toHaveText("0");
  await expect(page.locator("[data-triple-level]")).toHaveText("3");
});

test("Triple hides malformed sessions instead of offering a broken Continue path", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = startTripleConnectRound({ mode: "easy", skipIntro: true });
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
    window.__tripleRun = startTripleConnectRound({ mode: "easy", level: 1, skipIntro: true });
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
  await expect(page.locator("[data-triple-level]")).toHaveText("2");
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
    window.__tripleRun = startTripleConnectRound({ mode: "easy", level: 1, skipIntro: true });
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
    coins: 20,
    totalStars: 3,
    best: { score: 198, stars: 3 },
  });
  await expect(page.locator("#level-summary-modal")).toContainText(/XU NHẬN\s*\+18/);
});

test("Triple match transaction rolls back state, progress, and session when persistence fails", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = startTripleConnectRound({ mode: "easy", level: 1, skipIntro: true });
  });
  await playTripleWitness(page, null, 2);
  const before = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const prototype = Object.getPrototypeOf(localStorage);
    window.__tripleStorageSetItem = prototype.setItem;
    prototype.setItem = () => { throw new Error("terminal persistence failure"); };
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
    Object.getPrototypeOf(localStorage).setItem = window.__tripleStorageSetItem;
    delete window.__tripleStorageSetItem;
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
    const run = startTripleConnectRound({ mode: "easy", level: 1, skipIntro: true });
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
      return startTripleConnectRound({ mode: "easy", seed: `adapter-${selectedPath}-${selectedExit}`, skipIntro: true }).generated.witness.slice(0, 3);
    }, { pathId, exitId });
    for (const command of witness.slice(0, 2)) {
      await page.locator(`[data-tile-id="${command.tileId}"]`).click();
      const flight = page.locator(".triple-connect__tray-flight");
      await flight.waitFor({ state: "visible" });
      await flight.waitFor({ state: "detached" });
    }
    await page.locator(`[data-tile-id="${witness[2].tileId}"]`).click();
    await expect(page.locator(".triple-connect__line")).toHaveClass(
      new RegExp(`link-path-overlay--${pathId}`),
    );
    await expect(page.locator(".triple-connect__ghost").first()).toHaveClass(
      new RegExp(`triple-connect__exit--${exitId}`),
    );
    await expect(page.locator(".triple-connect__ghost")).toHaveCount(0);
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
    window.__tripleRun = startTripleConnectRound({ mode: "endless", level: 4, skipIntro: true });
  });
  await advanceSeconds(page.clock, 5);
  await winActiveTripleRound(page, page.clock);
  await page.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(page.locator("[data-triple-level]")).toHaveText("5");
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

test("Triple Challenge advances deterministically through its staged timer and ends at 75 tiles", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = startTripleConnectRound({ mode: "challenge", level: 1, seed: "challenge-level-1", skipIntro: true });
  });
  await expect(page.locator("[data-triple-timer]")).toHaveText("01:15");
  await winActiveTripleRound(page);
  await page.getByRole("button", { name: "Màn tiếp theo" }).click();
  await expect(page.locator("[data-triple-level]")).toHaveText("2");
  await expect(page.locator("[data-triple-timer]")).toHaveText("01:25");
  await expect(page.locator("#triple-round-start-modal")).toHaveCount(0, { timeout: 4000 });
  const levelTwo = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession("triple-connect", "challenge"),
  );
  expect(levelTwo).toMatchObject({ mode: "challenge", level: 2, layoutId: "challenge-24-v2", remainingTime: 85 });

  await page.evaluate(async () => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleRun = startTripleConnectRound({ mode: "challenge", level: 7, seed: "challenge-level-7", skipIntro: true });
  });
  await expect(page.locator("[data-triple-timer]")).toHaveText("03:30");
  await winActiveTripleRound(page);
  await expect(page.getByRole("button", { name: "Màn tiếp theo" })).toHaveCount(0);
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
    window.__tripleRun = startTripleConnectRound({ mode: "easy", skipIntro: true });
  });
  // The round timer is attached after the shell mount lifecycle; advance past
  // the configured 75 seconds rather than assuming its first interval is at 0.
  await advanceSeconds(page.clock, 90);
  await expect(page.locator("#time-up-modal")).toBeVisible();
  await expect(page.locator("#time-up-modal")).toHaveCount(1);
  await expect(page.locator("#time-up-modal")).toContainText("Bạn đã thua");
  await expect(page.locator("#time-up-modal")).toContainText(
    "Chọn một cách để bắt đầu hành trình của bạn.",
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
    const run = startTripleConnectRound({ mode: "hard", seed: "tray-full", skipIntro: true });
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
    "Chọn một cách để bắt đầu hành trình của bạn.",
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
    const run = startTripleConnectRound({
      mode: "easy",
      seed: "stale-settlement",
      skipIntro: true,
    });
    for (const command of run.generated.witness)
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
    startTripleConnectRound({ mode: "normal", level: 2, skipIntro: true });
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
  await expect(page.locator("#triple-round-summary-modal")).toHaveCount(0);
  await expect(page.locator("[data-triple-level]")).toHaveText("2");
  const session = await page.evaluate(async () =>
    (await import("/js/sessionProgress.js")).getActiveSession(
      "triple-connect",
      "normal",
    ),
  );
  expect(session).toMatchObject({ mode: "normal", level: 2 });
});
