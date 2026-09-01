import assert from "node:assert/strict";
import {
  findAvailableConnections,
  findConnectionPath,
  hasAvailableConnection,
} from "../js/linkConnect/pathfinder.js";
import {
  calculateLinkMatchPoints,
  getLinkChallengeLayout,
  getLinkModeLayout,
  getLinkTimerDirection,
} from "../js/linkConnect/linkConfig.js";
import {
  getActiveLinkConnectionEffect,
  LINK_EXIT_EFFECTS,
  LINK_PATH_EFFECTS,
} from "../js/linkConnect/linkEffects.js";

const tile = (id) => ({ id });

const straightGrid = [
  [null, null, null, null, null],
  [null, tile("a"), null, tile("a"), null],
  [null, null, null, null, null],
];
assert.deepEqual(findConnectionPath(straightGrid, { row: 1, column: 1 }, { row: 1, column: 3 }), [
  { row: 1, column: 1 },
  { row: 1, column: 3 },
]);

const cornerGrid = [
  [null, null, null, null, null],
  [null, tile("a"), null, null, null],
  [null, null, null, tile("a"), null],
  [null, null, null, null, null],
];
assert.equal(findConnectionPath(cornerGrid, { row: 1, column: 1 }, { row: 2, column: 3 }).length, 3);

const boundaryGrid = [
  [null, null, null, null, null],
  [null, tile("a"), tile("block"), tile("a"), null],
  [null, null, null, null, null],
];
assert.equal(findConnectionPath(boundaryGrid, { row: 1, column: 1 }, { row: 1, column: 3 }).length, 4);
assert.equal(hasAvailableConnection(boundaryGrid), true);
assert.equal(findAvailableConnections(boundaryGrid).length, 1);

const blockedGrid = [
  [tile("wall"), tile("wall"), tile("wall"), tile("wall"), tile("wall")],
  [tile("wall"), tile("a"), tile("block"), tile("a"), tile("wall")],
  [tile("wall"), tile("wall"), tile("wall"), tile("wall"), tile("wall")],
];
assert.equal(findConnectionPath(blockedGrid, { row: 1, column: 1 }, { row: 1, column: 3 }), null);

assert.equal(getLinkModeLayout("hard").tileCount, 36);
assert.equal(getLinkChallengeLayout(10).tileCount, 24);
assert.equal(getLinkTimerDirection("endless"), "up");
assert.equal(calculateLinkMatchPoints(3), 16);
assert.equal(calculateLinkMatchPoints(3, { special: true }), 24);
assert.equal(getActiveLinkConnectionEffect({ linkPathEffect: "electric", linkExitEffect: "dissolve" }).pathClass, "link-path-overlay--electric");
assert.equal(LINK_PATH_EFFECTS.length, 20);
assert.equal(LINK_EXIT_EFFECTS.length, 20);

console.log("Link Connect core checks passed.");
