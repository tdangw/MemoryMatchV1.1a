import { expect, test } from "@playwright/test";

for (const gameId of ["memory-match", "link-connect"]) {
  for (const fromMenu of [true, false]) {
    test(`${gameId}: buy every item ${fromMenu ? "before play" : "in game"}`, async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".game-selector__choice").first()).toBeVisible();
      const initial = await page.evaluate(async ({ gameId, fromMenu }) => {
        const { gameState } = await import("/js/gameState.js");
        gameState.coins = 10000;
        gameState.isLocked = false;
        gameState.isPaused = false;
        gameState.remainingTime = 73;
        const items = gameId === "memory-match"
          ? (await import("/js/shopCatalog.js")).SHOP_ITEMS.filter(item => !fromMenu || item.type !== "hint")
          : (await import("/js/linkConnect/linkItems.js")).LINK_ITEMS;
        const key = gameId === "memory-match" ? "memoryMatch" : "linkConnect";
        const before = { ...gameState.progress[key].items };
        (await import("/js/shop.js")).openShopOverlay({ gameId, fromMenu, linkConnect: gameId === "link-connect" });
        return { items, before, key };
      }, { gameId, fromMenu });
      await expect(page.locator("#shop-modal .appearance-choice")).toHaveCount(gameId === "link-connect" ? 4 : fromMenu ? 8 : 12);
      for (const item of initial.items) {
        const card = page.locator("#shop-modal .appearance-choice").filter({ has: page.getByText(item.title, { exact: true }) });
        await card.locator(".shop-buy-button").click();
        await page.getByRole("button", { name: "Mua ngay", exact: true }).click();
        await expect(page.locator("#shop-confirm-modal")).toHaveCount(0);
      }
      const expectedCoins = 10000 - initial.items.reduce((sum, item) => sum + item.price, 0);
      const after = await page.evaluate(async key => {
        const { gameState } = await import("/js/gameState.js");
        return { coins: gameState.coins, items: gameState.progress[key].items, time: gameState.remainingTime };
      }, initial.key);
      expect(after.coins).toBe(expectedCoins);
      expect(after.time).toBe(73);
      for (const item of initial.items.filter(item => item.type !== "hint")) {
        const id = gameId === "link-connect" ? item.id : item.type === "time" ? `time${item.value}` : item.type === "reveal-all" ? "previewAll" : `preview${item.value}`;
        expect(after.items[id]).toBe((initial.before[id] || 0) + 1);
      }
      await page.reload();
      await expect(page.locator(".game-selector__choice").first()).toBeVisible();
      const saved = await page.evaluate(async key => {
        const { gameState } = await import("/js/gameState.js");
        return { coins: gameState.coins, items: gameState.progress[key].items };
      }, initial.key);
      expect(saved).toEqual({ coins: after.coins, items: after.items });
    });
  }
}
