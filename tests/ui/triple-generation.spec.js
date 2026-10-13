import { expect, test } from "@playwright/test";

test("Triple worker generation is deterministic and releases its worker", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { requestTripleGeneration } = await import("/js/tripleConnect/tripleGeneration.js");
    const first = requestTripleGeneration({ mode: "hard", seed: "worker-deterministic", level: 1 });
    const second = requestTripleGeneration({ mode: "hard", seed: "worker-deterministic", level: 1 });
    const [left, right] = await Promise.all([first.promise, second.promise]);
    return {
      layoutId: left.layoutId,
      board: left.board,
      witness: left.witness,
      same: JSON.stringify(left) === JSON.stringify(right),
    };
  });
  expect(result.layoutId).toBe("hard");
  expect(result.board.tiles).toHaveLength(78);
  expect(result.witness).toHaveLength(78);
  expect(result.same).toBe(true);
});

test("Triple worker preserves the main-thread generator contract for the same seed", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { generateHardTripleBoard } = await import("/js/tripleConnect/tripleBoard.js");
    const { requestTripleGeneration } = await import("/js/tripleConnect/tripleGeneration.js");
    const main = generateHardTripleBoard({ seed: "worker-main-contract", level: 1 });
    const worker = await requestTripleGeneration({
      mode: "hard", seed: "worker-main-contract", level: 1,
    }).promise;
    return JSON.stringify(main) === JSON.stringify(worker);
  });
  expect(result).toBe(true);
});

test("Triple generation timeout is derived from the active solver budget", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { getTripleGenerationTimeoutMs } = await import("/js/tripleConnect/tripleGeneration.js");
    return {
      easy: getTripleGenerationTimeoutMs({ mode: "easy" }),
      hard: getTripleGenerationTimeoutMs({ mode: "hard" }),
      superHard: getTripleGenerationTimeoutMs({ mode: "superHard" }),
      challengeSeven: getTripleGenerationTimeoutMs({ mode: "challenge", level: 7 }),
    };
  });
  expect(result).toEqual({ easy: 4390, hard: 4200, superHard: 4800, challengeSeven: 4800 });
});

test("Triple caches one board view for each immutable state revision", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { generateEasyTripleBoard } = await import("/js/tripleConnect/tripleBoard.js");
    const { createTripleRoundState, createTripleBoardView } = await import("/js/tripleConnect/tripleState.js");
    const { reduceTrustedTripleCommand } = await import("/js/tripleConnect/tripleRules.js");
    const generated = generateEasyTripleBoard({ seed: "board-view-cache" });
    const initial = createTripleRoundState(generated.board);
    const initialView = createTripleBoardView(initial);
    const next = reduceTrustedTripleCommand(initial, generated.witness[0]).nextState;
    return {
      sameRevision: initialView === createTripleBoardView(initial),
      nextRevision: initialView !== createTripleBoardView(next),
      exposed: createTripleBoardView(next).exposedTileIds.has(generated.witness[0].tileId),
    };
  });
  expect(result).toEqual({ sameRevision: true, nextRevision: true, exposed: false });
});

test("Triple rejects corrupt state at the public board-view boundary", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { generateEasyTripleBoard } = await import("/js/tripleConnect/tripleBoard.js");
    const {
      createTripleRoundState,
      createTripleBoardView,
      createTripleBoardViewFromTrustedState,
    } = await import("/js/tripleConnect/tripleState.js");
    const state = createTripleRoundState(generateEasyTripleBoard({ seed: "validation-boundary" }).board);
    const corrupt = { ...state, tray: ["missing-tile"] };
    let error = "";
    try { createTripleBoardView(corrupt); } catch (caught) { error = String(caught.message); }
    return {
      exposedMatches: [...createTripleBoardView(state).exposedTileIds].sort().join(",")
        === [...createTripleBoardViewFromTrustedState(state).exposedTileIds].sort().join(","),
      error,
    };
  });
  expect(result.exposedMatches).toBe(true);
  expect(result.error).toContain("tray");
});

