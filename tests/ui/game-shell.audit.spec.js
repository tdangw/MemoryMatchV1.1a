import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

const preservationBaseline = JSON.parse(await readFile(new URL("./baselines/phase1-measurements.json", import.meta.url), "utf8"));

// Review candidates only: never update an approved golden image implicitly.
for (const [id, title, root, board] of [
  ["memory", "Memory Match", "#game-container", "#grid-board-frame"],
  ["link", "Link Connect", "#link-connect-container", "#link-board-frame"],
]) {
  test(`${title}: controlled Phase 1 audit`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date("2026-09-07T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-09-07T00:00:01Z"));
    await page.addInitScript(() => {
      localStorage.clear();
      let seed = 20260907;
      Math.random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    });
    await page.goto("/");
    await page.evaluate(async () => {
      const { gameState } = await import("/js/gameState.js");
      gameState.settings.sound = false;
      gameState.settings.music = false;
      const { setMeteorEffectsEnabled } = await import("/js/backgroundEffects.js");
      setMeteorEffectsEnabled(false);
      const pending = { timeout: new Set(), interval: new Set(), frame: new Set() };
      for (const [kind, set, clear] of [
        ["timeout", "setTimeout", "clearTimeout"],
        ["interval", "setInterval", "clearInterval"],
        ["frame", "requestAnimationFrame", "cancelAnimationFrame"],
      ]) {
        const schedule = window[set].bind(window);
        const cancel = window[clear].bind(window);
        window[set] = (callback, ...args) => {
          const handle = schedule((...values) => {
            if (kind !== "interval") pending[kind].delete(handle);
            callback(...values);
          }, ...args);
          pending[kind].add(handle);
          return handle;
        };
        window[clear] = (handle) => {
          pending[kind].delete(handle);
          return cancel(handle);
        };
      }
      window.auditPending = () => Object.fromEntries(Object.entries(pending).map(([key, handles]) => [key, handles.size]));
    });
    await page.locator(".game-selector__choice").filter({ hasText: title }).click();
    await page.locator(".menu-item").filter({ hasText: "Bắt đầu" }).click();
    await page.locator("#difficulty-modal .difficulty-option").filter({ hasText: "Dễ" }).click();
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.activeElement?.blur());
    // Advance virtual time, not wall time; settle preview, popup and layout callbacks.
    // Compare markup migration separately from the new fullscreen feature.
    if (process.env.GAME_SHELL_AUDIT_WITHOUT_FULLSCREEN === "1") {
      await page.evaluate(() => {
        document.querySelectorAll(".shell-fullscreen-button, .shell-fullscreen-status").forEach(node => node.remove());
        document.querySelectorAll(".shell-fullscreen-title").forEach(node => node.classList.remove("shell-fullscreen-title"));
      });
    }
    await page.clock.runFor(15000);
    await expect(page.locator(".level-reward-overlay")).toHaveCount(0);
    await expect(page.locator(`${root} .is-locked`)).toHaveCount(0);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    await page.addStyleTag({ content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }" });
    const metrics = await page.evaluate(({ root, board }) => {
      const shell = document.querySelector(root);
      const grid = shell.querySelector(".link-board, #grid-container");
      const gridStyle = getComputedStyle(grid);
      const number = name => Number.parseFloat(gridStyle.getPropertyValue(name)) || 0;
      const rect = element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        viewport: { width: innerWidth, height: innerHeight },
        regions: [...shell.children].map(element => ({ selector: element.id || element.className, ...rect(element) })),
        shellElementsExcludingBoard: [...shell.querySelectorAll("*")].filter(element => !element.closest(board)).length + 1,
        boardElements: document.querySelector(board).querySelectorAll("*").length + 1,
        scheduledSinceMenu: window.auditPending(),
        timer: getComputedStyle(shell.querySelector(".game-hud"), "::after").height,
        gridFit: {
          columns: number("--link-columns") || number("--grid-columns"),
          rows: number("--link-rows") || number("--grid-rows"),
          gap: number("gap"),
          insetsX: number("padding-left") + number("padding-right") + number("border-left-width") + number("border-right-width"),
          insetsY: number("padding-top") + number("padding-bottom") + number("border-top-width") + number("border-bottom-width"),
        },
        animationsRunning: document.getAnimations().filter(animation => animation.playState === "running").length,
      };
    }, { root, board });
    expect(metrics.animationsRunning).toBe(0);
    const baseline = preservationBaseline.samples.find(sample => sample.case ===
      `game-shell.audit-${title.replaceAll(" ", "-")}-controlled-Phase-1-audit-${testInfo.project.name}`);
    expect(baseline, "Every viewport/game must have a preservation baseline").toBeTruthy();
    expect(metrics.regions.map(region => region.selector)).toEqual(baseline.metrics.regions.map(region => region.selector));
    metrics.regions.forEach((region, index) => {
      for (const dimension of ["x", "y", "width", "height"]) {
        if (id === "link" && region.selector === "link-board-frame" && dimension === "height") {
          // Phase 3 fits the actual tiles to the frame; legacy CSS clamped only
          // its width, leaving the old grid 8–16px wider than the frame.
          const fit = metrics.gridFit;
          const tile = (region.width - fit.insetsX - fit.gap * (fit.columns - 1)) / fit.columns;
          const fittedHeight = tile * fit.rows + fit.gap * (fit.rows - 1) + fit.insetsY;
          expect(Math.abs(region.height - fittedHeight)).toBeLessThanOrEqual(1);
          continue;
        }
        expect(Math.abs(region[dimension] - baseline.metrics.regions[index][dimension]),
          `${region.selector}.${dimension} must stay within 1px`).toBeLessThanOrEqual(1);
      }
    });
    expect(metrics.shellElementsExcludingBoard).toBe(baseline.metrics.shellElementsExcludingBoard);
    expect(metrics.boardElements).toBe(baseline.metrics.boardElements);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("HeapProfiler.collectGarbage");
    metrics.documentCounters = await cdp.send("Memory.getDOMCounters");
    await cdp.detach();
    await writeFile(testInfo.outputPath(`${id}.json`), JSON.stringify(metrics, null, 2));
    const first = await page.screenshot({ path: testInfo.outputPath(`${id}-candidate.png`) });
    expect(await page.screenshot()).toEqual(first);
  });
}
