import { expect, test } from "@playwright/test";

test("HUD patches stay local, skip repeated writes and share timer states", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  for (const id of ["memory-match", "link-connect"]) {
    await page.evaluate(async id => {
      (await import("/js/gameSelector.js")).openGameMenu(id);
      if (id === "memory-match") (await import("/js/gameController.js")).startNewMemoryRun();
      else (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    }, id);
    const result = await page.evaluate(async id => {
      const { createGameShellHud, renderHudTimer } = await import("/js/gameShell/gameShellHud.js");
      const { getMemoryShell } = await import("/js/memoryMatch/memoryShell.js");
      const { getLinkShell } = await import("/js/linkConnect/linkShell.js");
      const shell = id === "memory-match" ? getMemoryShell() : getLinkShell();
      const boardNodes = [...shell.refs.board.querySelectorAll("*")];
      const stat = shell.refs.progress.querySelector(".stat-moves > span:last-child");
      const component = createGameShellHud({ stats: { moves: { element: stat } } });
      const observer = new MutationObserver(() => {});
      observer.observe(shell.refs.root, { subtree: true, attributes: true, childList: true, characterData: true });
      component.stats({ moves: 42 });
      const changed = observer.takeRecords();
      component.stats({ moves: 42 });
      const repeated = observer.takeRecords().length;
      const states = [1, .5, .2].map(progress => {
        renderHudTimer(shell.refs.hud, { progress });
        return ["is-timer-warning", "is-timer-critical", "is-timer-endless"].map(name => shell.refs.hud.classList.contains(name));
      });
      renderHudTimer(shell.refs.hud, { progress: 1, endless: true });
      states.push(["is-timer-warning", "is-timer-critical", "is-timer-endless"].map(name => shell.refs.hud.classList.contains(name)));
      observer.takeRecords();
      renderHudTimer(shell.refs.hud, { progress: 1, endless: true });
      const timerRepeated = observer.takeRecords().length;
      observer.disconnect();
      return { local: changed.length > 0 && changed.every(record => record.target === stat), repeated, timerRepeated, states, boardStable: boardNodes.every(node => node.isConnected) };
    }, id);
    expect(result).toEqual({ local: true, repeated: 0, timerRepeated: 0, boardStable: true, states: [[false,false,false],[true,false,false],[false,true,false],[false,false,true]] });
  }
});

test("HUD tooltip uses definition for mouse and keyboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("memory-match");
    (await import("/js/gameController.js")).startNewMemoryRun();
    (await import("/js/ui.js")).clearGameplayRewardPopups();
  });
  const card = page.locator("#game-progress-hud .stat-star-progress");
  const copy = await card.getAttribute("data-tooltip");
  await card.hover();
  await expect(page.locator("#app-tooltip")).toHaveText(copy);
  await page.mouse.move(0, 0);
  await card.focus();
  await expect(page.locator("#app-tooltip")).toBeVisible();
  await expect(page.locator("#app-tooltip")).toHaveText(copy);
});
