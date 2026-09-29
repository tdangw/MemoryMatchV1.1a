import { expect, test } from "@playwright/test";

async function startWitnessRound(page, { mode, level = 1, seed }) {
  await page.goto("/");
  await page.evaluate(async (options) => {
    const { startTripleConnectRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    window.__tripleWitnessRun = await startTripleConnectRound({
      ...options,
      skipIntro: true,
    });
  }, { mode, level, seed });
}

async function replayWitnessThroughBoard(page) {
  const witness = await page.evaluate(
    () => window.__tripleWitnessRun.generated.witness,
  );
  for (const command of witness) {
    const tile = page.locator(
      `.triple-connect__board [data-tile-id="${command.tileId}"]`,
    );
    await expect(tile).toBeVisible();
    await expect(tile).toBeEnabled();
    await tile.click();
    await page.waitForFunction(
      () =>
        !document.querySelector(
          ".triple-connect__tray-flight, .triple-connect__ghost",
        ),
    );
  }
  await expect(page.locator("#level-summary-modal")).toBeVisible({ timeout: 8000 });
}

test("Triple witness remains playable through the rendered board for every active mode and Challenge stage", async ({
  page,
}) => {
  test.setTimeout(180_000);
  for (const mode of ["easy", "normal", "hard", "superHard", "endless"]) {
    await startWitnessRound(page, { mode, seed: `witness-${mode}` });
    await replayWitnessThroughBoard(page);
  }
  for (let level = 1; level <= 7; level += 1) {
    await startWitnessRound(page, {
      mode: "challenge",
      level,
      seed: `witness-challenge-${level}`,
    });
    await replayWitnessThroughBoard(page);
  }
});
