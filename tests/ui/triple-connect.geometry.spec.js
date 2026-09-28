import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const stableBaseline = JSON.parse(readFileSync(
  new URL("./baselines/triple-connect-ux-3-4.json", import.meta.url),
  "utf8",
));

const viewports = stableBaseline.viewports;
const topology = stableBaseline.visualTopology;

const modes = [
  ["easy", 27],
  ["normal", 46],
  ["hard", 65],
  ["superHard", 100],
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
              coverDepth: Number(node.dataset.tripleCoverDepth),
              exposed: node.classList.contains("is-exposed"),
              objectFit: getComputedStyle(node.querySelector("img")).objectFit,
              padding: getComputedStyle(node).padding,
              imageSource: node.querySelector("img")?.src || "",
            })),
            trayColumns:
              getComputedStyle(tray).gridTemplateColumns.split(" ").length,
            boardAndTraySeparated: board.getBoundingClientRect().bottom <=
              tray.getBoundingClientRect().top,
            cornerStacks: Object.values(run.getState().cornerStacks).map((pile, index) => {
              const tileId = pile.tileIds.at(-1);
              const node = board.querySelector(`[data-tile-id="${tileId}"]`);
              const tileRect = node?.getBoundingClientRect();
              const hit = tileRect && document.elementFromPoint(
                tileRect.left + tileRect.width / 2,
                tileRect.top + tileRect.height / 2,
              );
              if (index === 0) node?.click();
              return {
                tileId,
                rendered: Boolean(node),
                hitTargetId: hit?.closest("[data-tile-id]")?.dataset.tileId || null,
                movedOffBoard: index === 0 && run.getState().tiles[tileId].location !== "board",
              };
            }),
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
      const exposedTiles = geometry.boardTiles.filter((tile) => tile.exposed);
      const occludedTiles = geometry.boardTiles.filter((tile) => tile.coverDepth > 0);
      expect(exposedTiles.length).toBeGreaterThan(0);
      expect(occludedTiles.length).toBeGreaterThan(0);
      expect(exposedTiles.every((tile) => tile.coverDepth === 0 && !tile.disabled && tile.opacity === 1)).toBe(true);
      expect(occludedTiles.every((tile) => !tile.exposed && tile.disabled && tile.opacity <= 0.42)).toBe(true);
      expect(geometry.boardTiles.every((tile) => tile.objectFit === topology.imageObjectFit)).toBe(true);
      expect(geometry.boardTiles.every((tile) => tile.padding === "0px")).toBe(true);
      expect(geometry.board.width).toBeGreaterThan(topology.boardMinWidth);
      expect(
        Math.abs(geometry.tray.width - geometry.board.width),
      ).toBeLessThanOrEqual(topology.traySizeTolerancePx);
      expect(geometry.trayColumns).toBe(topology.traySlotCount);
      expect(geometry.boardAndTraySeparated).toBe(true);
      expect(geometry.cornerStacks.every((stack) => stack.rendered)).toBe(true);
      expect(geometry.cornerStacks.every((stack) => stack.hitTargetId === stack.tileId)).toBe(true);
      expect(geometry.cornerStacks.length === 0 || geometry.cornerStacks[0].movedOffBoard).toBe(true);
      expect(geometry.root.top).toBeGreaterThanOrEqual(-1);
      expect(geometry.root.bottom).toBeLessThanOrEqual(viewport.height + 1);
      expect(geometry.tray.top).toBeGreaterThanOrEqual(-1);
      expect(geometry.tray.bottom).toBeLessThanOrEqual(viewport.height + 1);
      expect(geometry.layout.coordinateUnit).toBe("half-card");
      expect(
        Math.abs(
          geometry.boardTiles[0].rect.width -
            geometry.boardTiles[0].rect.height,
        ),
      ).toBeLessThanOrEqual(topology.squareTolerancePx);
      expect(geometry.boardTiles[0].rect.width).toBeGreaterThanOrEqual(topology.tileMinSize);
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

