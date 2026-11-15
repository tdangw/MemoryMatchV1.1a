import { expect, test } from "@playwright/test";

const GAMES = ["memory-match", "link-connect", "triple-connect"];

for (const gameId of GAMES) {
  test(`${gameId} keeps Shop and Collection tabs independently across reopen and reload`, async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".game-selector__choice").first()).toBeVisible();

    await page.evaluate(async game => {
      (await import("/js/shop.js")).openShopOverlay({
        gameId: game,
        fromMenu: true,
        linkConnect: game === "link-connect",
      });
    }, gameId);
    const shop = page.locator("#shop-modal");
    const shopTheme = shop.getByRole("tab", { name: "Chủ đề", exact: true });
    await shopTheme.click();
    await expect(shopTheme).toHaveAttribute("aria-selected", "true");
    await shop.getByRole("button", { name: "Đóng" }).click();

    await page.evaluate(async game => {
      (await import("/js/shop.js")).openShopOverlay({
        gameId: game,
        fromMenu: true,
        linkConnect: game === "link-connect",
      });
    }, gameId);
    await expect(shopTheme).toHaveAttribute("aria-selected", "true");
    await shop.getByRole("button", { name: "Đóng" }).click();

    await page.evaluate(async game => {
      (await import("/js/mainmenu.js")).showCollectionModal({ gameId: game });
    }, gameId);
    const collection = page.locator("#collection-modal");
    const collectionTheme = collection.getByRole("tab", { name: "Chủ đề", exact: true });
    await collectionTheme.focus();
    await collection.getByRole("tab", { name: gameId === "memory-match" ? "Ngoại hình" : "Đường nối", exact: true }).click();
    const selectedCollectionTab = collection.getByRole("tab", { selected: true });
    const collectionTabName = await selectedCollectionTab.textContent();
    expect(collectionTabName).not.toBe("Chủ đề");
    await collection.getByRole("button", { name: "Đóng" }).click();

    await page.reload();
    await expect(page.locator(".game-selector__choice").first()).toBeVisible();
    await page.evaluate(async game => {
      (await import("/js/mainmenu.js")).showCollectionModal({ gameId: game });
    }, gameId);
    await expect(collection.getByRole("tab", { selected: true })).toHaveText(collectionTabName || "");
  });
}

test("catalog navigation ignores an invalid persisted tab and does not write while rendering", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("memoryMatchSave", JSON.stringify({
      formatVersion: 1,
      revision: 7,
      updatedAt: Date.now(),
      data: { coins: 0, appearance: {}, progress: {}, settings: { catalogTabs: { "memory-match:shop": "path" } } },
    }));
  });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const revisions = await page.evaluate(async () => {
    const persistence = await import("/js/persistence.js");
    const before = persistence.getPersistenceStatus().revision;
    await (await import("/js/shop.js")).openShopOverlay({ gameId: "memory-match", fromMenu: true });
    await persistence.flushPersistentWrites();
    const after = persistence.getPersistenceStatus().revision;
    return { before, after };
  });
  expect(revisions.before).toBeGreaterThan(0);
  expect(revisions.after).toBe(revisions.before);
  await expect(page.locator("#shop-modal").getByRole("tab", { selected: true })).toHaveText("Vật phẩm");
});
