const MAX_HISTORY_BOARDS = 3;
const RANDOM_EPSILON = Number.MIN_VALUE;

/**
 * Picks distinct manifest assets without mutating the supplied pool or history.
 * Recent assets remain eligible, but receive a smaller exponential-race weight.
 */
export function selectThemeAssets({ assets, count, history = [], random = Math.random } = {}) {
  if (!Array.isArray(assets)) throw new TypeError("Theme assets must be an array.");
  if (!Number.isInteger(count) || count < 0) throw new TypeError("Theme asset count must be a non-negative integer.");
  const unique = uniqueAssets(assets);
  if (unique.length < count) {
    throw new RangeError(`Theme requires ${count} distinct assets but only has ${unique.length}.`);
  }
  if (count === 0) return [];
  const recentScores = buildRecentScores(history);
  const candidates = [];
  unique.forEach((asset, index) => {
    const weight = 1 / (1 + (recentScores.get(asset.path) || 0));
    const candidate = { asset, index, key: -Math.log(clampRandom(random())) / weight };
    if (candidates.length < count) {
      pushMaxHeap(candidates, candidate);
    } else if (isHigherPriority(candidate, candidates[0])) {
      candidates[0] = candidate;
      siftDownMaxHeap(candidates, 0);
    }
  });
  return candidates
    .sort(comparePriority)
    .map(({ asset }) => asset);
}

export function normalizeThemeSelectionHistory(value, manifest) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([themeId, boards]) => {
    const allowed = new Set((manifest?.[themeId] || []).map((asset) => asset.path));
    if (!allowed.size || !Array.isArray(boards)) return [];
    const normalizedBoards = boards.slice(0, MAX_HISTORY_BOARDS).flatMap((board) => {
      if (!Array.isArray(board)) return [];
      const ids = [...new Set(board.filter((id) => typeof id === "string" && allowed.has(id)))];
      return ids.length ? [ids] : [];
    });
    return normalizedBoards.length ? [[themeId, normalizedBoards]] : [];
  }));
}

export function appendThemeSelectionHistory(history, themeId, assets) {
  const assetIds = [...new Set((assets || []).map((asset) => typeof asset === "string" ? asset : asset?.path)
    .filter((id) => typeof id === "string" && id))];
  if (!themeId || !assetIds.length) return history || {};
  return {
    ...(history || {}),
    [themeId]: [assetIds, ...((history || {})[themeId] || [])].slice(0, MAX_HISTORY_BOARDS),
  };
}

function uniqueAssets(assets) {
  const seen = new Set();
  return assets.filter((asset) => {
    if (!asset || typeof asset.path !== "string" || !asset.path || seen.has(asset.path)) return false;
    seen.add(asset.path);
    return true;
  });
}

function buildRecentScores(history) {
  const scores = new Map();
  if (!Array.isArray(history)) return scores;
  history.slice(0, MAX_HISTORY_BOARDS).forEach((board, index) => {
    if (!Array.isArray(board)) return;
    const score = MAX_HISTORY_BOARDS - index;
    new Set(board).forEach((id) => scores.set(id, (scores.get(id) || 0) + score));
  });
  return scores;
}

function clampRandom(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  return Math.min(1 - Number.EPSILON, Math.max(RANDOM_EPSILON, number));
}

function comparePriority(left, right) {
  return left.key - right.key || left.index - right.index;
}

function isHigherPriority(left, right) {
  return comparePriority(left, right) < 0;
}

function isLowerPriority(left, right) {
  return comparePriority(left, right) > 0;
}

function pushMaxHeap(heap, candidate) {
  heap.push(candidate);
  let index = heap.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (!isLowerPriority(heap[index], heap[parent])) break;
    [heap[index], heap[parent]] = [heap[parent], heap[index]];
    index = parent;
  }
}

function siftDownMaxHeap(heap, index) {
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    let largest = index;
    if (left < heap.length && isLowerPriority(heap[left], heap[largest])) largest = left;
    if (right < heap.length && isLowerPriority(heap[right], heap[largest])) largest = right;
    if (largest === index) return;
    [heap[index], heap[largest]] = [heap[largest], heap[index]];
    index = largest;
  }
}
