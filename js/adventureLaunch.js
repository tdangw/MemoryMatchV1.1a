import { gameState } from "./gameState.js";
import { getGameProgressKey } from "./gameCatalog.js";
import { getChapterNumber, getAdventureLevelState, getAdventureSummary, isNormalAdventureMode } from "./adventureProgress.js";
import { flushPersistentWrites, getPersistenceStatus, loadPersistentChapter } from "./persistence.js";

/** Load canonical historical bests before a replay can change totals. Resident cache stays bounded. */
export async function prepareAdventureChapter(gameId, chapter, isCurrent = () => true) {
  const key = getGameProgressKey(gameId);
  if (!key) throw new RangeError("Unknown adventure game.");
  await flushPersistentWrites();
  if (getPersistenceStatus().blocked) return false;
  const record = await loadPersistentChapter(key, chapter);
  if (!isCurrent()) return false;
  const profile = gameState.progress[key];
  const keep = new Set([chapter, profile.adventure?.currentChapter || 1]);
  for (const session of Object.values(profile.sessionsByMode || {})) {
    if (session?.level) keep.add(getChapterNumber(session.level));
  }
  for (const field of ["bestByLevel", "startedLevels"]) {
    const entries = Object.entries(profile[field] || {}).filter(([id]) => {
      const level = Number(id.split(":")[1]);
      return Number.isSafeInteger(level) && level > 0 && keep.has(getChapterNumber(level));
    });
    profile[field] = { ...Object.fromEntries(entries), ...record[field] };
  }
  profile.claimedChests = {
    ...Object.fromEntries(Object.entries(profile.claimedChests || {}).filter(([id]) => keep.has(Math.floor((Number(id) - 1) / 10) + 1))),
    ...record.claimedChests,
  };
  return true;
}

/** Staged with the first session commit, so menu re-entry cannot repeatedly grant start assists. */
export function stageAdventureLevelStart(gameId, mode, level) {
  const profile = gameState.progress[getGameProgressKey(gameId)];
  const identity = `${mode}:${level}`;
  profile.startedLevels ||= {};
  if (profile.startedLevels[identity]) return false;
  profile.startedLevels[identity] = true;
  return true;
}

export function canAdvanceAdventure(gameId, mode, targetLevel) {
  if (!isNormalAdventureMode(mode)) return true;
  const profile = gameState.progress[getGameProgressKey(gameId)];
  const summary = profile.adventure || getAdventureSummary(profile.bestByLevel);
  return !getAdventureLevelState(profile.bestByLevel, mode, targetLevel, summary).locked;
}
