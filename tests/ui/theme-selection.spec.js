import { expect, test } from "@playwright/test";

test("theme selection is shared, snapshots Continue assets, and Triple maps every type distinctly", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { startNewMemoryRun, continueMemorySession } = await import("/js/gameController.js");
    const { startLinkLevel, continueLinkSession } = await import("/js/linkConnect/linkController.js");
    const { startTripleConnectDevelopmentRound, continueTripleConnectSession } = await import("/js/tripleConnect/tripleController.js");

    gameState.settings.mode = "easy";
    await startNewMemoryRun();
    const memorySession = structuredClone(gameState.progress.memoryMatch.sessionsByMode.easy);
    const memoryBefore = [...new Set([...document.querySelectorAll(".tile")].map((tile) => tile.dataset.imageId))].sort();
    await continueMemorySession(memorySession);
    const memoryAfter = [...new Set([...document.querySelectorAll(".tile")].map((tile) => tile.dataset.imageId))].sort();

    await startLinkLevel({ mode: "easy" });
    const linkSession = structuredClone(gameState.progress.linkConnect.sessionsByMode.easy);
    const linkBefore = [...new Set([...document.querySelectorAll(".link-tile img")].map((image) => image.src))];
    await continueLinkSession(linkSession);
    const linkAfter = [...new Set([...document.querySelectorAll(".link-tile img")].map((image) => image.src))];

    const triple = (await startTripleConnectDevelopmentRound({ mode: "superHard", seed: "theme-map" }));
    const tripleSession = structuredClone(gameState.progress.tripleConnect.sessionsByMode.superHard);
    const typeMap = tripleSession.snapshot.assetPathsByType;
    const typeCounts = Object.values(tripleSession.snapshot.tiles).reduce((counts, tile) => {
      counts[tile.type] = (counts[tile.type] || 0) + 1;
      return counts;
    }, {});
    await continueTripleConnectSession(tripleSession);
    const restoredMap = gameState.progress.tripleConnect.sessionsByMode.superHard.snapshot.assetPathsByType;

    return {
      memory: { paths: memorySession.assetPaths, before: memoryBefore, after: memoryAfter },
      link: { paths: linkSession.assetPaths, before: linkBefore, after: linkAfter },
      history: gameState.progress.themeSelectionHistory.default,
      triple: { typeMap, restoredMap, typeCounts },
    };
  });

  expect(result.memory.paths).toHaveLength(6);
  expect(result.memory.before).toEqual(result.memory.after);
  expect(result.link.paths).toHaveLength(6);
  expect(result.link.before.sort()).toEqual(result.link.after.sort());
  expect(result.history).toHaveLength(3);
  expect(Object.keys(result.triple.typeMap)).toHaveLength(40);
  expect(new Set(Object.values(result.triple.typeMap)).size).toBe(40);
  expect(Object.values(result.triple.typeCounts).every((count) => count === 3)).toBe(true);
  expect(result.triple.restoredMap).toEqual(result.triple.typeMap);
});

test("Triple production rounds receive fresh seeds while explicit fixture seeds reproduce visual mapping", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { startTripleConnectRound, startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");

    await startTripleConnectRound({ mode: "easy", skipIntro: true });
    const productionFirst = structuredClone(gameState.progress.tripleConnect.sessionsByMode.easy);
    await startTripleConnectRound({ mode: "easy", skipIntro: true });
    const productionSecond = structuredClone(gameState.progress.tripleConnect.sessionsByMode.easy);

    (await startTripleConnectDevelopmentRound({ mode: "easy", seed: "stable-visual-fixture" }));
    const fixtureFirst = structuredClone(gameState.progress.tripleConnect.sessionsByMode.easy);
    (await startTripleConnectDevelopmentRound({ mode: "easy", seed: "stable-visual-fixture" }));
    const fixtureSecond = structuredClone(gameState.progress.tripleConnect.sessionsByMode.easy);

    return {
      productionSeeds: [productionFirst.seed, productionSecond.seed],
      fixtureSeeds: [fixtureFirst.seed, fixtureSecond.seed],
      fixtureMaps: [fixtureFirst.snapshot.assetPathsByType, fixtureSecond.snapshot.assetPathsByType],
    };
  });
  expect(result.productionSeeds[0]).not.toBe(result.productionSeeds[1]);
  expect(result.fixtureSeeds[0]).toBe(result.fixtureSeeds[1]);
  expect(result.fixtureSeeds[0]).toMatch(/^stable-visual-fixture/);
  expect(result.fixtureMaps[0]).toEqual(result.fixtureMaps[1]);
});

test("generated themes persist stable selection IDs for Memory, Link, and Triple", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".game-selector__choice").first()).toBeVisible();
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { startNewMemoryRun } = await import("/js/gameController.js");
    const { startLinkLevel } = await import("/js/linkConnect/linkController.js");
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const themes = ["alphabet", "numbers-2", "numbers-3", "computer-symbols"];
    const results = [];
    for (const theme of themes) {
      gameState.appearance.themes.memoryMatch = theme;
      gameState.appearance.themes.linkConnect = theme;
      gameState.appearance.themes.tripleConnect = theme;
      gameState.settings.mode = "easy";
      await startNewMemoryRun();
      await startLinkLevel({ mode: "easy" });
      (await startTripleConnectDevelopmentRound({ mode: "easy", seed: `generated-${theme}` }));
      results.push({
        theme,
        memory: gameState.progress.memoryMatch.sessionsByMode.easy.assetPaths,
        link: gameState.progress.linkConnect.sessionsByMode.easy.assetPaths,
        triple: Object.values(gameState.progress.tripleConnect.sessionsByMode.easy.snapshot.assetPathsByType),
        history: gameState.progress.themeSelectionHistory[theme],
      });
    }
    return results;
  });
  for (const entry of result) {
    const prefix = `generated:${entry.theme}:`;
    expect(entry.memory).toHaveLength(6);
    expect(entry.link).toHaveLength(6);
    expect(entry.triple).toHaveLength(9);
    expect(entry.history).toHaveLength(3);
    expect([...entry.memory, ...entry.link, ...entry.triple].every((id) => id.startsWith(prefix))).toBe(true);
  }
});
