import { expect, test } from "@playwright/test";

test("theme selection is shared, snapshots Continue assets, and Triple maps every type distinctly", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { startNewMemoryRun, continueMemorySession } = await import("/js/gameController.js");
    const { startLinkLevel, continueLinkSession } = await import("/js/linkConnect/linkController.js");
    const { startTripleConnectDevelopmentRound, continueTripleConnectSession } = await import("/js/tripleConnect/tripleController.js");

    gameState.settings.mode = "easy";
    startNewMemoryRun();
    const memorySession = structuredClone(gameState.progress.memoryMatch.sessionsByMode.easy);
    const memoryBefore = [...new Set([...document.querySelectorAll(".tile")].map((tile) => tile.dataset.imageId))].sort();
    continueMemorySession(memorySession);
    const memoryAfter = [...new Set([...document.querySelectorAll(".tile")].map((tile) => tile.dataset.imageId))].sort();

    startLinkLevel({ mode: "easy" });
    const linkSession = structuredClone(gameState.progress.linkConnect.sessionsByMode.easy);
    const linkBefore = [...new Set([...document.querySelectorAll(".link-tile img")].map((image) => image.src))];
    continueLinkSession(linkSession);
    const linkAfter = [...new Set([...document.querySelectorAll(".link-tile img")].map((image) => image.src))];

    const triple = startTripleConnectDevelopmentRound({ mode: "superHard", seed: "theme-map" });
    const tripleSession = structuredClone(gameState.progress.tripleConnect.sessionsByMode.superHard);
    const typeMap = tripleSession.snapshot.assetPathsByType;
    const typeCounts = Object.values(tripleSession.snapshot.tiles).reduce((counts, tile) => {
      counts[tile.type] = (counts[tile.type] || 0) + 1;
      return counts;
    }, {});
    continueTripleConnectSession(tripleSession);
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
  const result = await page.evaluate(async () => {
    const { gameState } = await import("/js/gameState.js");
    const { startTripleConnectRound, startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");

    startTripleConnectRound({ mode: "easy", skipIntro: true });
    const productionFirst = structuredClone(gameState.progress.tripleConnect.sessionsByMode.easy);
    startTripleConnectRound({ mode: "easy", skipIntro: true });
    const productionSecond = structuredClone(gameState.progress.tripleConnect.sessionsByMode.easy);

    startTripleConnectDevelopmentRound({ mode: "easy", seed: "stable-visual-fixture" });
    const fixtureFirst = structuredClone(gameState.progress.tripleConnect.sessionsByMode.easy);
    startTripleConnectDevelopmentRound({ mode: "easy", seed: "stable-visual-fixture" });
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
