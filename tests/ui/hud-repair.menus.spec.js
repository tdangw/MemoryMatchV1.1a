import { expect, test } from "@playwright/test";

const games = [
  { id: "memory-match", trigger: "#btn-actions-menu", tools: "#memory-tools-toggle", toolPanel: "#memory-tools-menu" },
  { id: "link-connect", trigger: "#link-actions-menu-toggle", tools: "#link-tools-toggle", toolPanel: "#link-tools-menu" },
  { id: "triple-connect", trigger: "#triple-actions-menu-toggle", tools: "#triple-tools-toggle", toolPanel: "#triple-tools-menu" },
];

async function start(page, id) {
  await page.evaluate(async id => {
    await (await import("/tests/ui/helpers/gameNavigation.js")).openReadyGameMenu(id);
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.mode = "easy";
    gameState.settings.sound = false;
    gameState.settings.music = false;
    if (id === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun();
    else if (id === "link-connect") await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    else await (await import("/js/tripleConnect/tripleController.js")).startTripleConnectRound({ mode: "easy", seed: "hud-menu", skipIntro: true });
    (await import("/js/ui.js")).clearGameplayRewardPopups();
  }, id);
}

for (const game of games) test(`${game.id}: menu exclusion, ARIA, dismissal and keyboard focus`, async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  await start(page, game.id);
  const assertOpen = async (actions, tools) => {
    await expect(page.locator(game.trigger)).toHaveAttribute("aria-expanded", String(actions));
    await expect(page.locator(game.tools)).toHaveAttribute("aria-expanded", String(tools));
    if (actions) await expect(page.locator('#game-exit-modal')).toBeVisible();
    else await expect(page.locator('#game-exit-modal')).toHaveCount(0);
    await expect(page.locator(game.toolPanel))[tools ? "toBeVisible" : "toBeHidden"]();
    expect(await page.locator(game.tools).evaluate(node => node.classList.contains("is-open"))).toBe(tools);
  };
  await page.locator(game.tools).click();
  await assertOpen(false, true);
  await page.locator(game.trigger).click();
  await assertOpen(true, false);
  await page.keyboard.press('Escape');
  await expect(page.locator('#game-exit-modal')).toHaveCount(0);
  await page.locator(game.tools).click();
  await assertOpen(false, true);
  await page.locator(game.tools).click();
  await assertOpen(false, false);
  await page.locator(game.trigger).click();
  await page.keyboard.press("Escape");
  await assertOpen(false, false);
  await expect(page.locator(game.trigger)).toBeFocused();
  await page.locator(game.tools).click();
  await page.mouse.click(2, 2);
  await assertOpen(false, false);
  await page.locator(game.trigger).focus();
  await page.keyboard.press("Enter");
  await assertOpen(true, false);
  await page.evaluate(async () => {
    const { activeShell } = (await import("/js/gameShell/gameShell.js")).getGameShellDiagnostics();
    window.menuPreviousScope = activeShell.scope;
  });
  await page.locator('#game-exit-modal').getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await expect.poll(() => page.evaluate(async () => {
    const { activeShell } = (await import("/js/gameShell/gameShell.js")).getGameShellDiagnostics();
    return Boolean(activeShell?.scope.active && activeShell.scope !== window.menuPreviousScope);
  })).toBe(true);
  await page.evaluate(() => { delete window.menuPreviousScope; });
  await assertOpen(false, false);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (let index = 0; index < 10; index++) {
    await page.locator(game.tools).click();
    await page.locator(game.trigger).click();
    await assertOpen(true, false);
    await page.keyboard.press('Escape');
    await expect(page.locator('#game-exit-modal')).toHaveCount(0);
  }
  await assertOpen(false, false);
});

