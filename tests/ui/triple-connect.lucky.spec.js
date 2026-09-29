import { expect, test } from "@playwright/test";

test("Challenge Lucky rewards once, clears Undo, and persists its claim ledger", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectRound } = await import("/js/tripleConnect/tripleController.js");
    const { getActiveSession } = await import("/js/sessionProgress.js");
    const run = await startTripleConnectRound({ mode: "challenge", level: 1, seed: "lucky-ui", skipIntro: true });
    const luckyIds = Object.values(run.getState().tiles).flatMap((tile) => tile.lucky ? [tile.lucky.id] : []);
    const commands = run.generated.witness;
    for (const command of commands) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
      await new Promise((resolve) => setTimeout(resolve, 280));
      if (run.getState().claimedLuckyIds.length) break;
    }
    const state = run.getState();
    return {
      luckyIds,
      claimed: state.claimedLuckyIds,
      undo: state.undoHistory.length,
      session: getActiveSession("triple-connect", "challenge"),
      badgeCount: document.querySelectorAll(".triple-connect__tile.is-lucky").length,
    };
  });
  expect(result.luckyIds).toContain(result.claimed[0]);
  expect(result.claimed).toHaveLength(1);
  expect(result.undo).toBe(0);
  expect(result.session.snapshot.claimedLuckyIds).toEqual(result.claimed);
  expect(result.badgeCount).toBeGreaterThan(0);
});
