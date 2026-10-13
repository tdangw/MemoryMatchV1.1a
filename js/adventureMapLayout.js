// Global coordinates keep scenery stable when the bounded chapter window rebases.
export const MAP_LEVEL_STEP = 104;
export const MAP_WIDTH = 400;
const GAME_SEEDS = { 'memory-match': 193, 'link-connect': 947, 'triple-connect': 1579 };

function noise(index, seed) {
  let value = Math.imul(index ^ seed, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}
function seedFor(gameId) {
  const seed = GAME_SEEDS[gameId];
  if (!seed) throw new RangeError('Unknown map game.');
  return seed;
}
function levelX(level, seed) {
  const segment = Math.floor((level - 1) / 4);
  const t = ((level - 1) % 4) / 4;
  const blend = t * t * (3 - 2 * t);
  const knot = index => (index % 2 ? 245 : 110) + 45 * noise(index, seed);
  const from = knot(segment);
  return from + (knot(segment + 1) - from) * blend;
}
export function getMapLevelPoint(gameId, level, topLevel) {
  return { x: levelX(level, seedFor(gameId)), y: (topLevel - level) * MAP_LEVEL_STEP + 64 };
}
function chestPoint(number, seed) {
  const level = number * 10;
  const pathX = levelX(level, seed);
  const inset = 54 + noise(number, seed + 11) * 16;
  // Either bank is valid near the center; prefer the bank with room farther out.
  const left = pathX > 205 || (pathX >= 195 && noise(number, seed + 17) > .5);
  // Keep the chest below the row center so its top never clips the previous row's label.
  return { x: left ? inset : MAP_WIDTH - inset, offsetY: noise(number, seed + 23) * 16 };
}
export function getMapChestPoint(gameId, number, topLevel) {
  const point = chestPoint(number, seedFor(gameId));
  return { x: point.x, y: (topLevel - number * 10) * MAP_LEVEL_STEP + 64 + point.offsetY };
}
const rectangle = (x, y, width, height) => ({ left: x - width / 2, right: x + width / 2, top: y, bottom: y + height });
export function mapBoxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
function reservedBoxes(level, seed) {
  const boxes = [];
  // Reserve stars/detail at the narrowest supported fluid width as well as the button.
  for (let nearby = Math.max(1, level - 2); nearby <= level + 2; nearby++) {
    boxes.push(rectangle(levelX(nearby, seed), (level - nearby) * MAP_LEVEL_STEP - 32, 180, 108));
  }
  const chestNumber = Math.max(1, Math.round(level / 10));
  const chest = chestPoint(chestNumber, seed);
  boxes.push(rectangle(chest.x, (level - chestNumber * 10) * MAP_LEVEL_STEP + chest.offsetY - 34, 116, 100));
  return boxes;
}
function crossesPath(box, level, seed) {
  // A cubic segment stays inside the horizontal hull of its endpoint/control points.
  for (let nearby = Math.max(1, level - 2); nearby <= level + 2; nearby++) {
    const x1 = levelX(nearby, seed), x2 = levelX(nearby + 1, seed);
    const hull = { left: Math.min(x1, x2) - 14, right: Math.max(x1, x2) + 14, top: (level - nearby - 1) * MAP_LEVEL_STEP, bottom: (level - nearby) * MAP_LEVEL_STEP };
    if (mapBoxesOverlap(box, hull)) return true;
  }
  return false;
}
export function createMapDecorations(gameId, bottomLevel, topLevel) {
  const seed = seedFor(gameId);
  if (!Number.isSafeInteger(bottomLevel) || !Number.isSafeInteger(topLevel) || bottomLevel < 1 || topLevel < bottomLevel || topLevel - bottomLevel > 109) throw new RangeError('Map scenery requires a bounded chapter window.');
  const decorations = [];
  for (let level = bottomLevel; level <= topLevel; level++) {
    if (level % 3 !== 1) continue;
    const sprite = Math.floor(noise(level, seed + 31) * 14);
    // Atlas slots 12/13 belong to reward chests, never decorative scenery.
    const slot = sprite >= 12 ? sprite + 2 : sprite;
    const size = [4, 7, 14].includes(slot) ? 96 : 80;
    const y = 38 + noise(level, seed + 37) * 24;
    const candidates = noise(level, seed + 41) > .5 ? [54, 346, 136, 264, 200] : [346, 54, 264, 136, 200];
    const reserved = reservedBoxes(level, seed);
    for (const x of candidates) {
      const box = rectangle(x, y - size * .55, size, size * 1.1);
      if (reserved.some(other => mapBoxesOverlap(box, other)) || crossesPath(box, level, seed)) continue;
      const localY = (topLevel - level) * MAP_LEVEL_STEP + 64 + y;
      if (localY - size / 2 < 0 || localY + size / 2 > (topLevel - bottomLevel + 1) * MAP_LEVEL_STEP + 60) break;
      decorations.push({ id: level, slot, x, y: localY, size });
      break;
    }
  }
  return decorations;
}
