import { expect, test } from "@playwright/test";

const viewports = [
  { width: 360, height: 640 },
  { width: 640, height: 360 },
  { width: 411, height: 914 },
  { width: 914, height: 411 },
  { width: 1440, height: 900 },
];

const modes = [
  ["easy", 12],
  ["normal", 24],
  ["hard", 36],
  ["superHard", 60],
];

for (const viewport of viewports) {
  test(`Triple board geometry stays playable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    for (const [mode, expectedTileCount] of modes) {
      const geometry = await page.evaluate(
        async ({ selectedMode }) => {
          const { startTripleConnectDevelopmentRound } = await import(
            "/js/tripleConnect/tripleController.js"
          );
          const { getTripleLayout } = await import(
            "/js/tripleConnect/tripleBoard.js"
          );
          const run = startTripleConnectDevelopmentRound({
            mode: selectedMode,
            seed: `geometry-${selectedMode}`,
          });
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          const layout = getTripleLayout(run.generated.layoutId);
          const root = document.querySelector("#triple-connect-container");
          const board = root.querySelector(".triple-connect__board");
          const tray = root.querySelector(".triple-connect__tray");
          const rect = (node) => node.getBoundingClientRect().toJSON();
          return {
            root: rect(root),
            board: rect(board),
            tray: rect(tray),
            boardTiles: [
              ...board.querySelectorAll(".triple-connect__tile"),
            ].map((node) => ({
              rect: rect(node),
              disabled: node.disabled,
              opacity: Number(getComputedStyle(node).opacity),
              objectFit: getComputedStyle(node.querySelector("img")).objectFit,
              imageSource: node.querySelector("img")?.src || "",
            })),
            trayColumns:
              getComputedStyle(tray).gridTemplateColumns.split(" ").length,
            boardAndTraySeparated: board.getBoundingClientRect().bottom <=
              tray.getBoundingClientRect().top,
            layout,
          };
        },
        { selectedMode: mode },
      );

      expect(geometry.layout.id).toContain(
        mode === "superHard" ? "super-hard" : mode,
      );
      expect(geometry.boardTiles).toHaveLength(expectedTileCount);
      expect(geometry.boardTiles.some((tile) => tile.disabled)).toBe(true);
      expect(geometry.boardTiles.filter((tile) => tile.disabled).every((tile) => tile.opacity < 1)).toBe(true);
      expect(geometry.boardTiles.every((tile) => tile.objectFit === "contain")).toBe(true);
      expect(geometry.board.width).toBeGreaterThan(300);
      expect(
        Math.abs(geometry.tray.width - geometry.board.width),
      ).toBeLessThanOrEqual(2);
      expect(geometry.trayColumns).toBe(7);
      expect(geometry.boardAndTraySeparated).toBe(true);
      expect(geometry.root.top).toBeGreaterThanOrEqual(-1);
      expect(geometry.root.bottom).toBeLessThanOrEqual(viewport.height + 1);
      expect(geometry.layout.coordinateUnit).toBe("half-card");
      expect(
        Math.abs(
          geometry.boardTiles[0].rect.width -
            geometry.boardTiles[0].rect.height,
        ),
      ).toBeLessThanOrEqual(2);
      expect(geometry.boardTiles[0].rect.width).toBeGreaterThanOrEqual(24);
      for (const tile of geometry.boardTiles) {
        expect(tile.rect.left).toBeGreaterThanOrEqual(geometry.board.left - 1);
        expect(tile.rect.right).toBeLessThanOrEqual(geometry.board.right + 1);
        expect(tile.rect.top).toBeGreaterThanOrEqual(geometry.board.top - 1);
        expect(tile.rect.bottom).toBeLessThanOrEqual(geometry.board.bottom + 1);
        expect(tile.imageSource).not.toBe("");
      }
    }
  });
}

test("Triple tray owns seven stable slots through selection and regroup", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/");
  const trayGeometry = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const run = startTripleConnectDevelopmentRound({ seed: "tray-touch-target" });
    const rect = (node) => node.getBoundingClientRect().toJSON();
    const tray = document.querySelector(".triple-connect__tray");
    const snapshots = [{ tray: rect(tray), slots: [...tray.children].map(rect) }];
    for (let index = 0; index < 5; index += 1) {
      const tile = [...document.querySelectorAll(".triple-connect__board .triple-connect__tile:not(:disabled)")]
        .find((node) => node.dataset.tileId !== run.getState().tray.at(-1));
      if (!tile) break;
      tile.click();
      await new Promise((resolve) => setTimeout(resolve, 240));
      snapshots.push({ tray: rect(tray), slots: [...tray.children].map(rect) });
    }
    return [
      snapshots,
      [...document.querySelectorAll(".triple-connect__tray .triple-connect__tile")]
        .map((node) => rect(node)),
    ];
  });

  const [snapshots, trayTiles] = trayGeometry;
  expect(snapshots).not.toHaveLength(0);
  expect(snapshots.every(({ slots }) => slots.length === 7)).toBe(true);
  for (const snapshot of snapshots) {
    expect(snapshot.tray.height).toBeCloseTo(snapshots[0].tray.height, 1);
    expect(snapshot.tray.width).toBeCloseTo(snapshots[0].tray.width, 1);
    expect(snapshot.slots.map((slot) => [slot.width, slot.height])).toEqual(
      snapshots[0].slots.map((slot) => [slot.width, slot.height]),
    );
  }
  expect(trayTiles.length).toBeGreaterThan(0);
  expect(trayTiles[0].width).toBeGreaterThan(0);
  expect(trayTiles[0].height).toBeGreaterThan(0);
});

test("Triple image errors fall back without changing board topology", async ({
  page,
}) => {
  await page.goto("/");
  const fallback = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    const run = startTripleConnectDevelopmentRound({ seed: "image-fallback" });
    const image = document.querySelector(
      ".triple-connect__board .triple-connect__tile img",
    );
    const tileCount = document.querySelectorAll(
      ".triple-connect__board .triple-connect__tile",
    ).length;
    image.dispatchEvent(new Event("error"));
    return {
      imageSource: image.src,
      tileCountAfterError: document.querySelectorAll(
        ".triple-connect__board .triple-connect__tile",
      ).length,
      stateTileCount: Object.keys(run.getState().tiles).filter(
        (id) => run.getState().tiles[id].location === "board",
      ).length,
      tileCount,
    };
  });

  expect(fallback.imageSource).toContain("data:image/svg+xml");
  expect(fallback.tileCountAfterError).toBe(fallback.tileCount);
  expect(fallback.stateTileCount).toBe(fallback.tileCount);
});

test("Triple orientation changes preserve the active board instance", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/");
  const before = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    startTripleConnectDevelopmentRound({
      mode: "superHard",
      seed: "orientation",
    });
    return [
      ...document.querySelectorAll(
        ".triple-connect__board .triple-connect__tile",
      ),
    ]
      .map((node) => node.dataset.tileId)
      .sort();
  });

  await page.setViewportSize({ width: 640, height: 360 });
  const after = await page
    .locator(".triple-connect__board .triple-connect__tile")
    .evaluateAll((nodes) => nodes.map((node) => node.dataset.tileId).sort());

  expect(after).toEqual(before);
});
