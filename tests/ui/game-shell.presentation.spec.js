import { expect, test } from "@playwright/test";

test("both games share frame, title and fullscreen geometry and configurable sizes", async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto("/");
  await page.locator(".game-selector__choice").first().waitFor();
  const measured = [];
  for (const id of ["memory-match", "link-connect"]) {
    await page.evaluate(async id => {
      await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id);
      const { gameState } = await import("/js/gameState.js");
      gameState.settings.mode = "easy";
      gameState.settings.boardCoordinates = false;
      if (id === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun();
      else await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    }, id);
    const root = page.locator(".game-shell-root:visible");
    await expect(root).toHaveCount(1);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    measured.push(await root.evaluate(root => {
      const rect = element => {
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      return { frame: rect(root), title: rect(root.querySelector('[data-shell-region="title"]')),
        button: rect(root.querySelector('.shell-fullscreen-button')),
        icon: rect(root.querySelector('.shell-fullscreen-button svg')) };
    }));
    expect(measured.at(-1).button.width).toBe(24);
    expect(measured.at(-1).icon.width).toBe(16);
    const configured = await root.evaluate(root => {
      root.style.setProperty('--shell-fullscreen-size', '30px');
      root.style.setProperty('--shell-fullscreen-icon-size', '18px');
      const values = [root.querySelector('.shell-fullscreen-button').getBoundingClientRect().width,
        root.querySelector('.shell-fullscreen-button svg').getBoundingClientRect().width];
      root.style.removeProperty('--shell-fullscreen-size');
      root.style.removeProperty('--shell-fullscreen-icon-size');
      return values;
    });
    expect(configured).toEqual([30, 18]);
  }
  for (const region of ["frame", "title", "button", "icon"]) {
    for (const key of ["x", "y", "width", "height"]) {
      expect(Math.abs(measured[0][region][key] - measured[1][region][key]), `${region}.${key}`).toBeLessThanOrEqual(1);
    }
  }
});
