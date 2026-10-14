const integers = ['score', 'moves', 'misses', 'combo', 'matchedPairs', 'totalPairs'];
const validReward = reward => reward && ['coins', 'time', 'hints'].includes(reward.type) && Number.isSafeInteger(reward.value) && reward.value > 0;
export function remainingComboWindow(snapshot, windowMs) {
  if (!snapshot || !Number.isFinite(snapshot.capturedAt) || !Number.isFinite(snapshot.comboRemainingMs)) return 0;
  return Math.max(0, Math.min(windowMs, snapshot.comboRemainingMs) - Math.max(0, Date.now() - snapshot.capturedAt));
}
export function normalizePairSnapshot(value, gameId) {
  if (!value || value.version !== 1 || value.gameId !== gameId || typeof value.seed !== 'string' || !value.seed
    || typeof value.themeId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value.themeId)
    || integers.some(key => !Number.isSafeInteger(value[key]) || value[key] < 0)
    || value.totalPairs < 1 || value.totalPairs > 60 || value.matchedPairs > value.totalPairs) return null;
  if (gameId === 'memory-match') {
    if (!Array.isArray(value.tiles) || value.tiles.length !== value.totalPairs * 2) return null;
    const pairs = new Map(); let matched = 0;
    for (const tile of value.tiles) {
      if (!tile || typeof tile.id !== 'string' || !tile.id || typeof tile.matched !== 'boolean' || typeof tile.special !== 'boolean') return null;
      const pair = pairs.get(tile.id) || { count: 0, matched: 0 }; pair.count++; if (tile.matched) { pair.matched++; matched++; } pairs.set(tile.id, pair);
    }
    if ([...pairs.values()].some(pair => pair.count !== 2 || pair.matched !== 0 && pair.matched !== 2) || matched !== value.matchedPairs * 2) return null;
    if (!Array.isArray(value.luckyRewards) || value.luckyRewards.length > value.totalPairs || value.luckyRewards.some(entry => !Array.isArray(entry) || entry.length !== 2 || !pairs.has(entry[0]) || !validReward(entry[1]))
      || !Array.isArray(value.luckyAwards) || value.luckyAwards.length > value.totalPairs || value.luckyAwards.some(reward => !validReward(reward))) return null;
  } else if (gameId === 'link-connect') {
    const board = value.board;
    if (!board || !Number.isInteger(board.columns) || !Number.isInteger(board.rows) || board.columns < 1 || board.rows < 1
      || board.capacity !== value.totalPairs * 2 || board.columns * board.rows !== board.capacity
      || !Array.isArray(board.grid) || board.grid.length !== board.rows + 2) return null;
    const ids = new Set(); const pairs = new Map(); let remaining = 0;
    for (let r = 0; r < board.grid.length; r++) {
      const row = board.grid[r]; if (!Array.isArray(row) || row.length !== board.columns + 2) return null;
      for (let c = 0; c < row.length; c++) {
        const tile = row[c]; if (!tile) continue;
        if (r === 0 || c === 0 || r === board.rows + 1 || c === board.columns + 1
          || typeof tile.id !== 'string' || typeof tile.instanceId !== 'string' || ids.has(tile.instanceId)
          || typeof tile.src !== 'string' || tile.src.length > 50000 || !/^(\/?(?:[\w.-]+\/)*assets\/|data:image\/(svg\+xml|png|webp|jpeg);)/.test(tile.src)) return null;
        ids.add(tile.instanceId); pairs.set(tile.id, (pairs.get(tile.id) || 0) + 1); remaining++;
      }
    }
    if ([...pairs.values()].some(count => count !== 2) || remaining !== (value.totalPairs - value.matchedPairs) * 2) return null;
    if (value.luckyAwards !== undefined && (!Array.isArray(value.luckyAwards) || value.luckyAwards.length > value.totalPairs || value.luckyAwards.some(reward => !validReward(reward)))) return null;
    if (value.freezeSeconds !== undefined && (!Number.isSafeInteger(value.freezeSeconds) || value.freezeSeconds < 0)) return null;
  } else return null;
  return structuredClone(value);
}
