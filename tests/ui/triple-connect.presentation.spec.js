import { expect, test } from "@playwright/test";

test("Triple match commits before presentation and unmount cancels ghosts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "presentation" });
    const byType = {};
    for (const command of run.generated.witness) {
      const node = document.querySelector(`[data-tile-id="${command.tileId}"]`);
      node.click();
      if (run.getState().matchedTriples) break;
    }
    return { matched: run.getState().matchedTriples, shell: run.shell.refs.root.id };
  });
  expect(result.matched).toBe(1);
  await expect(page.locator(".triple-connect__line polyline")).toHaveCount(1);
  await page.evaluate(async () => (await import("/js/gameShell/gameShell.js")).unmountActiveGameShell());
  await expect(page.locator(".triple-connect__ghost")).toHaveCount(0);
  await expect(page.locator(".triple-connect__line polyline")).toHaveCount(0);
});

test("Triple reduced motion settles to the same committed match without ghosts", async ({ page }) => {
  await page.goto("/");
  const matched = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import("/js/tripleConnect/tripleController.js");
    const run = startTripleConnectDevelopmentRound({ seed: "reduced" });
    for (const command of run.generated.witness) {
      document.querySelector(`[data-tile-id="${command.tileId}"]`)?.click();
      if (run.getState().matchedTriples) break;
    }
    return run.getState().matchedTriples;
  });
  expect(matched).toBe(1);
  await expect(page.locator(".triple-connect__ghost, .triple-connect__line polyline")).toHaveCount(0);
});