test("20 cycles per game of mount, restart, switch release HUD listeners and references", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const results = await page.evaluate(async games => {
    const { openReadyGameMenu } = await import("/tests/ui/helpers/gameNavigation.js");
    const { getGameShellDiagnostics } = await import("/js/gameShell/gameShell.js");
    const memory = await import("/js/gameController.js");
    const link = await import("/js/linkConnect/linkController.js");
    const triple = await import("/js/tripleConnect/tripleController.js");
    const { gameState } = await import("/js/gameState.js");
    gameState.settings.mode = "easy";
    gameState.settings.sound = false;
    gameState.settings.music = false;
    const baseline = {};
    const disposed = [];
    let previous;
    for (let cycle = 0; cycle < 20; cycle++) for (const game of games) {
      await openReadyGameMenu(game.id);
      if (previous) disposed.push(previous.scope.diagnostics());
      for (let restart = 0; restart < 2; restart++) {
        if (game.id === "memory-match") await memory.startNewMemoryRun();
        else if (game.id === "link-connect") await link.startLinkLevel({ mode: "easy" });
        else await triple.startTripleConnectRound({ mode: "easy", seed: "hud-soak", skipIntro: true });
        const active = getGameShellDiagnostics().activeShell;
        const count = active.scope.diagnostics().listener;
        const nodes = active.root.querySelector('[data-shell-region="hud"]').querySelectorAll("*").length;
        baseline[game.id] ||= { count, nodes };
        if (count !== baseline[game.id].count || nodes !== baseline[game.id].nodes) throw new Error(`HUD resources grew: ${game.id}`);
        document.querySelector(game.tools).click();
        document.querySelector(game.trigger).click();
        if (!document.querySelector(game.toolPanel).hidden || !document.querySelector('#game-exit-modal')) throw new Error("Menu exclusion failed");
        if (restart === 0) {
          active.scope.dispose();
          disposed.push(active.scope.diagnostics());
          document.querySelector(game.trigger).click();
          if (document.querySelector('#game-exit-modal')) throw new Error("Disposed menu listener remains");
        }
        previous = active;
      }
    }
    previous.scope.dispose();
    disposed.push(previous.scope.diagnostics());
    return { baseline, disposed };
  }, games);
  expect(results.disposed).toHaveLength(120);
  for (const snapshot of results.disposed) {
    expect(snapshot.active).toBe(false);
    for (const [key, count] of Object.entries(snapshot)) if (key !== "active") expect(count).toBe(0);
  }
  console.log("HUD soak baseline", JSON.stringify(results.baseline));
});

test("disposed HUD owner cannot close panels belonging to a new mount", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { createGameShellLifecycle } = await import("/js/gameShell/gameShellLifecycle.js");
    const { bindGameHudMenus } = await import("/js/gameShell/gameHudMenus.js");
    const root = document.createElement("div");
    root.innerHTML = '<button>A</button><div hidden><button>Action</button></div><button>B</button><div hidden><button>Tool</button></div>';
    document.body.append(root);
    const entries = [{ trigger: root.children[0], panel: root.children[1] }, { trigger: root.children[2], panel: root.children[3] }];
    const first = createGameShellLifecycle();
    const stale = bindGameHudMenus(first, entries);
    entries[0].trigger.click();
    first.dispose();
    first.dispose();
    const second = createGameShellLifecycle();
    const current = bindGameHudMenus(second, entries);
    entries[1].trigger.click();
    stale.close();
    const preserved = !entries[1].panel.hidden && entries[1].trigger.getAttribute("aria-expanded") === "true";
    second.dispose();
    root.remove();
    current.close();
    return { preserved, first: first.diagnostics(), second: second.diagnostics(), detachedPanels: entries.every(entry => !entry.panel.isConnected && entry.panel.hidden) };
  });
  expect(result.preserved).toBe(true);
  expect(result.detachedPanels).toBe(true);
  for (const snapshot of [result.first, result.second]) for (const [key, value] of Object.entries(snapshot)) expect(value).toBe(key === "active" ? false : 0);
});
