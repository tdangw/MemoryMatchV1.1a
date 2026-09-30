import { expect, test } from "@playwright/test";

async function ready(page) {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
}

test("effect limits preserve settlement and release nodes on game switch", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  for (const gameId of ["memory-match", "link-connect"]) {
    const result = await page.evaluate(async gameId => {
      const { openGameMenu } = await import("/js/gameSelector.js");
      openGameMenu(gameId);
      if (gameId === "memory-match") await (await import("/js/gameController.js")).startNewMemoryRun();
      else await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
      const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
      const { playLootDrop } = await import("/js/lootEffects.js");
      const { playCoinRewardFlight } = await import("/js/coinRewards.js");
      const source = document.querySelector(gameId === "memory-match" ? ".tile" : ".link-tile");
      const target = document.querySelector(gameId === "memory-match" ? "#memory-game-coins" : "#link-game-coins") || source;
      const registry = getEffectRegistry();
      let settled = 0;
      for (let i = 0; i < 80; i++) playLootDrop(source, { target, holdMs: 10000, onCollected: () => settled++ });
      for (let i = 0; i < 10; i++) playCoinRewardFlight(source, target, 1000);
      const counts = registry.diagnostics();
      const skipped = settled;
      openGameMenu(gameId === "memory-match" ? "link-connect" : "memory-match");
      return { counts, skipped, after: registry.diagnostics(), settled, nodes: document.querySelectorAll(".game-loot-drop, .game-coin-reward-flight").length };
    }, gameId);
    expect(result.counts.loot).toBe(16);
    expect(result.counts.coin).toBe(32);
    expect(result.skipped).toBe(64);
    expect(result.settled).toBe(64);
    expect(Object.values(result.after).every(count => count === 0)).toBe(true);
    expect(result.nodes).toBe(0);
  }
});

test("normal collection settles once and reduced motion creates no effects", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  await page.evaluate(async () => {
    const { activateGameScope, createGameShellLifecycle } = await import("/js/gameShell/gameShellLifecycle.js");
    activateGameScope(createGameShellLifecycle());
    window.collected = 0;
    window.drop = (await import("/js/lootEffects.js")).playLootDrop(document.body, { holdMs: 0, onCollected: () => window.collected++ });
    window.drop.getAnimations()[0].finish();
  });
  await expect.poll(() => page.evaluate(() => window.drop.getAnimations().some(animation => animation.playState === "running"))).toBe(true);
  await page.evaluate(() => window.drop.getAnimations().forEach(animation => animation.finish()));
  await expect.poll(() => page.evaluate(() => window.collected)).toBe(1);
  await expect(page.locator(".game-loot-drop")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const result = await page.evaluate(async () => {
    const { playLootDrop } = await import("/js/lootEffects.js");
    const { pulseTarget, getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    playLootDrop(document.body, { onCollected: () => window.collected++ });
    pulseTarget(document.body);
    return { collected: window.collected, counts: getEffectRegistry().diagnostics() };
  });
  expect(result.collected).toBe(2);
  expect(Object.values(result.counts).every(count => count === 0)).toBe(true);
});

test("registry validates configuration and cancels FLIP without removing tiles", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const result = await page.evaluate(async () => {
    const { createEffectRegistry, animateShellEffect, getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    const { createGameShellLifecycle, activateGameScope } = await import("/js/gameShell/gameShellLifecycle.js");
    const scope = createGameShellLifecycle();
    activateGameScope(scope);
    let invalid = false;
    try { createEffectRegistry(scope, { coin: -1 }); } catch { invalid = true; }
    const registry = createEffectRegistry(scope, { coin: 1 });
    let cleanups = 0;
    const first = registry.track("coin", () => cleanups++);
    const rejected = registry.track("coin", () => cleanups++);
    first.dispose(); first.dispose();
    const element = document.createElement("div");
    document.body.append(element);
    let finished = false;
    animateShellEffect(element, [{ transform: "translateX(10px)" }, { transform: "translateX(0)" }], { duration: 10000 }, { onFinish: () => finished = true });
    const effects = getEffectRegistry();
    scope.dispose();
    await Promise.resolve();
    const connected = element.isConnected;
    element.remove();
    return { invalid, rejected: rejected === null, cleanups, connected, finished, counts: effects.diagnostics() };
  });
  expect(result).toMatchObject({ invalid: true, rejected: true, cleanups: 1, connected: true, finished: false });
  expect(Object.values(result.counts).every(count => count === 0)).toBe(true);
});


test("Link reward adapters use shared loot and item budgets", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    const { playLinkItemRewardFlight } = await import("/js/linkConnect/linkRenderer.js");
    const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    const { clearLootEffects } = await import("/js/lootEffects.js");
    const source = document.querySelector(".link-tile");
    for (let i = 0; i < 30; i++) playLinkItemRewardFlight(source, "hint");
    const registry = getEffectRegistry();
    const before = registry.diagnostics();
    const frames = [...document.querySelectorAll(".game-loot-drop")].flatMap(node => node.getAnimations().flatMap(animation => animation.effect.getKeyframes()));
    const compositorOnly = frames.every(frame => Object.keys(frame).every(key => ["transform", "opacity", "offset", "computedOffset", "easing", "composite"].includes(key)));
    clearLootEffects();
    return { before, after: registry.diagnostics(), compositorOnly, nodes: document.querySelectorAll(".game-loot-drop").length };
  });
  expect(result.before.item).toBe(12);
  expect(result.before.loot).toBe(0);
  expect(result.compositorOnly).toBe(true);
  expect(result.nodes).toBe(0);
  expect(Object.values(result.after).every(count => count === 0)).toBe(true);
});

test("combo presentation restarts without forced layout and releases its owner entry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    const { clearComboWindow, playComboWindow } = await import("/js/gameShell/comboWindowPresentation.js");
    const card = document.querySelector("#link-connect-container .stat-combo");
    for (let index = 0; index < 20; index++) playComboWindow(card, 10000);
    const active = getEffectRegistry().diagnostics();
    const bar = card.querySelector(".combo-window-progress");
    clearComboWindow(card);
    return { active, after: getEffectRegistry().diagnostics(), animations: bar.getAnimations().length, opacity: bar.style.opacity };
  });
  expect(result.active.combo).toBeLessThanOrEqual(1);
  expect(result.after.combo).toBe(0);
  expect(result.animations).toBe(0);
  expect(result.opacity).toBe("0");
});

test("coin counter pulse restarts through owned compositor animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const result = await page.evaluate(async () => {
    (await import("/js/gameSelector.js")).openGameMenu("link-connect");
    await (await import("/js/linkConnect/linkController.js")).startLinkLevel({ mode: "easy" });
    const { animateCoinCounter } = await import("/js/coinRewards.js");
    const { getEffectRegistry } = await import("/js/gameShell/gameShellEffects.js");
    const container = document.querySelector("#link-special-coins");
    const counter = document.querySelector("#link-coin-balance");
    for (let value = 1; value <= 20; value++) animateCoinCounter(container, counter, value - 1, value);
    const active = getEffectRegistry().diagnostics();
    const animations = [...container.querySelectorAll(".ui-icon, strong")].flatMap(node => node.getAnimations());
    animations.forEach(animation => animation.finish());
    await Promise.resolve();
    return { active, after: getEffectRegistry().diagnostics(), legacy: container.classList.contains("is-gaining") };
  });
  expect(result.active.highlight).toBeLessThanOrEqual(2);
  expect(result.after.highlight).toBe(0);
  expect(result.legacy).toBe(false);
});
