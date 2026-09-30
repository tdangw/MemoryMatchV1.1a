import { expect, test } from "@playwright/test";

for (const id of ["memory-match", "link-connect", "triple-connect"]) test(`${id}: single seamless HUD surface, readable metrics and unobstructed targets at 412x915`, async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await page.evaluate(async id => {
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id);
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.mode = "easy";
    if (id === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun();
    else if (id === "link-connect") await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    else await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ mode: "easy", seed: "hud-geometry", skipIntro: true });
    (await import("/js/ui.js")).clearGameplayRewardPopups();
  }, id);
  // The shared file must work before per-game styles too, not just as the last
  // override. Keep tokens first; all game-specific states still have owners.
  await page.evaluate(() => {
    const shared = document.querySelector('link[href="styles/game-shell/hud-unified.css"]');
    const tokens = document.querySelector('link[href="styles/game-shell/tokens.css"]');
    tokens.after(shared);
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const metrics = await page.evaluate(async () => {
    const { activeShell } = (await import("/js/gameShell/gameShell.js")).getGameShellDiagnostics();
    const root = activeShell.root;
    const hud = root.querySelector('[data-shell-region="hud"]');
    const bounds = node => {
      const { x, y, width, height, right, bottom } = node.getBoundingClientRect();
      return { x, y, width, height, right, bottom };
    };
    const cells = [...hud.querySelectorAll(".game-hud__metric")];
    const buttons = [...hud.querySelectorAll(':scope > button')];
    const allCells = [buttons[0], ...cells, buttons[1]];
    const star = root.querySelector(".game-milestone-stars");
    return {
      hud: bounds(hud),
      hudOverflow: hud.scrollWidth > hud.clientWidth,
      cells: allCells.map(node => ({ ...bounds(node), hit: node.contains(document.elementFromPoint(node.getBoundingClientRect().x + node.getBoundingClientRect().width / 2, node.getBoundingClientRect().y + node.getBoundingClientRect().height / 2)) })),
      buttons: buttons.map(node => ({ ...bounds(node), background: getComputedStyle(node).backgroundColor, shadow: getComputedStyle(node).boxShadow })),
      styles: cells.map(node => ({ radius: getComputedStyle(node).borderRadius, background: getComputedStyle(node).backgroundColor, label: getComputedStyle(node.querySelector(".stat-label")).color, value: getComputedStyle(node.querySelector(":scope > :not(.stat-label):not(.combo-window-progress)")).color })),
      textFits: cells.every(node => [...node.querySelectorAll(":scope > :not(.combo-window-progress)")].every(child => child.getBoundingClientRect().width <= node.getBoundingClientRect().width - 3)),
      milestone: bounds(root.querySelector('[data-shell-region="milestones"]')),
      board: bounds(root.querySelector('[data-shell-region="frame"]')),
      star: bounds(star),
      starHit: star.contains(document.elementFromPoint(star.getBoundingClientRect().x + star.getBoundingClientRect().width / 2, star.getBoundingClientRect().y + star.getBoundingClientRect().height / 2)),
    };
  });
  expect(metrics.hud.x).toBeGreaterThanOrEqual(0);
  expect(metrics.hud.right).toBeLessThanOrEqual(412);
  expect(metrics.hudOverflow).toBe(false);
  expect(metrics.textFits).toBe(true);
  expect(metrics.cells).toHaveLength(9);
  for (const cell of metrics.cells) {
    expect(cell.y).toBeCloseTo(metrics.hud.y, 1);
    expect(cell.height).toBeCloseTo(metrics.hud.height, 1);
    expect(cell.hit).toBe(true);
  }
  for (let i = 1; i < metrics.cells.length; i++) expect(metrics.cells[i].x).toBeCloseTo(metrics.cells[i - 1].right, 1);
  for (const button of metrics.buttons) {
    expect(button.width).toBeGreaterThanOrEqual(44);
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(button.shadow).toContain("inset");
  }
  expect(metrics.buttons.map(button => button.background)).toEqual(['rgb(54, 87, 133)', 'rgb(100, 69, 125)']);
  for (const style of metrics.styles) expect(style).toEqual({ radius: "0px", background: "rgba(0, 0, 0, 0)", label: "rgb(255, 209, 102)", value: "rgb(245, 247, 251)" });
  expect(metrics.star.x).toBeGreaterThanOrEqual(0);
  expect(metrics.star.right).toBeLessThanOrEqual(412);
  expect(metrics.starHit).toBe(true);
  expect(metrics.star.y).toBeGreaterThan(metrics.hud.bottom);
  expect(metrics.milestone.bottom).toBeLessThanOrEqual(metrics.board.y + 1);
  const largeValuesFit = await page.evaluate(async () => {
    const { activeShell } = (await import("/js/gameShell/gameShell.js")).getGameShellDiagnostics();
    const hud = activeShell.root.querySelector('.game-hud');
    const values = { moves: "9999", misses: "9999", level: "999", timer: "99:59", stars: "9999", combo: "99", points: "9999999" };
    for (const [name, value] of Object.entries(values)) hud.querySelector(`.stat-${name} > :not(.stat-label):not(.combo-window-progress)`).textContent = value;
    return [...hud.querySelectorAll(".game-hud__metric")].every(node => [...node.querySelectorAll(":scope > :not(.combo-window-progress)")].every(child => child.getBoundingClientRect().width <= node.getBoundingClientRect().width - 3));
  });
  expect(largeValuesFit).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const warning = await page.evaluate(async () => {
    const { activeShell } = (await import("/js/gameShell/gameShell.js")).getGameShellDiagnostics();
    const hud = activeShell.root.querySelector('.game-hud');
    const timer = hud.querySelector('.stat-timer');
    const bounds = node => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    const before = { hud: bounds(hud), timer: bounds(timer) };
    timer.classList.add('timer-warning');
    await new Promise(resolve => requestAnimationFrame(resolve));
    return {
      before,
      after: { hud: bounds(hud), timer: bounds(timer) },
      transform: getComputedStyle(timer).transform,
      animations: timer.getAnimations({ subtree: true }).length,
      color: getComputedStyle(timer.querySelector(':scope > :not(.stat-label)')).color,
    };
  });
  expect(warning.after).toEqual(warning.before);
  expect(warning.transform).toBe('none');
  expect(warning.animations).toBe(0);
  expect(warning.color).toBe('rgb(255, 138, 128)');
  for (const [selector, activeColor] of [['.game-menu-toggle', 'rgb(72, 109, 161)'], [':is(.memory-tools-toggle, .link-tools-toggle, .triple-tools-toggle)', 'rgb(128, 89, 154)']]) {
    const button = page.locator(`.game-hud ${selector}:visible`);
    await button.focus();
    await expect(button).toHaveCSS('outline-style', 'solid');
    await button.press('Enter');
    await expect(button).toHaveCSS('background-color', activeColor);
    await page.keyboard.press('Escape');
  }
  await page.locator('.game-hud .game-menu-toggle:visible').evaluate(node => node.ownerDocument.activeElement.blur());
  await page.mouse.move(1, 1);
  await page.screenshot({ path: `test-results/hud-controls-${id}.png` });
});
