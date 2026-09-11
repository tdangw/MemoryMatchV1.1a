import { expect, test } from "@playwright/test";

const games = ["Memory Match", "Link Connect"];

for (const game of games) {
  test(`${game} main menu stays usable in compact landscape`, async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/");
    await page.locator(".game-selector__choice").filter({ hasText: game }).click();
    const wrapper = page.locator("#menu-container .menu-wrapper");
    const items = wrapper.locator(".menu-item");
    await expect(wrapper).toBeVisible();
    await expect(items).toHaveCount(7);
    const result = await wrapper.evaluate(element => {
      const rect = node => {
        const value = node.getBoundingClientRect();
        return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
      };
      return { wrapper: rect(element), items: [...element.querySelectorAll(".menu-item")].map(rect), viewport: { width: innerWidth, height: innerHeight } };
    });
    for (const bounds of [result.wrapper, ...result.items]) {
      expect(bounds.left).toBeGreaterThanOrEqual(-1);
      expect(bounds.right).toBeLessThanOrEqual(result.viewport.width + 1);
      expect(bounds.top).toBeGreaterThanOrEqual(-1);
      expect(bounds.bottom).toBeLessThanOrEqual(result.viewport.height + 1);
    }
    await items.filter({ hasText: "Cài đặt" }).click();
    const settings = page.locator("#settings-modal .app-modal");
    await expect(settings).toBeVisible();
    const modal = await settings.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: innerWidth, height: innerHeight };
    });
    expect(modal.left).toBeGreaterThanOrEqual(-1);
    expect(modal.right).toBeLessThanOrEqual(modal.width + 1);
    expect(modal.top).toBeGreaterThanOrEqual(-1);
    expect(modal.bottom).toBeLessThanOrEqual(modal.height + 1);
  });
}