test("Triple worker cancellation does not publish a result", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { requestTripleGeneration } = await import("/js/tripleConnect/tripleGeneration.js");
    const request = requestTripleGeneration({ mode: "superHard", seed: "worker-cancel", level: 1 });
    request.cancel();
    return await Promise.race([
      request.promise.then(() => "published", () => "rejected"),
      new Promise((resolve) => setTimeout(() => resolve("timed-out"), 120)),
    ]);
  });
  expect(result).toBe("rejected");
});

test("Triple worker request surfaces worker failure and timeout without leaking workers", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { requestTripleGeneration } = await import("/js/tripleConnect/tripleGeneration.js");
    class FakeWorker {
      static terminated = 0;
      constructor(kind) { this.kind = kind; this.listeners = new Map(); }
      addEventListener(type, callback) { this.listeners.set(type, callback); }
      postMessage() {
        if (this.kind === "error") this.listeners.get("error")?.({ message: "worker exploded" });
      }
      terminate() { FakeWorker.terminated += 1; }
    }
    class ErrorWorker extends FakeWorker { constructor() { super("error"); } }
    class SilentWorker extends FakeWorker { constructor() { super("silent"); } }
    const error = await requestTripleGeneration({
      mode: "easy", seed: "error", level: 1, WorkerClass: ErrorWorker,
    }).promise.then(() => "resolved", (reason) => reason.message);
    const timeout = await requestTripleGeneration({
      mode: "easy", seed: "timeout", level: 1, timeoutMs: 1, WorkerClass: SilentWorker,
    }).promise.then(() => "resolved", (reason) => reason.message);
    return { error, timeout, terminated: FakeWorker.terminated };
  });
  expect(result).toEqual({
    error: "worker exploded",
    timeout: "Triple generation timed out.",
    terminated: 2,
  });
});

test("Triple starts without a retry screen when workers are unavailable", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const originalWorker = window.Worker;
    window.Worker = undefined;
    try {
      const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
      const run = await startTripleConnectRound({ mode: "easy", seed: "worker-fallback", skipIntro: true });
      return {
        mounted: Boolean(document.querySelector(".triple-connect__board")),
        loading: Boolean(document.querySelector("#triple-generation-loading")),
        tiles: Object.keys(run.getState().tiles).length,
      };
    } finally {
      window.Worker = originalWorker;
    }
  });
  expect(result).toEqual({ mounted: true, loading: false, tiles: 27 });
});

test("Triple menu navigation cancels a pending generation before it can mount", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    const { openReadyGameMenu } = await import('/tests/ui/helpers/gameNavigation.js');
    const pending = startTripleConnectRound({ mode: "superHard", seed: "worker-menu-cancel", skipIntro: true });
    await openReadyGameMenu('triple-connect');
    const run = await pending;
    return {
      run: run === null,
      loading: Boolean(document.querySelector("#triple-generation-loading")),
      board: Boolean([...document.querySelectorAll('.triple-connect__board')].find(node => node.getBoundingClientRect().height > 0 && node.getBoundingClientRect().width > 0)),
      menu: Boolean(document.querySelector('#menu-container[data-map-ready="true"]')),
    };
  });
  expect(result).toEqual({ run: true, loading: false, board: false, menu: true });
});

test("Triple replacement cancels the prior request and keeps one current round", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    const first = startTripleConnectRound({ mode: "superHard", seed: "worker-restart", skipIntro: true });
    const second = startTripleConnectRound({ mode: "superHard", seed: "worker-restart-next", skipIntro: true });
    const firstResult = await first;
    await second;
    return {
      firstCancelled: firstResult === null,
      loading: Boolean(document.querySelector("#triple-generation-loading")),
      boards: document.querySelectorAll(".triple-connect__board").length,
    };
  });
  expect(result).toEqual({ firstCancelled: true, loading: false, boards: 1 });
});

