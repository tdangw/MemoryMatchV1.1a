import { expect, test } from "@playwright/test";

test("Triple commerce keeps its catalog, ownership, and equipped appearance separate", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { gameState, hydrateGameState } = await import("/js/gameState.js");
    const {
      purchaseTripleEffect,
      purchaseTripleItem,
      purchaseTripleTheme,
      equipTripleEffect,
      equipTripleTheme,
    } = await import("/js/tripleConnect/tripleTransactions.js");
    hydrateGameState({
      coins: 50,
      appearance: {
        themes: { memoryMatch: "foods", linkConnect: "space" },
        ownedThemes: ["default", "foods", "space"],
      },
    });
    const beforeMemory = structuredClone(gameState.appearance);
    const purchases = {
      item: purchaseTripleItem("time"),
      theme: purchaseTripleTheme("fruits", 1),
      effect: purchaseTripleEffect("path", "electric", 1),
      invalidEffect: purchaseTripleEffect("invalid", "electric", 1),
    };
    const equips = {
      theme: equipTripleTheme("fruits"),
      effect: equipTripleEffect("path", "electric"),
    };
    const { GAMEPLAY_LIMITS } = await import("/js/gameplayTuning.js");
    gameState.progress.tripleConnect.items.time = GAMEPLAY_LIMITS.itemCount;
    const beforeCapPurchase = structuredClone({
      coins: gameState.coins,
      items: gameState.progress.tripleConnect.items,
    });
    const atCap = purchaseTripleItem("time");
    return {
      purchases,
      equips,
      atCap,
      itemLimit: GAMEPLAY_LIMITS.itemCount,
      beforeCapPurchase,
      afterCapPurchase: {
        coins: gameState.coins,
        items: gameState.progress.tripleConnect.items,
      },
      coins: gameState.coins,
      time: gameState.progress.tripleConnect.items.time,
      triple: {
        ownedThemes: gameState.appearance.ownedTripleThemes,
        theme: gameState.appearance.themes.tripleConnect,
        ownedPath: gameState.appearance.ownedTriplePathEffects,
        path: gameState.appearance.triplePathEffect,
      },
      memory: {
        ownedThemes: gameState.appearance.ownedThemes,
        themes: {
          memoryMatch: gameState.appearance.themes.memoryMatch,
          linkConnect: gameState.appearance.themes.linkConnect,
        },
        beforeMemory,
      },
    };
  });
  expect(result.purchases).toEqual({ item: true, theme: true, effect: true, invalidEffect: false });
  expect(result.equips).toEqual({ theme: true, effect: true });
  expect(result.atCap).toBe(false);
  expect(result.afterCapPurchase).toEqual(result.beforeCapPurchase);
  expect(result.time).toBe(result.itemLimit);
  expect(result.triple).toMatchObject({ ownedThemes: ["default", "fruits"], theme: "fruits", ownedPath: ["default", "electric"], path: "electric" });
  expect(result.memory.ownedThemes).toEqual(result.memory.beforeMemory.ownedThemes);
  expect(result.memory.themes).toEqual({ memoryMatch: "foods", linkConnect: "space" });
  await page.reload();
  const reloaded = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return {
      time: gameState.progress.tripleConnect.items.time,
      theme: gameState.appearance.themes.tripleConnect,
      path: gameState.appearance.triplePathEffect,
      ownedThemes: gameState.appearance.ownedTripleThemes,
      ownedPath: gameState.appearance.ownedTriplePathEffects,
      memoryTheme: gameState.appearance.themes.memoryMatch,
    };
  });
  expect(reloaded).toEqual({
    time: 1,
    theme: "fruits",
    path: "electric",
    ownedThemes: ["default", "fruits"],
    ownedPath: ["default", "electric"],
    memoryTheme: "foods",
  });
});

