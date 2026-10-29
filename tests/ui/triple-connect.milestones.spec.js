import { expect, test } from "@playwright/test";

async function startRound(page, seed) {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await page.evaluate(async ({ roundSeed }) => {
    const { gameState } = await import("/js/gameState.js");
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    gameState.coins = 0;
    let dropRoll=0;Math.random=()=>dropRoll++%2===0?0:.99;
    gameState.progress.tripleConnect.milestones = { version: 2, progress: 0, cycleId: 0, claimedIds: [] };
    window.__tripleMilestoneRun = await startTripleConnectRound({ mode: "easy", seed: roundSeed, skipIntro: true });
  }, { roundSeed: seed });
}

async function resolveWitnessCommands(page, amount) {
  const witness = await page.evaluate((count) => window.__tripleMilestoneRun.generated.witness.slice(0, count), amount);
  for (const command of witness) {
    await page.locator(`[data-tile-id="${command.tileId}"]`).click();
    await page.waitForTimeout(360);
  }
}

test("Triple milestone HUD has the shared accessible track in every viewport", async ({ page }) => {
  await startRound(page, "milestone-hud");
  const compact = (page.viewportSize()?.height || 0) < 500;
  const region = page.locator('[data-shell-region="milestones"][aria-label="Mốc thưởng Triple"]');
  if (compact) {
    await expect(region).toBeHidden();
  } else {
    await expect(region).toBeVisible();
    await expect(region.locator("[data-triple-milestone]")).toHaveCount(10);
    await expect(region.locator('[data-triple-milestone="1"]')).toHaveAttribute("aria-label", "+10 Xu");
    const bounds = await region.boundingBox();
    const viewport = page.viewportSize();
    expect(bounds?.x || 0).toBeGreaterThanOrEqual(0);
    expect((bounds?.x || 0) + (bounds?.width || 0)).toBeLessThanOrEqual((viewport?.width || 0) + 1);
  }
});

test("Triple commits the third resolved set as one durable milestone transaction", async ({ page }) => {
  await startRound(page, "milestone-commit");
  await resolveWitnessCommands(page, 9);
  const committed = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const state = window.__tripleMilestoneRun.getState();
    return {
      coins: gameState.coins,
      milestones: structuredClone(gameState.progress.tripleConnect.milestones),
      ledger: state.milestoneTileIds,
      saved: getActiveSession("triple-connect", "easy"),
    };
  });
  expect(committed.coins).toBe(16);
  expect(committed.milestones).toEqual({ version: 2, progress: 3, cycleId: 0, claimedIds: ["0:1"] });
  expect(committed.ledger).toHaveLength(9);
  expect(committed.saved.snapshot.milestoneTileIds).toEqual(committed.ledger);
  await page.reload();
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const restored = await page.evaluate(async () => {
    const { continueTripleConnectSession } = await import("/js/tripleConnect/tripleController.js");
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const run = await continueTripleConnectSession(getActiveSession("triple-connect", "easy"));
    const { gameState } = await import("/js/gameState.js");
    return { restored: Boolean(run), milestones: gameState.progress.tripleConnect.milestones, ledger: run?.getState().milestoneTileIds };
  });
  expect(restored).toEqual({ restored: true, milestones: committed.milestones, ledger: committed.ledger });
});

