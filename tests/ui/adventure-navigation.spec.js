import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 412, height: 915 }, { width: 844, height: 390 }, { width: 1024, height: 900 }]) {
  test(`shared menu/game dock fits ${viewport.width}x${viewport.height} without a game ad footprint`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await expect(page.locator(".adventure-page")).toBeVisible();
    await expect(page.locator("[data-dock-action]")).toHaveText(["Cửa hàng", "Bộ sưu tập", "Xếp hạng", "Cài đặt"]);
    await expect(page.locator("[data-ad-placement]")).toHaveCount(1);
    for (const id of ["memory-match", "link-connect", "triple-connect"]) {
      await page.evaluate(async id => (await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id)), id);
      await expect(page.locator(".adventure-page [data-dock-action]")).toHaveCount(4);
      await expect(page.locator("[data-ad-placement]")).toHaveCount(1);
      await page.evaluate(async id => {
        await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id);
        const { gameState } = await import("/js/gameState.js");
        gameState.settings.mode = "superHard";
        gameState.settings.sound = false;
        gameState.settings.music = false;
        if (id === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun(1);
        else if (id === "link-connect") await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "superHard", level: 1 });
        else await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ mode: "superHard", skipIntro: true });
      }, id);
      const dock = page.locator(".adventure-dock--playing");
      await expect(dock).toHaveCount(1);
      await expect(page.locator("[data-ad-placement]")).toHaveCount(0);
      await page.waitForFunction(() => {
        const dock = document.querySelector(".adventure-dock--playing");
        const frame = [...document.querySelectorAll('[data-shell-region="frame"]')].find(node => node.getBoundingClientRect().height > 0);
        if (frame?.closest('.shell-scroll-playing')) {
          const root = frame.closest('.shell-scroll-playing');
          root.scrollTop = root.scrollHeight;
        }
        return frame && frame.getBoundingClientRect().bottom <= dock.getBoundingClientRect().top + 2;
      });
      await dock.locator('[data-dock-action="ranking"]').click();
      await expect(page.locator("#rankings-modal")).toBeVisible();
      await page.locator("#rankings-modal .app-modal__close").click();
      await expect(page.locator("#rankings-modal")).toHaveCount(0);
      await page.evaluate(async () => (await import("/js/gameSelector.js")).showGameSelector());
    }
    expect(errors).toEqual([]);
  });
}
