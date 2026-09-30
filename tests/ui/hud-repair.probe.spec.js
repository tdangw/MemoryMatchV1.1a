import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test("HUD repair records reproducible geometry and hot patch work", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const phase = process.env.HUD_REPAIR_PHASE || "final";
  const directory = `test-results/hud-repair-${phase}`;
  await mkdir(directory, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const profiles = [];
  for (const id of ["memory-match", "link-connect", "triple-connect"]) {
    await page.evaluate(async id => {
      await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id);
      const { gameState } = await import("/js/gameState.js");
      gameState.settings.sound = false;
      gameState.settings.music = false;
      gameState.settings.mode = "easy";
      if (id === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun();
      else if (id === "link-connect") await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
      else await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ mode: "easy", seed: "hud-repair", skipIntro: true });
      (await import("/js/ui.js")).clearGameplayRewardPopups();
    }, id);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: `${directory}/${id}.png` });
    const before = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value]));
    const result = await page.evaluate(async id => {
      const { getGameShellDiagnostics } = await import("/js/gameShell/gameShell.js");
      const shell = getGameShellDiagnostics().activeShell;
      const root = shell.root;
      const hud = root.querySelector('[data-shell-region="hud"]');
      const { createGameShellHud } = await import("/js/gameShell/gameShellHud.js");
      const moves = hud.querySelector(".stat-moves > :last-child");
      const component = createGameShellHud({ stats: { moves: { element: moves } } });
      const board = root.querySelector('[data-shell-region="board"]');
      const nodes = [...board.querySelectorAll("*")];
      const observer = new MutationObserver(() => {});
      observer.observe(board, { subtree: true, attributes: true, childList: true, characterData: true });
      const longTasks = [];
      const longObserver = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(entry => entry.duration)));
      longObserver.observe({ type: "longtask" });
      const samples = [];
      for (let batch = 0; batch < 30; batch++) {
        const start = performance.now();
        for (let index = 0; index < 100; index++) component.stats({ moves: batch * 100 + index });
        samples.push(performance.now() - start);
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      const boardMutations = observer.takeRecords().length;
      observer.disconnect();
      await new Promise(resolve => requestAnimationFrame(resolve));
      longObserver.disconnect();
      const bounds = hud.getBoundingClientRect();
      return { id, hudNodes: hud.querySelectorAll("*").length, scope: shell.scope.diagnostics(), hudBounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, patchMs: samples, longTasks, boardMutations, boardStable: nodes.every(node => node.isConnected) };
    }, id);
    const after = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value]));
    result.work = Object.fromEntries(["LayoutCount", "RecalcStyleCount", "LayoutDuration", "RecalcStyleDuration", "TaskDuration"].map(key => [key, after[key] - before[key]]));
    expect(result.boardStable).toBe(true);
    expect(result.boardMutations).toBe(0);
    profiles.push(result);
  }
  await writeFile(`${directory}/measurements.json`, JSON.stringify(profiles, null, 2));
});