test("Triple tray owns ten stable visual slots with three locked by default", async ({ page }) => {
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
      await new Promise((resolve) => requestAnimationFrame(resolve));
      snapshots.push({ tray: rect(tray), slots: [...tray.children].map(rect) });
    }
    return [
      snapshots,
      [...document.querySelectorAll(".triple-connect__tray .triple-connect__tile")]
        .map((node) => ({
          rect: rect(node),
          opacity: Number(getComputedStyle(node).opacity),
          filter: getComputedStyle(node).filter,
          padding: getComputedStyle(node).padding,
        })),
      {
        capacity: tray.dataset.tripleTrayCapacity,
        label: tray.getAttribute("aria-label"),
        locked: tray.querySelectorAll('[data-triple-tray-locked="true"]').length,
      },
    ];
  });

  const [snapshots, trayTiles, trayState] = trayGeometry;
  expect(snapshots).not.toHaveLength(0);
  expect(snapshots.every(({ slots }) => slots.length === 10)).toBe(true);
  expect(snapshots.every(({ slots }) => new Set(slots.map((slot) => Math.round(slot.top))).size === 1)).toBe(true);
  expect(trayState).toEqual({ capacity: "7", label: "Khay 10 ô, 3 ô đang khóa", locked: 3 });
  for (const snapshot of snapshots) {
    expect(snapshot.tray.height).toBeCloseTo(snapshots[0].tray.height, topology.trayStabilityTolerancePx);
    expect(snapshot.tray.width).toBeCloseTo(snapshots[0].tray.width, topology.trayStabilityTolerancePx);
    expect(snapshot.slots.map((slot) => [slot.width, slot.height])).toEqual(
      snapshots[0].slots.map((slot) => [slot.width, slot.height]),
    );
  }
  expect(trayTiles.length).toBeGreaterThan(0);
  expect(trayTiles[0].rect.width).toBeGreaterThan(0);
  expect(trayTiles[0].rect.height).toBeGreaterThan(0);
  expect(trayTiles.every((tile) => tile.opacity === 1 && tile.filter === "none" && tile.padding === "0px")).toBe(true);
});

test("Triple milestone HUD uses the shared ten-marker geometry", async ({ page }) => {
  await page.setViewportSize({ width: 914, height: 900 });
  await page.goto("/");
  const milestones = await page.evaluate(async () => {
    const { startTripleConnectDevelopmentRound } = await import(
      "/js/tripleConnect/tripleController.js"
    );
    startTripleConnectDevelopmentRound({ seed: "triple-milestone-geometry" });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const root = document.querySelector("#triple-connect-container");
    const hud = root.querySelector(".triple-connect__milestones");
    const coins = root.querySelector(".triple-connect__milestone-coins");
    const track = root.querySelector(".triple-connect__milestone-track");
    const rect = (node) => node.getBoundingClientRect().toJSON();
    return {
      hud: rect(hud),
      coins: rect(coins),
      track: rect(track),
      markers: [...track.querySelectorAll("span")].map((marker) => rect(marker)),
      hudBackground: getComputedStyle(hud).backgroundColor,
    };
  });

  expect(milestones.markers).toHaveLength(10);
  expect(milestones.hud.width).toBeCloseTo(260, 0);
  expect(milestones.coins.right).toBeLessThanOrEqual(milestones.hud.left - 6);
  expect(milestones.markers[0].x).toBeCloseTo(
    milestones.track.left + milestones.track.width * 0.05 - milestones.markers[0].width / 2,
    0,
  );
  expect(milestones.markers.at(-1).x).toBeCloseTo(
    milestones.track.left + milestones.track.width * 0.95 - milestones.markers.at(-1).width / 2,
    0,
  );
  expect(milestones.hudBackground).not.toBe("rgba(0, 0, 0, 0)");
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
