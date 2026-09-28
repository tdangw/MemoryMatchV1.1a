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
    await collectionTheme.press("ArrowLeft");
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
  await page.goto("/");
  const result = await page.evaluate(async () => {
    localStorage.setItem("memoryMatchSave", JSON.stringify({
      formatVersion: 1,
      revision: 7,
      updatedAt: Date.now(),
      data: { coins: 0, appearance: {}, progress: {}, settings: { catalogTabs: { "memory-match:shop": "path" } } },
    }));
    location.reload();
    return true;
  });
  expect(result).toBe(true);
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const revisions = await page.evaluate(async () => {
    const before = JSON.parse(localStorage.getItem("memoryMatchSave")).revision;
    (await import("/js/shop.js")).openShopOverlay({ gameId: "memory-match", fromMenu: true });
    const after = JSON.parse(localStorage.getItem("memoryMatchSave")).revision;
    return { before, after };
  });
  expect(revisions).toEqual({ before: 7, after: 7 });
  await expect(page.locator("#shop-modal").getByRole("tab", { selected: true })).toHaveText("Vật phẩm");
});
