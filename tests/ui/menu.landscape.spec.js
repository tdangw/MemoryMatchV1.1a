import { expect, test } from "@playwright/test";

const games = ["Memory Match", "Link Connect"];

async function expectModalBodyScrollsWithinViewport(page, selector) {
  const panel = page.locator(`${selector} .app-modal`);
  const body = page.locator(`${selector} .app-modal__body`);
  await expect(panel).toBeVisible();
  const metrics = await panel.evaluate((element, modalSelector) => {
    const rect = element.getBoundingClientRect();
    const content = document.querySelector(`${modalSelector} .app-modal__body`);
    return {
      panel: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
      body: content
        ? {
            clientHeight: content.clientHeight,
            scrollHeight: content.scrollHeight,
            overflowY: getComputedStyle(content).overflowY,
          }
        : null,
      viewport: { width: innerWidth, height: innerHeight },
    };
  }, selector);
  expect(metrics.panel.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.panel.right).toBeLessThanOrEqual(metrics.viewport.width + 1);
  expect(metrics.panel.top).toBeGreaterThanOrEqual(-1);
  expect(metrics.panel.bottom).toBeLessThanOrEqual(metrics.viewport.height + 1);
  expect(metrics.body).not.toBeNull();
  expect(metrics.body.clientHeight).toBeGreaterThan(0);
  expect(metrics.body.overflowY).toBe("auto");
  return body;
}

for (const game of games) {
  test(`${game} main menu stays usable in compact landscape`, async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/");
    await page.locator(".game-selector__choice").filter({ hasText: game }).click();
    const wrapper = page.locator("#menu-container .adventure-map-view");
    const items = page.locator("#menu-container [data-dock-action]");
    await expect(wrapper).toBeVisible();
    await expect(items).toHaveCount(4);
    const result = await wrapper.evaluate(element => {
      const rect = node => {
        const value = node.getBoundingClientRect();
        return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
      };
      return { wrapper: rect(element), items: [...document.querySelectorAll("[data-dock-action]")].map(rect), viewport: { width: innerWidth, height: innerHeight } };
    });
    for (const bounds of [result.wrapper, ...result.items]) {
      expect(bounds.left).toBeGreaterThanOrEqual(-1);
      expect(bounds.right).toBeLessThanOrEqual(result.viewport.width + 1);
      expect(bounds.top).toBeGreaterThanOrEqual(-1);
      expect(bounds.bottom).toBeLessThanOrEqual(result.viewport.height + 1);
    }
    await items.filter({ hasText: "Cài đặt" }).click();
    const settingsBody = await expectModalBodyScrollsWithinViewport(page, "#settings-modal");
    await settingsBody.evaluate(element => {
      element.scrollTop = element.scrollHeight;
    });
    const lastSetting = page.locator("#settings-modal #settings-container .settings-control").last();
    await expect(lastSetting).toBeInViewport();
    await page.locator("#settings-modal .app-modal__close").click();

    await expect(page.locator("#settings-modal")).toHaveCount(0);
    await page.locator('[data-level="1"]').click();
    await expectModalBodyScrollsWithinViewport(page, '#adventure-level-modal');
    await expect(page.getByRole('radio', { name: 'Siêu khó', exact: true })).toBeInViewport();
    await expect(page.locator('#adventure-level-modal').getByRole('button', { name: 'Chơi', exact: true })).toBeInViewport();


  });
}
