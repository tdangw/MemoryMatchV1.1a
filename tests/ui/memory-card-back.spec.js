import { expect, test } from "@playwright/test";

const GENERATED_CARD_BACKS = [
  { id: "moonlit-garden", title: "Nguyệt Viên", price: 280 },
  { id: "starlight-path", title: "Tinh Lộ", price: 300 },
  { id: "crystal-triad", title: "Tam Tinh", price: 320 },
  { id: "lunar-pair", title: "Song Nguyệt", price: 340 },
  { id: "azure-link", title: "Lam Tuyến", price: 360 },
  { id: "crystal-trio-light", title: "Tam Quang", price: 380 },
];

async function openMoonMountainShopCard(page) {
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.coins = 500;
    (await import("/js/shop.js")).openShopOverlay({
      gameId: "memory-match",
      fromMenu: true,
    });
  });
  await page.locator("#shop-modal").getByRole("tab", { name: "Ngoại hình", exact: true }).click();
  return page.locator("#shop-modal .appearance-choice").filter({
    has: page.getByText("Nguyệt Sơn", { exact: true }),
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
});

test("Nguyệt Sơn can be purchased, equipped, reloaded, and rendered in Memory Match", async ({ page }) => {
  const asset = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/assets/images/card-backs/moon-mountain.webp";
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(asset).toEqual({ width: 256, height: 256 });

  const shopCard = await openMoonMountainShopCard(page);
  await expect(shopCard).toHaveCount(1);
  await expect(shopCard.locator(".appearance-preview")).toHaveCSS(
    "background-image",
    /card-backs\/moon-mountain\.webp/,
  );
  await expect(shopCard.locator(".shop-buy-button")).toContainText("260");
  await shopCard.locator(".shop-buy-button").click();
  await page.getByRole("button", { name: "Mua ngay", exact: true }).click();
  await expect(page.locator("#shop-confirm-modal")).toHaveCount(0);
  await page.locator("#shop-modal").getByRole("button", { name: "Đóng" }).click();

  await page.evaluate(async () => {
    (await import("/js/mainmenu.js")).showCollectionModal({ gameId: "memory-match" });
  });
  const collectionCard = page.locator("#collection-modal .appearance-choice").filter({
    has: page.getByText("Nguyệt Sơn", { exact: true }),
  });
  await expect(collectionCard).toHaveCount(1);
  await collectionCard.getByRole("button", { name: "Trang bị", exact: true }).click();
  await expect(collectionCard.getByRole("button", { name: "Đang dùng", exact: true })).toBeDisabled();
  await page.locator("#collection-modal").getByRole("button", { name: "Đóng" }).click();

  const state = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    return {
      coins: gameState.coins,
      cardBack: gameState.appearance.cardBack,
      owned: gameState.appearance.ownedCardBacks,
    };
  });
  expect(state).toMatchObject({ coins: 240, cardBack: "moon-mountain" });
  expect(state.owned).toContain("moon-mountain");

  await page.reload();
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("memory-match");
    await (await import("/js/gameController.js")).startNewMemoryRun(1);
  });
  const tile = page.locator("#grid-container .tile").first();
  await expect(tile).toBeVisible();
  await expect(tile).toHaveClass(/card-back--moon-mountain/);
  await expect(tile).toHaveCSS("background-image", /card-backs\/moon-mountain\.webp/);
  const backgroundBeforeHover = await tile.evaluate((node) => getComputedStyle(node).backgroundImage);
  await tile.hover();
  await expect(tile).toHaveCSS("border-color", "rgb(255, 77, 77)");
  await expect.poll(() => tile.evaluate((node) => getComputedStyle(node).backgroundImage))
    .toBe(backgroundBeforeHover);

  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await expect(tile).toBeVisible();
    await expect(tile).toHaveCSS("background-image", /card-backs\/moon-mountain\.webp/);
  }
});

test("Nguyệt Sơn purchase and equip roll back RAM when persistence fails", async ({ page }) => {
  const shopCard = await openMoonMountainShopCard(page);
  await shopCard.locator(".shop-buy-button").click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function failCardBackPurchase(key, value) {
      if (key === "memoryMatchSave") throw new Error("forced card-back purchase failure");
      return original.call(this, key, value);
    };
    window.__restoreCardBackStorage = () => { Storage.prototype.setItem = original; };
  });
  await page.getByRole("button", { name: "Mua ngay", exact: true }).click();
  const purchaseState = await page.evaluate(async () => {
    window.__restoreCardBackStorage();
    const { gameState } = await import("/js/gameState.js");
    return {
      coins: gameState.coins,
      owned: gameState.appearance.ownedCardBacks,
    };
  });
  expect(purchaseState.coins).toBe(500);
  expect(purchaseState.owned).not.toContain("moon-mountain");

  await page.locator("#shop-confirm-modal").getByRole("button", { name: "Đóng" }).click();
  await page.locator("#shop-modal").getByRole("button", { name: "Đóng" }).click();
  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.appearance.ownedCardBacks.push("moon-mountain");
    (await import("/js/mainmenu.js")).showCollectionModal({ gameId: "memory-match" });
  });
  const collectionCard = page.locator("#collection-modal .appearance-choice").filter({
    has: page.getByText("Nguyệt Sơn", { exact: true }),
  });
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function failCardBackEquip(key, value) {
      if (key === "memoryMatchSave") throw new Error("forced card-back equip failure");
      return original.call(this, key, value);
    };
    window.__restoreCardBackStorage = () => { Storage.prototype.setItem = original; };
  });
  await collectionCard.getByRole("button", { name: "Trang bị", exact: true }).click();
  const equipState = await page.evaluate(async () => {
    window.__restoreCardBackStorage();
    return (await import("/js/gameState.js")).gameState.appearance.cardBack;
  });
  expect(equipState).toBe("classic");
  await expect(collectionCard.getByRole("button", { name: "Trang bị", exact: true })).toBeEnabled();
});

test("game-inspired card backs are valid catalog assets", async ({ page }) => {
  const assets = await page.evaluate(async (cardBacks) => Promise.all(cardBacks.map(async ({ id }) => {
    const image = new Image();
    image.src = `/assets/images/card-backs/${id}.webp`;
    await image.decode();
    return { id, width: image.naturalWidth, height: image.naturalHeight };
  })), GENERATED_CARD_BACKS);
  expect(assets).toEqual(GENERATED_CARD_BACKS.map(({ id }) => ({ id, width: 256, height: 256 })));

  await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    gameState.coins = 1000;
    (await import("/js/shop.js")).openShopOverlay({
      gameId: "memory-match",
      fromMenu: true,
    });
  });
  await page.locator("#shop-modal").getByRole("tab", { name: "Ngoại hình", exact: true }).click();

  for (const cardBack of GENERATED_CARD_BACKS) {
    const card = page.locator("#shop-modal .appearance-choice").filter({
      has: page.getByText(cardBack.title, { exact: true }),
    });
    await expect(card).toHaveCount(1);
    await expect(card.locator(".appearance-preview")).toHaveCSS(
      "background-image",
      new RegExp(`card-backs/${cardBack.id}\\.webp`),
    );
    await expect(card.locator(".shop-buy-button")).toContainText(String(cardBack.price));
  }
});
