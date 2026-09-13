import { expect, test } from "@playwright/test";

test("Triple development checkpoint restores after reload without undo history", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "persist" });
    for (const command of run.generated.witness) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
      if (run.getState().matchedTriples) break;
    }
    return { matched: run.getState().matchedTriples, score: run.getState().score };
  });
  expect(before).toEqual({ matched: 1, score: 10 });
  await page.reload();
  const restored = await page.evaluate(async () => {
    const { continueTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = continueTripleConnectDevelopmentRound();
    return { matched: run?.getState().matchedTriples, score: run?.getState().score, history: run?.getState().undoHistory.length };
  });
  expect(restored).toEqual({ matched: 1, score: 10, history: 0 });
});
