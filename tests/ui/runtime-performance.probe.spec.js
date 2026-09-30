import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const SCENARIOS = [
  { id: "memory-match", mode: "superHard" },
  { id: "link-connect", mode: "superHard" },
  { id: "triple-connect", mode: "superHard" },
];

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] || 0;
}

test("runtime performance probe records all three games", async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cdp = await page.context().newCDPSession(page);
  const profiles = [];
  for (const cpuRate of [1, 6]) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
    for (const scenario of SCENARIOS) {
      const metrics = await page.evaluate(async ({ id, mode }) => {
        const longTasks = [];
        const observer = new PerformanceObserver((list) => {
          longTasks.push(...list.getEntries().map((entry) => entry.duration));
        });
        observer.observe({ type: "longtask" });
        const startedAt = performance.now();
        const { openGameMenu } = await import("/js/gameSelector.js");
        const { gameState } = await import("/js/gameState.js");
        gameState.settings.sound = false;
        gameState.settings.music = false;
        gameState.settings.mode = mode;
        openGameMenu(id);
        let startCommandMs = 0;
        const commandStartedAt = performance.now();
        if (id === "memory-match") {
          await (await import("/js/gameController.js")).startNewMemoryRun();
          startCommandMs = performance.now() - commandStartedAt;
        } else if (id === "link-connect") {
          await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode });
          startCommandMs = performance.now() - commandStartedAt;
        } else {
          const pending = (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({
            mode,
            seed: `runtime-probe-${mode}`,
            skipIntro: true,
          });
          startCommandMs = performance.now() - commandStartedAt;
          await pending;
        }
        const domReadyMs = performance.now() - startedAt;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await Promise.all([...document.querySelectorAll('[data-shell-region="board"] img')]
          .map((image) => image.decode().catch(() => undefined)));
        const boardReadyMs = performance.now() - startedAt;
        const startLongTasks = [...longTasks];
        longTasks.length = 0;
        const effectSetupSamples = [];
        const effectSetupSamplesById = {};
        if (id === "link-connect") {
          const { renderConnectionV2, clearConnectionV2 } = await import("/js/effects/connectionEngine.js");
          const { getEffectV2Path } = await import("/js/effects/effectCatalog.js");
          const surface = document.querySelector("#link-path-overlay");
          const pathEffectIds = ["default", "dashed", "bullet", "kame", "halo", "sonic", "chains", "meteor", "poison"];
          for (let index = 0; index < 90; index += 1) {
            const pathEffectId = pathEffectIds[index % pathEffectIds.length];
            const started = performance.now();
            renderConnectionV2({
              surface,
              points: [{ x: 8, y: 18 }, { x: 52, y: 18 }, { x: 52, y: 82 }, { x: 92, y: 82 }],
              effect: getEffectV2Path(pathEffectId),
              seed: index + 1,
            });
            const elapsed = performance.now() - started;
            effectSetupSamples.push(elapsed);
            (effectSetupSamplesById[pathEffectId] ||= []).push(elapsed);
            clearConnectionV2(surface);
            if ((index + 1) % 10 === 0) await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        }
        const effectLongTasks = [...longTasks];
        longTasks.length = 0;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        longTasks.length = 0;
        const frameTimes = await new Promise((resolve) => {
          const timestamps = [];
          const sample = (timestamp) => {
            timestamps.push(timestamp);
            if (timestamps.length >= 91) {
              resolve(timestamps.slice(1).map((value, index) => value - timestamps[index]));
              return;
            }
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        observer.disconnect();
        const rootSelector = id === "memory-match"
          ? "#game-container"
          : id === "link-connect"
            ? "#link-connect-container"
            : "#triple-connect-container";
        const boardSelector = id === "memory-match"
          ? "#grid-container .tile"
          : id === "link-connect"
            ? "#link-board .link-tile"
            : ".triple-connect__board .triple-connect__tile";
        return {
          startCommandMs,
          domReadyMs,
          boardReadyMs,
          startLongTasks,
          effectLongTasks,
          idleLongTasks: longTasks,
          frameTimes,
          activeDomNodes: document.querySelector(rootSelector)?.querySelectorAll("*").length || 0,
          tiles: document.querySelectorAll(boardSelector).length,
          effectSetupSamples,
          effectSetupSamplesById,
        };
      }, scenario);
      profiles.push({
        ...scenario,
        cpuRate,
        startCommandMs: metrics.startCommandMs,
        domReadyMs: metrics.domReadyMs,
        decodeSettleMs: metrics.boardReadyMs - metrics.domReadyMs,
        boardReadyMs: metrics.boardReadyMs,
        startLongestTaskMs: Math.max(0, ...metrics.startLongTasks),
        idleLongestTaskMs: Math.max(0, ...metrics.idleLongTasks),
        linkEffectLongestTaskMs: Math.max(0, ...metrics.effectLongTasks),
        idleFrameP95Ms: percentile(metrics.frameTimes, .95),
        idleFrameMaxMs: Math.max(...metrics.frameTimes),
        activeDomNodes: metrics.activeDomNodes,
        tiles: metrics.tiles,
        linkEffectSetupP95Ms: metrics.effectSetupSamples.length ? percentile(metrics.effectSetupSamples, .95) : null,
        linkEffectSetupById: Object.fromEntries(Object.entries(metrics.effectSetupSamplesById)
          .map(([id, samples]) => [id, { p95: percentile(samples, .95), max: Math.max(...samples) }])),
      });
    }
  }
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await writeFile(testInfo.outputPath("runtime-performance-probe.json"), JSON.stringify(profiles, null, 2));
  expect(profiles).toHaveLength(6);
  expect(profiles.every((entry) => entry.tiles > 0)).toBe(true);
});
