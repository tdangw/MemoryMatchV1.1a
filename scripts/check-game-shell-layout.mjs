import assert from "node:assert/strict";
import { calculateBoardLayout as fit, getGameShellLayoutDiagnostics } from "../js/gameShell/gameShellLayout.js";
import { normalizeGameShellConfig as normalize } from "../js/gameShell/gameShellConfig.js";

assert.deepEqual(fit({ width: 300, height: 400, columns: 4, rows: 3, gap: 4, padding: 6, precision: 1 }),
  { tileSize: 69, boardWidth: 300, boardHeight: 227, gap: 4, padding: 6 });
assert.deepEqual(fit({ width: 300, height: 400, columns: 4, rows: 3, gap: 4, padding: 6, borderX: 2, borderY: 2 }),
  { tileSize: 68.5, boardWidth: 300, boardHeight: 227.5, gap: 4, padding: 6 });
for (const width of [0, 10, 120, 300, 684]) for (const height of [0, 10, 90, 180, 600]) {
  for (const [columns, rows] of [[1, 1], [4, 3], [6, 10], [10, 10]]) {
    const result = fit({ width, height, columns, rows, gap: 6, padding: 8 });
    assert.ok(Object.values(result).every(value => Number.isFinite(value) && value >= 0));
    assert.ok(result.boardWidth <= width + 1e-6 && result.boardHeight <= height + 1e-6);
  }
}
assert.ok(fit({ width: 300, height: 180, columns: 6, rows: 10, gap: 4, padding: 6 }).tileSize < 36,
  "A legacy minimum tile size must not force tall boards out of the viewport");
assert.equal(fit({ width: 1000, height: 1000, columns: 2, rows: 2, gap: 6, padding: 8, maxTileSize: 180 }).tileSize, 180);
for (const overrides of [{ width: NaN }, { height: Infinity }, { gap: -1 }, { columns: 0 }, { rows: 1.5 }, { precision: 0 }, { precision: 1.5 }]) {
  assert.equal(fit({ width: 300, height: 400, columns: 4, rows: 3, gap: 4, padding: 6, ...overrides }), null);
}
for (const layout of [{ widthRatio: 2 }, { mobileWidthRatio: 0 }, { tilePrecision: 0.5 }, { edgeInsetMin: 9, edgeInsetMax: 4 }]) {
  assert.throws(() => normalize({ layout }), TypeError);
}
assert.equal(getGameShellLayoutDiagnostics().active, 0, "Importing layout must not register browser resources");
console.log("Game Shell fit bounds, borders, rounding, tiny viewports and configuration passed.");
