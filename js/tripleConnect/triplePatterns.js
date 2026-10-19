// Masks describe silhouettes. Layer placement stays deterministic and never uses free coordinates.
export const TRIPLE_PATTERN_MASKS = Object.freeze([
  ['diamond', ['00100','01110','11111','11111','11111','01110','00100']],
  ['arch', ['11111','11011','10001','10001','10001','10001','11011']],
  ['oval', ['01110','11011','10001','10001','10001','11011','01110']],
  ['cross', ['01110','01110','11111','11111','11111','01110','01110']],
  ['spiral', ['11111','10001','10111','10100','10111','10001','11111']],
  ['butterfly', ['11011','11011','11111','01110','11111','11011','11011']],
  ['leaf', ['00110','01111','11111','11110','11100','11000','10000']],
  ['heart', ['11011','11111','11111','11111','01110','01110','00100']],
  ['hourglass', ['11111','11111','01110','00100','01110','11111','11111']],
  ['zigzag', ['11111','00111','01110','11100','01110','00111','11111']],
  ['bridge', ['11111','11111','11011','10001','10001','11011','11011']],
  ['wings', ['10001','11011','11111','11111','11111','11011','10001']],
  ['fan', ['00100','10101','11111','11111','11111','01110','01110']],
  ['steps', ['11000','11000','11100','11100','11110','11111','11111']],
  ['wave', ['11000','11100','11110','01111','00111','00111','00011']],
  ['two-islands', ['11100','11100','11100','00100','00111','00111','00111']],
  ['three-islands', ['01110','01110','00100','01110','11111','11011','11011']],
  ['four-towers', ['11011','11011','11011','10001','11011','11011','11011']],
  ['maze', ['11111','10101','10111','11101','10101','10101','11111']],
  ['flower', ['011100','110110','111111','011110','111110','110110','011100']],
].map(([id, rows]) => Object.freeze({ id, rows: Object.freeze(rows) })));

const cache = new Map();
const CACHE_LIMIT = 24;

export function compileTriplePattern({ index, config, baseLayout }) {
  if (!Number.isInteger(index) || index < 0 || index >= TRIPLE_PATTERN_MASKS.length)
    throw new RangeError('Invalid Triple pattern.');
  const id = `matrix-${String(index).padStart(2, '0')}-${baseLayout.id}`;
  if (cache.has(id)) {
    const result = cache.get(id); cache.delete(id); cache.set(id, result); return result;
  }
  const pattern = TRIPLE_PATTERN_MASKS[index];
  const candidates = pattern.rows.flatMap((row, y) => [...row].flatMap((cell, x) => cell === '1' ? [{ x, y }] : []));
  const count = config.baseTileCount || config.tileCount;
  const baseCount = Math.ceil(count / config.layerCount);
  if (candidates.length < baseCount) throw new RangeError('Pattern has insufficient slots.');
  const selected = [candidates[0]], remaining = candidates.slice(1);
  while (selected.length < baseCount) {
    let bestIndex = 0, bestDistance = -1;
    remaining.forEach((point, index) => {
      const distance = Math.min(...selected.map(other => (point.x - other.x) ** 2 + (point.y - other.y) ** 2));
      if (distance > bestDistance) { bestIndex = index; bestDistance = distance; }
    });
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }
  const corners = Object.keys(baseLayout.cornerStackAnchors || {});
  const leftInset = corners.some(corner => corner.endsWith('left')) ? 3 : 0;
  const rightInset = corners.some(corner => corner.endsWith('right')) ? 3 : 0;
  const layerCounts = Array.from({ length: config.layerCount }, (_, layer) => Math.floor(count / config.layerCount) + (layer < count % config.layerCount ? 1 : 0));
  const slots = layerCounts.flatMap((length, layer) => selected.slice(0, length).map((point, slot) => Object.freeze({
    id: `${id}-l${layer}-${slot}`, layer, x: leftInset + point.x * 2.4 + layer * .06, y: point.y * 2.4 + layer * .06,
  })));
  const gridWidth = Math.ceil(Math.max(...slots.map(slot => slot.x)) + 2) + rightInset;
  const gridHeight = Math.ceil(Math.max(...slots.map(slot => slot.y)) + 2);
  const anchors = Object.fromEntries(corners.map(corner => [corner, Object.freeze({
    x: corner.endsWith('right') ? gridWidth - 2.75 : .75,
    y: corner.startsWith('bottom') ? gridHeight - 2.75 : .75,
  })]));
  const result = Object.freeze({ id, patternId: pattern.id, coordinateUnit: 'half-card', gridWidth, gridHeight,
    tileWidth: 2, tileHeight: 2, overlapEpsilon: .000001,
    layerCounts: Object.freeze(layerCounts), slots: Object.freeze(slots),
    ...(corners.length ? { cornerStackAnchors: Object.freeze(anchors), cornerStackExclusionPadding: .2 } : {}) });
  cache.set(id, result);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
  return result;
}
