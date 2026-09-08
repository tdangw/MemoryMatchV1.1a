import { expect, test } from "@playwright/test";

test("Link shell owns controls once per round and preserves patched tile identity", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    const controller = await import("/js/linkConnect/linkController.js");
    const { getLinkShell } = await import("/js/linkConnect/linkShell.js");
    const { linkGameState } = await import("/js/linkConnect/linkState.js");
    const { gameState } = await import("/js/gameState.js");
    const { renderLinkBoard } = await import("/js/linkConnect/linkRenderer.js");
    let refs;
    const checks = [];
    for (const level of [1, 7, 14, 28, 29]) {
      controller.startLinkLevel({ mode: "challenge", level });
      const shell = getLinkShell();
      refs ||= shell.refs;
      const tiles = [...refs.board.querySelectorAll(".link-tile")];
      renderLinkBoard(linkGameState.board);
      const stableTiles = tiles.every(tile => tile.isConnected && refs.board.querySelector(`[data-tile-key="${tile.dataset.tileKey}"]`) === tile);
      document.querySelector("#link-actions-menu-toggle").click();
      const openedOnce = !document.querySelector("#link-actions-menu").hidden;
      document.querySelector("#link-actions-menu-toggle").click();
      gameState.progress.linkConnect.items.hint = 20;
      linkGameState.isLocked = false;
      linkGameState.isPaused = false;
      document.querySelector('[data-item="hint"]').click();
      checks.push({ stableTiles, stableRefs: refs === shell.refs, openedOnce, hints: gameState.progress.linkConnect.items.hint,
        controls: refs.root.querySelectorAll("[data-item]").length });
      shell.unmount();
      document.querySelector('[data-item="hint"]').click();
      if (gameState.progress.linkConnect.items.hint !== 19) throw Error("Detached round still handles tools");
    }
    return checks;
  });
  for (const check of result) expect(check).toEqual({ stableTiles: true, stableRefs: true, openedOnce: true, hints: 19, controls: 4 });
});
