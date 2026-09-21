import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const EFFECT_IDS = ["default", "finedust", "split8", "pixel"];

test("Effect V2 production performance budget", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?effect-performance=1");
  await page.waitForFunction(() => Boolean(window.__effectV2Performance));
  const metrics = await page.evaluate(async effectIds => {
    const { openGameMenu, startLinkLevel, renderConnectionV2, clearConnectionV2, playCanvasExit, clearCanvasExit } = window.__effectV2Performance;
    openGameMenu("link-connect");
    startLinkLevel({ mode: "easy" });
    const frame = document.querySelector("#link-board-frame"); const surface = document.querySelector("#link-path-overlay");
    await Promise.all([...frame.querySelectorAll("img")].map(image => image.decode().catch(() => undefined)));
    const allTiles = [...frame.querySelectorAll(".link-tile")];
    const tiles = allTiles.slice(0, 2); const third = allTiles[2];
    const samples = Object.fromEntries(effectIds.map(id => [id, { exit2: [], exit3: [], frame: [] }]));
    const connectionSamples=[]; const long=[]; const observer = new PerformanceObserver(list => list.getEntries().forEach(entry => long.push(entry.duration))); observer.observe({ type: "longtask", buffered: true });
    for (let i=0;i<10;i++) { renderConnectionV2({surface,points:[{x:0,y:0},{x:20,y:20}],effect:{id:"default"},seed:i}); clearConnectionV2(surface); }
    for (const effectId of effectIds) {
      playCanvasExit({frame,tiles,exitId:effectId,quality:"medium"}); await new Promise(requestAnimationFrame); clearCanvasExit();
      playCanvasExit({frame,tiles:[...tiles,third],exitId:effectId,quality:"medium"}); await new Promise(requestAnimationFrame); clearCanvasExit();
    }
    const baseline = { canvas: document.querySelectorAll(".link-card-exit-effect").length, nodes: surface.querySelectorAll("*").length };
    for (let i=0;i<100;i++) {
      const started=performance.now(); renderConnectionV2({surface,points:[{x:0,y:0},{x:20,y:20}],effect:{id:"default"},seed:i}); connectionSamples.push(performance.now()-started); clearConnectionV2(surface);
      const effectId=effectIds[i%effectIds.length]; const effectSamples=samples[effectId]; const diagnostics={recordFrame(value) { if (effectSamples.frame.length < 1024) effectSamples.frame.push(value); }};
      let t=performance.now(); playCanvasExit({frame,tiles,exitId:effectId,quality:"medium",diagnostics}); effectSamples.exit2.push(performance.now()-t); await new Promise(requestAnimationFrame); clearCanvasExit();
      t=performance.now(); playCanvasExit({frame,tiles:[...tiles,third],exitId:effectId,quality:"medium",diagnostics}); effectSamples.exit3.push(performance.now()-t); await new Promise(requestAnimationFrame); clearCanvasExit();
    }
    observer.disconnect(); const stat = values => { const sorted=[...values].sort((a,b)=>a-b); return {count:sorted.length,p50:sorted[Math.floor(sorted.length*.5)]||0,p95:sorted[Math.ceil(sorted.length*.95)-1]||0,max:sorted.at(-1)||0}; };
    const effects=Object.fromEntries(effectIds.map(id => [id, {renderPath:id === "default" ? "css" : "canvas",exit2:stat(samples[id].exit2),exit3:stat(samples[id].exit3),frame:stat(samples[id].frame)}]));
    const aggregateValues = metric => effectIds.flatMap(id => samples[id][metric]);
    const after = { canvas: document.querySelectorAll(".link-card-exit-effect").length, nodes: surface.querySelectorAll("*").length };
    return { matches:100, connection:stat(connectionSamples), effects, aggregate:{exit2:stat(aggregateValues("exit2")),exit3:stat(aggregateValues("exit3")),frame:stat(aggregateValues("frame"))}, long:stat(long), lifecycle:{baseline,after} };
  }, EFFECT_IDS);
  const result = { profile: testInfo.project.name, viewport: testInfo.project.use.viewport, quality: "medium", particleBudget: 28, metrics };
  await writeFile(testInfo.outputPath("effect-v2-performance.json"), JSON.stringify(result, null, 2));
  const reportDirectory = new URL("../../playwright-report/effect-v2-performance/", import.meta.url);
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(new URL(`${testInfo.project.name}.json`, reportDirectory), JSON.stringify(result, null, 2));
  expect(metrics.matches).toBe(100);
  expect(metrics.connection.p95).toBeLessThanOrEqual(3);
  for (const effectId of EFFECT_IDS) {
    const effect = metrics.effects[effectId];
    expect(effect.exit2.count, `${effectId} two-target sample count`).toBe(25);
    expect(effect.exit3.count, `${effectId} three-target sample count`).toBe(25);
    expect(effect.exit2.p95, `${effectId} two-target setup p95`).toBeLessThanOrEqual(4);
    expect(effect.exit3.p95, `${effectId} three-target setup p95`).toBeLessThanOrEqual(6);
    if (effect.renderPath === "canvas") {
      expect(effect.frame.count, `${effectId} frame sample count`).toBeGreaterThan(0);
      expect(effect.frame.p95, `${effectId} draw-frame p95`).toBeLessThanOrEqual(8);
    } else {
      expect(effect.frame.count, `${effectId} CSS path must not schedule Canvas frames`).toBe(0);
    }
  }
  expect(metrics.long.max).toBeLessThanOrEqual(50);
  expect(metrics.lifecycle.after).toEqual(metrics.lifecycle.baseline);
});
