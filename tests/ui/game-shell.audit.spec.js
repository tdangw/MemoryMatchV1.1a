import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

const preservationBaseline = JSON.parse(await readFile(new URL("./baselines/phase1-measurements.json", import.meta.url), "utf8"));

// Review candidates only: never update an approved golden image implicitly.
for (const [id, title, root, board] of [
  ["memory", "Memory Match", "#game-container", "#grid-board-frame"],
  ["link", "Link Connect", "#link-connect-container", "#link-board-frame"],
]) {
  test(`${title}: controlled shared shell audit`, async ({ page }, testInfo) => {
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
    await page.locator('[data-level="1"]').click();
  await page.getByRole("button", { name: "Chơi", exact: true }).click();
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.activeElement?.blur());
    // Advance virtual time, not wall time; settle preview, popup and layout callbacks.
    await page.clock.runFor(15000);
    await expect(page.locator(".level-reward-overlay")).toHaveCount(0);
    await expect(page.locator(`${root} .is-locked`)).toHaveCount(0);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    await page.addStyleTag({ content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }" });
    const contract = await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map(node => node.id);
      const brokenControls = [...document.querySelectorAll("[aria-controls]")].flatMap(node =>
        node.getAttribute("aria-controls").split(/\s+/).filter(id => !document.getElementById(id)));
      return { duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index), brokenControls };
    });
    expect(contract).toEqual({ duplicateIds: [], brokenControls: [] });
    if (id === "memory") {
      const overlaps = await page.evaluate(() => {
        const controls = [...document.querySelectorAll("#game-title .game-menu-toggle, #game-title .game-quick-action, #game-title .game-hint-fab, #game-title .game-stats .stat-card")]
          .map(node => ({ name: node.id || node.className, rect: node.getBoundingClientRect() })).filter(({ rect }) => rect.width && rect.height);
        return controls.flatMap((a, index) => controls.slice(index + 1).filter(b =>
          Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 1 &&
          Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top) > 1).map(b => `${a.name} / ${b.name}`));
      });
      expect(overlaps, "Inventory tools must not overlap stats").toEqual([]);
    }
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
        dockElements: shell.querySelector('.adventure-dock').querySelectorAll('*').length + 1,
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
        fullscreenElements: shell.querySelectorAll(".shell-fullscreen-button, .shell-fullscreen-button *, .shell-fullscreen-status").length,
        animationsRunning: document.getAnimations().filter(animation => animation.playState === "running").length,
      };
    }, { root, board });
    expect(metrics.animationsRunning).toBe(0);
    const baseline = preservationBaseline.samples.find(sample => sample.case ===
      `game-shell.audit-${title.replaceAll(" ", "-")}-controlled-Phase-1-audit-${testInfo.project.name}`);
    const visualCandidateViewport = testInfo.project.name.startsWith("portrait-")
      || testInfo.project.name.startsWith("landscape-");
    expect(baseline || visualCandidateViewport, "Every non-candidate viewport/game must have a preservation baseline").toBeTruthy();
    const shellOwnedRegions = metrics.regions
      .map(region => region.selector)
      .map(selector => selector.split(' ')[0])
      .filter(selector => !['shell-fullscreen-button', 'shell-fullscreen-status', 'adventure-dock'].includes(selector));
    if (baseline) expect(shellOwnedRegions).toEqual(baseline.metrics.regions.map(region => region.selector.split(' ')[0]));
    await expect(page.locator(`${root} .adventure-dock button`)).toHaveText(['Cửa hàng', 'Bộ sưu tập', 'Xếp hạng', 'Cài đặt']);
    // The user intentionally unified the frame with Link Connect. Keep Phase 1
    // DOM budgets, but validate the new geometry and fullscreen in current snapshots.
    for (const region of metrics.regions) {
      expect(region.x).toBeGreaterThanOrEqual(-1);
      expect(region.x + region.width).toBeLessThanOrEqual(metrics.viewport.width + 1);
      expect(region.y).toBeGreaterThanOrEqual(-1);
      expect(region.y + region.height).toBeLessThanOrEqual(metrics.viewport.height + 1);
    }
    expect(metrics.fullscreenElements).toBe(5);
    const comboProgressElements = await page.locator(`${root} .combo-window-progress`).count();
    expect(comboProgressElements, "Each game shell owns one WAAPI combo progress node").toBe(1);
    if (baseline) {
      expect(metrics.shellElementsExcludingBoard - metrics.fullscreenElements - comboProgressElements - metrics.dockElements)
        .toBeLessThanOrEqual(baseline.metrics.shellElementsExcludingBoard);
      expect(metrics.boardElements).toBe(baseline.metrics.boardElements);
    }
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("HeapProfiler.collectGarbage");
    metrics.documentCounters = await cdp.send("Memory.getDOMCounters");
    await cdp.detach();
    await writeFile(testInfo.outputPath(`${id}.json`), JSON.stringify(metrics, null, 2));
    const first = await page.screenshot({ path: testInfo.outputPath(`${id}-candidate.png`) });
    expect(await page.screenshot()).toEqual(first);
    if (process.env.GAME_SHELL_VISUAL_CANDIDATES === "1") {
      await expect(page).toHaveScreenshot(`${id}.png`, { maxDiffPixels: 0, animations: "disabled" });
    }
  });
}
