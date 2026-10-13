import { expect, test } from "@playwright/test";

test("registry exposes only released games in the selector", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice")).toHaveCount(3);
  const selectorTitle = page.locator(".menu-wrapper--game-selector > .game-title");
  await expect(selectorTitle).toHaveAttribute("aria-label", "Memory Match Adventure");
  await expect(selectorTitle.locator(".game-selector__title-line")).toHaveText([
    "Memory Match",
    "Adventure",
  ]);
  await expect(page.locator(".menu-wrapper--game-selector > .menu-description"))
    .toHaveCSS("font-size", "14px");
  for (const caption of await page.locator(".game-selector__choice small").all()) await expect(caption).toHaveCSS("font-size", "13px");
  const selectorDescription = page.locator(".menu-wrapper--game-selector > .menu-description");
  for (const width of [412, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    const lineCount = await selectorDescription.evaluate((element) => {
      const style = getComputedStyle(element);
      return Math.round(element.getBoundingClientRect().height / parseFloat(style.lineHeight));
    });
    expect(lineCount, `slogan line count at ${width}px`).toBe(1);
  }
  await expect(page.locator(".game-selector__choice")).toHaveText([
    /Memory Match.*Mới thấy đó thôi, chớp mắt đã quên!/s,
    /Link Connect.*Ngay trước mắt nhìn, vạn dặm xa xôi!/s,
    /Triple Connect.*Nhìn tưởng dễ ăn, chớp mắt chịu thua!/s,
  ]);
  await expect(page.locator(".game-selector")).toContainText(
    "Memory Match Adventure",
  );
  await expect(page.locator(".game-selector")).toContainText(
    "Trí nhớ là hành trang. Cuộc phiêu lưu là lẽ sống.",
  );
  await expect(
    page
      .locator(".game-selector__choice")
      .filter({ hasText: "Triple Connect" }),
  ).toContainText("Nhìn tưởng dễ ăn, chớp mắt chịu thua!");
});

test("released game adapters still open their matching menus", async ({
  page,
}) => {
  await page.goto("/");

  const memoryOpened = await page.evaluate(async () =>
    (await import("/js/gameSelector.js")).openGameMenu("memory-match"),
  );
  expect(memoryOpened).toBe(true);
  await expect(page.locator("#game-container")).toHaveCount(1);
  await expect(page.locator("#menu-container.link-connect-menu")).toHaveCount(
    0,
  );

  const linkOpened = await page.evaluate(async () =>
    (await import("/js/gameSelector.js")).openGameMenu("link-connect"),
  );
  expect(linkOpened).toBe(true);
  await expect(page.locator("#menu-container.link-connect-menu")).toHaveCount(
    1,
  );

  const tripleOpened = await page.evaluate(async () =>
    (await import("/js/gameSelector.js")).openGameMenu("triple-connect"),
  );
  expect(tripleOpened).toBe(true);
  await expect(page.locator("#menu-container.triple-connect-menu")).toHaveCount(
    1,
  );
  await expect(
    page.locator("#menu-container.triple-connect-menu"),
  ).toContainText("Triple Connect");
});

test("Triple menu starts a visible playable board", async ({ page }) => {
  await page.goto("/");
  await page
    .locator(".game-selector__choice")
    .filter({ hasText: "Triple Connect" })
    .click();
  await page.locator('[data-level="1"]').click();
  await expect(page.locator("#triple-connect-container")).toBeVisible();
  await expect(
    page.locator(".triple-connect__board .triple-connect__tile"),
  ).toHaveCount(27);
});

test("switching all released games after a production Triple start keeps one active shell", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".game-selector__choice")
    .filter({ hasText: "Triple Connect" })
    .click();
  await page.locator('[data-level="1"]').click();
  await expect(page.locator("#triple-connect-container")).toBeVisible();

  const result = await page.evaluate(async () => {
    const { openGameMenu, showGameSelector } =
      await import("/js/gameSelector.js");
    const { getTripleShell } = await import("/js/tripleConnect/tripleShell.js");
    const { getGameShellDiagnostics } =
      await import("/js/gameShell/gameShell.js");
    const tripleRoot = getTripleShell().refs.root;
    const menuResults = [
      openGameMenu("memory-match"),
      openGameMenu("link-connect"),
      openGameMenu("triple-connect"),
    ];
    showGameSelector();
    return {
      menuResults,
      activeShell: getGameShellDiagnostics().activeShell,
      visibleBoards: [
        ...document.querySelectorAll('[data-shell-region="board"]'),
      ].filter((node) => node.getClientRects().length > 0).length,
      tripleRoots: document.querySelectorAll("#triple-connect-container")
        .length,
      tripleRootHidden: tripleRoot.hidden,
    };
  });

  expect(result.menuResults).toEqual([true, true, true]);
  expect(result.activeShell).toBeNull();
  expect(result.visibleBoards).toBe(0);
  expect(result.tripleRoots).toBe(1);
  expect(result.tripleRootHidden).toBe(true);
  await expect(page.locator(".game-selector__choice")).toHaveCount(3);
});

test("unknown game IDs are rejected without a fallback menu", async ({
  page,
}) => {
  await page.goto("/");

  const result = await page.evaluate(async () => {
    const { openGameMenu } = await import("/js/gameSelector.js");
    return {
      unknown: openGameMenu("unknown-game"),
      activeGame: document.documentElement.dataset.activeGame || null,
      selectorPresent: Boolean(document.querySelector(".game-selector")),
      linkMenuPresent: Boolean(
        document.querySelector("#menu-container.link-connect-menu"),
      ),
    };
  });

  expect(result).toEqual({
    unknown: false,
    activeGame: "selector",
    selectorPresent: true,
    linkMenuPresent: false,
  });
});
