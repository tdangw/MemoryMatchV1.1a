import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

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
        animationsRunning: document.getAnimations().filter(animation => animation.playState === "running").length,
      };
    }, { root, board });
    expect(metrics.animationsRunning).toBe(0);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("HeapProfiler.collectGarbage");
    metrics.documentCounters = await cdp.send("Memory.getDOMCounters");
    await cdp.detach();
    await writeFile(testInfo.outputPath(`${id}.json`), JSON.stringify(metrics, null, 2));
    const first = await page.screenshot({ path: testInfo.outputPath(`${id}-candidate.png`) });
    expect(await page.screenshot()).toEqual(first);
  });
}