test("Triple shop and collection expose only Triple capabilities", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { openShopOverlay } = await import("/js/shop.js");
    openShopOverlay({ fromMenu: true, gameId: "triple-connect" });
  });
  await expect(page.locator("#shop-modal .shop-tab")).toHaveText(["Vật phẩm", "Đường nối", "Xóa thẻ", "Chủ đề"]);
  await expect(page.locator("#shop-modal .appearance-choice strong")).toHaveText(["Gợi ý", "+1 giây", "Hoàn tác", "Xáo trộn"]);
  await expect(page.locator("#shop-modal")).not.toContainText("Đóng băng");
  await expect(page.locator("#shop-modal")).not.toContainText("Mặt lưng");
  await page.locator("#shop-modal .app-modal__close").click();
  await page.evaluate(async () => {
    const { showCollectionModal } = await import("/js/mainmenu.js");
    showCollectionModal({ gameId: "triple-connect" });
  });
  await expect(page.locator("#collection-modal .shop-tab")).toHaveText(["Chủ đề", "Đường nối", "Xóa thẻ"]);
  await expect(page.locator("#collection-modal")).not.toContainText("Mặt lưng thẻ");
  await expect(page.locator("#collection-modal")).not.toContainText("Hiệu ứng lật");
});

test("Triple appearance purchase and equip roll back when persistence fails", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { gameState, hydrateGameState } = await import("/js/gameState.js");
    const { purchaseTripleTheme, equipTripleTheme } = await import("/js/tripleConnect/tripleTransactions.js");
    hydrateGameState({ coins: 10 });
    const original = Storage.prototype.setItem;
    const before = structuredClone({ coins: gameState.coins, appearance: gameState.appearance });
    Storage.prototype.setItem = function forceFailure(key, value) {
      if (key === "memoryMatchSave") throw new Error("forced commerce failure");
      return original.call(this, key, value);
    };
    let bought;
    try { bought = purchaseTripleTheme("fruits", 1); } finally { Storage.prototype.setItem = original; }
    const afterPurchase = structuredClone({ coins: gameState.coins, appearance: gameState.appearance });
    gameState.appearance.ownedTripleThemes.push("fruits");
    Storage.prototype.setItem = function forceFailure(key, value) {
      if (key === "memoryMatchSave") throw new Error("forced equip failure");
      return original.call(this, key, value);
    };
    const beforeEquip = structuredClone(gameState.appearance);
    let equipped;
    try { equipped = equipTripleTheme("fruits"); } finally { Storage.prototype.setItem = original; }
    return { bought, before, afterPurchase, equipped, beforeEquip, afterEquip: gameState.appearance };
  });
  expect(result.bought).toBe(false);
  expect(result.afterPurchase).toEqual(result.before);
  expect(result.equipped).toBe(false);
  expect(result.afterEquip).toEqual(result.beforeEquip);
});

test("Triple appearance normalization is idempotent and preserves Memory and Link data", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { normalizeAppearance } = await import("/js/appearance.js");
    const legacyAppearance = {
      themes: { memoryMatch: "foods", linkConnect: "space" },
      ownedThemes: ["default", "foods", "space"],
      linkPathEffect: "electric",
      ownedLinkPathEffects: ["default", "electric"],
    };
    const before = structuredClone(legacyAppearance);
    const normalized = normalizeAppearance(legacyAppearance);
    return {
      before,
      legacyAppearance,
      normalized,
      normalizedTwice: normalizeAppearance(normalized),
    };
  });
  expect(result.legacyAppearance).toEqual(result.before);
  expect(result.normalizedTwice).toEqual(result.normalized);
  expect(result.normalized.themes).toEqual({ memoryMatch: "foods", linkConnect: "space", tripleConnect: "default" });
  expect(result.normalized.ownedThemes).toEqual(["default", "foods", "space"]);
  expect(result.normalized).toMatchObject({
    linkPathEffect: "electric",
    ownedLinkPathEffects: ["default", "electric"],
    ownedTripleThemes: ["default"],
    triplePathEffect: "default",
    tripleExitEffect: "default",
    ownedTriplePathEffects: ["default"],
    ownedTripleExitEffects: ["default"],
  });
});