test("Triple milestone coins fly to the milestone coin HUD, not the global counter", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await startRound(page, "milestone-coin-target");
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.progress.tripleConnect.milestones = { version: 2, progress: 2, cycleId: 0, claimedIds: [] };
  });
  await resolveWitnessCommands(page, 3);
  await expect(page.locator(".game-coin-reward-flight").first()).toBeVisible();
  const flights = await page.evaluate(() => {
    const target = document.querySelector(".triple-connect__milestone-coins .ui-icon")?.getBoundingClientRect();
    return [...document.querySelectorAll(".game-coin-reward-flight")].map((effect) => {
      const startX = Number.parseFloat(effect.style.left);
      const startY = Number.parseFloat(effect.style.top);
      const flightX = Number.parseFloat(effect.style.getPropertyValue("--game-coin-flight-x"));
      const flightY = Number.parseFloat(effect.style.getPropertyValue("--game-coin-flight-y"));
      return {
        landingX: startX + flightX,
        landingY: startY + flightY,
        targetX: target.left + target.width / 2,
        targetY: target.top + target.height / 2,
      };
    });
  });
  expect(flights).toHaveLength(12);
  for (const flight of flights) {
    expect(Math.abs(flight.landingX - flight.targetX)).toBeLessThanOrEqual(1);
    expect(Math.abs(flight.landingY - flight.targetY)).toBeLessThanOrEqual(1);
  }
});

test("Triple milestone persistence failure restores board, inventory, timer, and ledger", async ({ page }) => {
  await page.clock.install();
  await startRound(page, "milestone-rollback");
  const witness = await page.evaluate(() => window.__tripleMilestoneRun.generated.witness.slice(0, 3));
  for (const command of witness.slice(0, 2)) {
    await page.locator(`[data-tile-id="${command.tileId}"]`).click();
    await page.waitForTimeout(360);
  }
  const before = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function failMilestoneSave(...args) {
      if (this.name === "profile") throw new Error("milestone persistence failure");
      return original.apply(this, args);
    };
    window.__restoreMilestoneStorage = () => { IDBObjectStore.prototype.put = original; };
    return {
      state: JSON.stringify(window.__tripleMilestoneRun.getState()),
      coins: gameState.coins,
      milestones: structuredClone(gameState.progress.tripleConnect.milestones),
      session: JSON.stringify(getActiveSession("triple-connect", "easy")),
    };
  });
  await page.locator(`[data-tile-id="${witness[2].tileId}"]`).click();
  await page.waitForTimeout(100);
  const after = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const result = {
      state: JSON.stringify(window.__tripleMilestoneRun.getState()),
      coins: gameState.coins,
      milestones: structuredClone(gameState.progress.tripleConnect.milestones),
      session: JSON.stringify(getActiveSession("triple-connect", "easy")),
    };
    window.__restoreMilestoneStorage();
    delete window.__restoreMilestoneStorage;
    return result;
  });
  expect(after).toEqual(before);
});

test("Triple converts full milestone item inventory with the approved fallback values", async ({ page }) => {
  await startRound(page, "milestone-overflow");
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { GAMEPLAY_LIMITS } = await import("/js/gameplayTuning.js");
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const { commitTripleRewardTransaction } = await import("/js/tripleConnect/tripleTransactions.js");
    gameState.progress.tripleConnect.items = { hint: GAMEPLAY_LIMITS.itemCount, time: 0, undo: GAMEPLAY_LIMITS.itemCount, shuffle: GAMEPLAY_LIMITS.itemCount };
    const grants = await commitTripleRewardTransaction({
      session: getActiveSession("triple-connect", "easy"),
      milestones: { version: 2, progress: 9, cycleId: 0, claimedIds: ["0:1", "0:2", "0:3"] },
      rewards: [
        { type: "hint", amount: 1, source: "milestone" },
        { type: "undo", amount: 1, source: "milestone" },
        { type: "shuffle", amount: 1, source: "milestone" },
      ],
    });
    return { coins: gameState.coins, items: gameState.progress.tripleConnect.items, milestones: gameState.progress.tripleConnect.milestones, grants };
  });
  expect(result.coins).toBe(30);
  expect(result.items).toEqual({ hint: 9999, time: 0, undo: 9999, shuffle: 9999 });
  expect(result.milestones).toEqual({ version: 2, progress: 9, cycleId: 0, claimedIds: ["0:1", "0:2", "0:3"] });
  expect(result.grants).toEqual([
    { type: "coins", amount: 10, source: "milestone" },
    { type: "coins", amount: 10, source: "milestone" },
    { type: "coins", amount: 10, source: "milestone" },
  ]);
});
