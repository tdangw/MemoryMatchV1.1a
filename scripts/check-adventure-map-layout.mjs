import assert from 'node:assert/strict';
import { createMapDecorations, getMapLevelPoint, getMapChestPoint, mapBoxesOverlap, MAP_LEVEL_STEP } from '../js/adventureMapLayout.js';
import { MAX_ADVENTURE_CHAPTER } from '../js/adventureProgress.js';

const games = ['memory-match', 'link-connect', 'triple-connect'];
const box = (x, y, width, height) => ({ left: x - width / 2, right: x + width / 2, top: y, bottom: y + height });
for (const game of games) {
  for (const chapter of [1, 2, 10, 17, 172, 10000, MAX_ADVENTURE_CHAPTER - 1]) {
    const bottom = (chapter - 1) * 100 + 1, top = chapter * 100;
    const decorations = createMapDecorations(game, bottom, top);
    assert.ok(decorations.length >= 10 && decorations.length <= 37);
    assert.deepEqual(decorations, createMapDecorations(game, bottom, top), 'No scenery rerolls on mount/mode changes.');
    const points = Array.from({ length: 100 }, (_, i) => getMapLevelPoint(game, bottom + i, top));
    assert.ok(points.every(point => point.x >= 110 && point.x <= 290));
    assert.ok(new Set(points.map(point => point.x.toFixed(2))).size > 70, 'Path is not a repeating sine template.');
    for (let i = 1; i < points.length; i++) {
      assert.equal(points[i - 1].y - points[i].y, MAP_LEVEL_STEP);
      assert.ok(Math.abs(points[i - 1].x - points[i].x) < 63);
    }
    const chests = Array.from({ length: 10 }, (_, i) => getMapChestPoint(game, (chapter - 1) * 10 + i + 1, top));
    assert.ok(new Set(chests.map(point => point.x.toFixed(2))).size >= 9);
    chests.forEach((chest, i) => {
      const level = getMapLevelPoint(game, (chapter - 1) * 100 + (i + 1) * 10, top);
      assert.ok(Math.abs(chest.x - level.x) > 125, 'Chest and level label remain separated at mobile baseline.');
      assert.ok(Math.abs(chest.y - level.y) <= 16);
      for (const point of points) assert.equal(mapBoxesOverlap(box(chest.x, chest.y - 32, 90 * 400 / 412, 80), box(point.x, point.y - 22, 150 * 400 / 412, 81)), false, 'Chest avoids neighboring level cells at mobile baseline.');
    });
    for (const decor of decorations) {
      assert.ok(decor.slot >= 0 && decor.slot < 16 && ![12, 13].includes(decor.slot));
      const area = box(decor.x, decor.y - decor.size * .55, decor.size, decor.size * 1.1);
      assert.ok(area.left >= 0 && area.right <= 400);
      for (const point of points) assert.equal(mapBoxesOverlap(area, box(point.x, point.y - 32, 180, 108)), false, 'Scenery avoids buttons/stars/detail.');
      for (const chest of chests) assert.equal(mapBoxesOverlap(area, box(chest.x, chest.y - 34, 116, 100)), false, 'Scenery avoids chests.');
    }
    const shift = top + 100;
    for (const level of [bottom, top - 4, top]) {
      const before = getMapLevelPoint(game, level, top), after = getMapLevelPoint(game, level, shift);
      assert.equal(after.x, before.x);
      assert.equal(after.y - before.y, 100 * MAP_LEVEL_STEP);
    }
    const overlapping = createMapDecorations(game, top - 4, top + 100);
    for (const decor of decorations.filter(item => item.id >= top - 3)) {
      const after = overlapping.find(item => item.id === decor.id);
      assert.ok(after, 'Overlap scenery survives a chapter rebase.');
      assert.equal(after.x, decor.x); assert.equal(after.slot, decor.slot);
      assert.equal(after.y - decor.y, 100 * MAP_LEVEL_STEP);
    }
  }
}
assert.throws(() => createMapDecorations(games[0], 1, 1000), RangeError);
assert.throws(() => createMapDecorations('unknown', 1, 100), RangeError);
console.log('Adventure map geometry/scenery: deterministic, bounded, collision-safe and seam-stable.');
