import { expect, test } from "@playwright/test";

test("registry exposes only released games in the selector", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice")).toHaveCount(2);
  await expect(page.locator(".game-selector__choice")).toHaveText([
    /Memory Match/,
    /Link Connect/,
  ]);
  await expect(page.locator(".game-selector")).not.toContainText("Triple Connect");
});

test("released game adapters still open their matching menus", async ({ page }) => {
  await page.goto("/");

  const memoryOpened = await page.evaluate(async () =>
    (await import("/js/gameSelector.js")).openGameMenu("memory-match"),
  );
  expect(memoryOpened).toBe(true);
  await expect(page.locator("#game-container")).toHaveCount(1);
  await expect(page.locator("#menu-container.link-connect-menu")).toHaveCount(0);

  const linkOpened = await page.evaluate(async () =>
    (await import("/js/gameSelector.js")).openGameMenu("link-connect"),
  );
  expect(linkOpened).toBe(true);
  await expect(page.locator("#menu-container.link-connect-menu")).toHaveCount(1);
});

test("unreleased and unknown game IDs are rejected without a fallback menu", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(async () => {
    const { openGameMenu } = await import("/js/gameSelector.js");
    return {
      triple: openGameMenu("triple-connect"),
      unknown: openGameMenu("unknown-game"),
      activeGame: document.documentElement.dataset.activeGame || null,
      selectorPresent: Boolean(document.querySelector(".game-selector")),
    linkMenuPresent: Boolean(document.querySelector("#menu-container.link-connect-menu")),
    };
  });

  expect(result).toEqual({
    triple: false,
    unknown: false,
    activeGame: "selector",
    selectorPresent: true,
    linkMenuPresent: false,
  });
});
