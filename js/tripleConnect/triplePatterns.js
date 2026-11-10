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
const LAYER_PHASES = Object.freeze([[0, 0], [1, .8], [.35, 1.5], [1.45, .25], [.7, 1.1], [1.7, 1.75]].map(Object.freeze));
const ROW_PITCH = 2.1;

function overlaps(left, right) {
  return Math.abs(left.x - right.x) < 1.999999 && Math.abs(left.y - right.y) < 1.999999;
}

// A protected corner is a conservative visibility guarantee: no lower face
// disappears beneath the union of later layers. It does not affect playability;
// the board's cover graph still blocks a card for ANY rectangle overlap.
function retainsCorner(slot, blockers) {
  return [.001, 1.999].some(dx => [.001, 1.999].some(dy => !blockers.some(other =>
    other.layer > slot.layer && slot.x + dx > other.x && slot.x + dx < other.x + 2
    && slot.y + dy > other.y && slot.y + dy < other.y + 2)));
}

function distributeLayers(pattern, layerCounts, leftInset, id) {
  const slots = [];
  const columns = layerCounts[0] > 19 ? 7 : pattern.rows[0].length;
  const rows = layerCounts[0] > 19 ? 9 : 7;
  for (let layer = 0; layer < layerCounts.length; layer++) {
    const [dx, dy] = LAYER_PHASES[layer];
    const candidates = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
      if (pattern.rows[Math.floor(y * pattern.rows.length / rows)][Math.floor(x * pattern.rows[0].length / columns)] === '1')
        candidates.push({ x: leftInset + x * ROW_PITCH + dx + ((y + layer) % 3) * layer * .2, y: y * ROW_PITCH + dy, layer });
    }
    const chosen = [];
    for (let index = 0; index < layerCounts[layer]; index++) {
      let bestIndex = -1, bestDistance = -Infinity;
      for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
        const point = candidates[candidateIndex];
        if (layer && !slots.some(lower => overlaps(lower, point))) continue;
        const blockers = [...slots, ...chosen, point];
        if (slots.some(lower => !retainsCorner(lower, blockers))) continue;
        const distance = chosen.length
          ? Math.min(...chosen.map(other => (point.x - other.x) ** 2 + (point.y - other.y) ** 2))
          : (point.x - leftInset - 6) ** 2 + (point.y - 7) ** 2;
        if (distance > bestDistance) { bestIndex = candidateIndex; bestDistance = distance; }
      }
      if (bestIndex < 0) throw new RangeError(`Triple pattern cannot fill layer ${layer}.`);
      chosen.push(Object.freeze({ ...candidates.splice(bestIndex, 1)[0], id: `${id}-l${layer}-${index}` }));
    }
    slots.push(...chosen);
  }
  return slots;
}

export function compileTriplePattern({ index, config, baseLayout, version = 2 }) {
  if (!Number.isInteger(index) || index < 0 || index >= TRIPLE_PATTERN_MASKS.length)
    throw new RangeError('Invalid Triple pattern.');
  if(version!==1&&version!==2)throw new RangeError('Invalid Triple pattern version.');
  const id = `matrix-${version===2?'v2-':''}${String(index).padStart(2, '0')}-${baseLayout.id}`;
  if (cache.has(id)) {
    const result = cache.get(id); cache.delete(id); cache.set(id, result); return result;
  }
  const pattern = TRIPLE_PATTERN_MASKS[index];
  const candidates = pattern.rows.flatMap((row, y) => [...row].flatMap((cell, x) => cell === '1' ? [{ x, y }] : []));
  const count = config.baseTileCount || config.tileCount;
  const baseCount = Math.ceil(count / config.layerCount);
  if (candidates.length < baseCount) throw new RangeError('Pattern has insufficient slots.');
  const selected = [candidates[0]], remaining = candidates.slice(1);
  while (version === 1 && selected.length < baseCount) {
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
  const layerCounts = version === 2 ? baseLayout.layerCounts : Array.from({ length: config.layerCount }, (_, layer) => Math.floor(count / config.layerCount) + (layer < count % config.layerCount ? 1 : 0));
  // Keep the old compiler byte-compatible for saved sessions. New boards use
  // independent rows per layer, with fewer cards toward the foreground.
  const slots = version === 2 ? distributeLayers(pattern, layerCounts, leftInset, id) : layerCounts.flatMap((length, layer) => selected.slice(0, length).map((point, slot) => Object.freeze({
    id: `${id}-l${layer}-${slot}`, layer,
    x: leftInset + point.x * 2.4 + layer * .06,
    y: point.y * 2.4 + layer * .06,
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
