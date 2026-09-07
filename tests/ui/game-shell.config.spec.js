import { expect, test } from "@playwright/test";

test("UI overrides resolve on their own root and preserve sibling defaults", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { getGameShellCssVariables } = await import("/js/gameShell/gameShellConfig.js");
    const roots = [document.createElement("div"), document.createElement("div")];
    for (const root of roots) {
      root.className = "game-shell-tokens";
      root.style.cssText = "position:fixed;left:-9999px;padding-top:var(--shell-safe-top);gap:var(--shell-active-board-gap);border-radius:var(--shell-hud-radius)";
      document.body.append(root);
    }
    try {
      const variables = getGameShellCssVariables({ safeArea: { top: 27 }, board: { gap: 12, narrowGap: 9 }, hud: { radius: 13 } });
      for (const [name, value] of Object.entries(variables)) roots[0].style.setProperty(name, value);
      return roots.map(root => {
        const css = getComputedStyle(root);
        return { safeTop: css.paddingTop, gap: css.gap, radius: css.borderRadius };
      });
    } finally {
      roots.forEach(root => root.remove());
    }
  });
  const narrow = page.viewportSize().width <= 420;
  expect(result).toEqual([
    { safeTop: "27px", gap: narrow ? "9px" : "12px", radius: "13px" },
    { safeTop: "14px", gap: narrow ? "4px" : "6px", radius: "9px" },
  ]);
});