test("Twenty start-cancel cycles release every generation worker", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { requestTripleGeneration } = await import("/js/tripleConnect/tripleGeneration.js");
    class PendingWorker {
      static terminated = 0;
      addEventListener() {}
      postMessage() {}
      terminate() { PendingWorker.terminated += 1; }
    }
    const outcomes = await Promise.all([...Array(20)].map((_, index) => {
      const request = requestTripleGeneration({
        mode: "easy", seed: `cancel-${index}`, level: 1, WorkerClass: PendingWorker,
      });
      request.cancel();
      return request.promise.then(() => "resolved", () => "cancelled");
    }));
    return { outcomes, terminated: PendingWorker.terminated };
  });
  expect(result.outcomes).toEqual(Array(20).fill("cancelled"));
  expect(result.terminated).toBe(20);
});

test("Triple start returns control to the browser within the CPU 6x responsiveness budget", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("/");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  const metrics = await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    const { setMeteorEffectsEnabled } = await import("/js/backgroundEffects.js");
    setMeteorEffectsEnabled(false);
    const samples = [];
    let currentRun = null;
    for (const [index, mode] of ["normal", "hard", "superHard"].entries()) {
      const startedAt = performance.now();
      const pending = startTripleConnectRound({ mode, seed: `cpu-6x-${mode}`, skipIntro: true });
      const sample = {
        elapsed: performance.now() - startedAt,
        loading: Boolean(document.querySelector("#triple-generation-loading")),
      };
      samples.push(sample);
      currentRun = await pending;
      sample.boardReady = performance.now() - startedAt;
      if (index < 2) document.querySelector("#triple-actions-menu-toggle")?.click();
    }
    await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    // The frame sample is an idle budget, so start it after decode and the
    // layout's settling turn rather than charging board-ready paint work.
    await new Promise((resolve) => setTimeout(resolve, 300));
    const frames = [];
    let previous = performance.now();
    for (let index = 0; index < 30; index += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const current = performance.now();
      frames.push(current - previous);
      previous = current;
    }
    frames.sort((left, right) => left - right);
    const clickPatches = [];
    for (const command of currentRun.generated.witness.slice(0, 30)) {
      const tile = document.querySelector(`[data-tile-id="${command.tileId}"]`);
      if (!tile || tile.disabled) throw new Error("Worker witness did not expose its next playable tile.");
      const startedAt = performance.now();
      tile.click();
      clickPatches.push(performance.now() - startedAt);
      await new Promise((resolve) => setTimeout(resolve, 320));
    }
    clickPatches.sort((left, right) => left - right);
    return {
      samples,
      frameP95: frames[Math.ceil(frames.length * 0.95) - 1],
      clickP95: clickPatches[Math.ceil(clickPatches.length * 0.95) - 1],
      clickMax: clickPatches.at(-1),
    };
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await cdp.detach();
  await testInfo.attach("triple-cpu-6x-metrics.json", {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });
  expect(metrics.samples.every((sample) => !sample.loading)).toBe(true);
  expect(Math.max(...metrics.samples.map((sample) => sample.elapsed))).toBeLessThanOrEqual(100);
  expect(metrics.frameP95).toBeLessThanOrEqual(25);
  expect(metrics.clickP95).toBeLessThanOrEqual(75);
  expect(metrics.clickMax).toBeLessThanOrEqual(100);
});

test("Triple production controller mounts after its worker result without a blocking overlay", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    const pending = startTripleConnectRound({ mode: "hard", seed: "worker-controller", skipIntro: true });
    const loadingVisible = Boolean(document.querySelector("#triple-generation-loading"));
    const run = await pending;
    return {
      loadingVisible,
      mounted: Boolean(document.querySelector(".triple-connect__board")),
      tiles: Object.keys(run.getState().tiles).length,
    };
  });
  expect(result).toEqual({ loadingVisible: false, mounted: true, tiles: 78 });
});
