import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverGeometry, placeRegion } from '../../js/background/geometry.js';

test('center cover uses the real source aspect and rejects invalid measurements', () => {
  assert.deepEqual(coverGeometry(844, 390, 1536, 1024), { scale: 844 / 1536, x: 0, y: (390 - 1024 * 844 / 1536) / 2 });
  for (const width of [0, -1, NaN, Infinity]) assert.equal(coverGeometry(width, 390, 1536, 1024), null);
});
test('entire motion envelope must fit crop and avoid every interactive region', () => {
  const cover = coverGeometry(400, 800, 1000, 2000);
  const region = { x: 100, y: 500, width: 50, height: 100 };
  assert.deepEqual(placeRegion(region, cover, { width: 400, height: 800 }), { x: 40, y: 200, width: 20, height: 40 });
  assert.equal(placeRegion(region, cover, { width: 400, height: 800 }, [{ left: 59, right: 70, top: 210, bottom: 230 }]), null);
  assert.equal(placeRegion({ ...region, x: 990 }, cover, { width: 400, height: 800 }), null);
  assert.equal(placeRegion(region, null, { width: 400, height: 800 }), null);
});
