import { GAME_MODES } from "./gameCatalog.js";

export const CHAPTER_SIZE = 100;
export const MAX_ADVENTURE_CHAPTER = Math.floor(Number.MAX_SAFE_INTEGER / CHAPTER_SIZE);
export const MAX_ADVENTURE_LEVEL = MAX_ADVENTURE_CHAPTER * CHAPTER_SIZE;
export const CHEST_INTERVAL = 10;
export const NORMAL_MODE_IDS = Object.freeze(
  GAME_MODES.filter(({ id }) => id !== "challenge" && id !== "endless").map(({ id }) => id),
);
const normalModes = new Set(NORMAL_MODE_IDS);

export function isNormalAdventureMode(mode) { return normalModes.has(mode); }

export function getChapterNumber(level) {
  assertPositiveInteger(level, "level");
  if (level > MAX_ADVENTURE_LEVEL) throw new RangeError("Level exceeds the supported chapter range.");
  return Math.floor((level - 1) / CHAPTER_SIZE) + 1;
}

export function isCompletedLevelResult(result) {
  return isRecord(result) && result.cleared !== false
    && Number.isSafeInteger(result.score) && result.score >= 0
    && Number.isInteger(result.stars) && result.stars >= 0 && result.stars <= 3;
}

/** Completion is explicit for new entries; legacy best entries were only recorded on wins. */
export function isAdventureLevelCleared(bestByLevel, level) {
  assertPositiveInteger(level, "level");
  return NORMAL_MODE_IDS.some(mode => isCompletedLevelResult(bestByLevel?.[`${mode}:${level}`]));
}

/** Sparse input: never walk every integer up to the highest historical level. */
export function getAdventureSummary(bestByLevel = {}, firstIncompleteChapter = 1) {
  assertPositiveInteger(firstIncompleteChapter, "firstIncompleteChapter");
  if (firstIncompleteChapter > MAX_ADVENTURE_CHAPTER) throw new RangeError("Chapter exceeds the supported range.");
  const chapters = new Map();
  for (const [key, result] of Object.entries(isRecord(bestByLevel) ? bestByLevel : {})) {
    if (!isCompletedLevelResult(result)) continue;
    const parsed = parseNormalLevelKey(key);
    if (!parsed) continue;
    const chapter = getChapterNumber(parsed.level);
    let completed = chapters.get(chapter);
    if (!completed) { completed = new Set(); chapters.set(chapter, completed); }
    completed.add(parsed.level);
  }
  let currentChapter = firstIncompleteChapter;
  while (chapters.get(currentChapter)?.size === CHAPTER_SIZE) currentChapter += 1;
  if (currentChapter > MAX_ADVENTURE_CHAPTER) throw new RangeError("Chapter range exhausted.");
  const firstLevel = (currentChapter - 1) * CHAPTER_SIZE + 1;
  const lastLevel = firstLevel + CHAPTER_SIZE - 1;
  const completed = chapters.get(currentChapter) || new Set();
  let highestCleared = firstLevel - 1;
  for (const level of completed) highestCleared = Math.max(highestCleared, level);
  return {
    currentChapter, firstLevel, lastLevel,
    completedCount: completed.size,
    unlockedThrough: Math.min(lastLevel, Math.max(firstLevel + 2, highestCleared + 3)),
  };
}

export function getChapterProgress(bestByLevel, chapter, summary = getAdventureSummary(bestByLevel)) {
  assertPositiveInteger(chapter, "chapter");
  const firstLevel = (chapter - 1) * CHAPTER_SIZE + 1;
  const lastLevel = firstLevel + CHAPTER_SIZE - 1;
  assertPositiveInteger(lastLevel, "lastLevel");
  let completedCount = 0;
  for (let level = firstLevel; level <= lastLevel; level += 1) {
    if (isAdventureLevelCleared(bestByLevel, level)) completedCount += 1;
  }
  return {
    chapter, firstLevel, lastLevel, completedCount,
    complete: completedCount === CHAPTER_SIZE,
    available: chapter <= summary.currentChapter,
    unlockedThrough: chapter < summary.currentChapter ? lastLevel
      : chapter === summary.currentChapter ? summary.unlockedThrough : firstLevel - 1,
  };
}

export function getAdventureLevelState(bestByLevel, mode, level, summary = getAdventureSummary(bestByLevel)) {
  if (!normalModes.has(mode)) throw new RangeError("Adventure maps require a normal mode.");
  const chapter = getChapterNumber(level);
  const result = bestByLevel?.[`${mode}:${level}`];
  const modeCleared = isCompletedLevelResult(result);
  return {
    level, chapter,
    locked: chapter > summary.currentChapter || (chapter === summary.currentChapter && level > summary.unlockedThrough),
    cleared: isAdventureLevelCleared(bestByLevel, level),
    modeCleared,
    stars: modeCleared ? result.stars : 0,
    score: modeCleared ? result.score : 0,
    durationMs: modeCleared && Number.isSafeInteger(result.durationMs) && result.durationMs > 0
      ? result.durationMs : null,
  };
}

export function getAdventureChestState(bestByLevel, chestNumber, claimedChests = {}) {
  assertPositiveInteger(chestNumber, "chestNumber");
  const lastLevel = chestNumber * CHEST_INTERVAL;
  assertPositiveInteger(lastLevel, "lastLevel");
  const firstLevel = lastLevel - CHEST_INTERVAL + 1;
  let completedCount = 0;
  for (let level = firstLevel; level <= lastLevel; level += 1) {
    if (isAdventureLevelCleared(bestByLevel, level)) completedCount += 1;
  }
  const claimed = isRecord(claimedChests) && Object.hasOwn(claimedChests, String(chestNumber));
  return { chestNumber, firstLevel, lastLevel, completedCount, claimed, eligible: completedCount === CHEST_INTERVAL && !claimed };
}

/** One chapter is exactly 100 playable nodes + 10 independent chest milestones. */
export function createAdventureChapterNodes(bestByLevel, mode, chapter, claimedChests = {}, summary = getAdventureSummary(bestByLevel)) {
  const progress = getChapterProgress(bestByLevel, chapter, summary);
  const nodes = [];
  for (let level = progress.firstLevel; level <= progress.lastLevel; level += 1) {
    nodes.push({ kind: "level", ...getAdventureLevelState(bestByLevel, mode, level, summary) });
    if (level % CHEST_INTERVAL === 0) {
      nodes.push({ kind: "chest", ...getAdventureChestState(bestByLevel, level / CHEST_INTERVAL, claimedChests) });
    }
  }
  return nodes;
}

export function getSuggestedAdventureLevel(bestByLevel, summary = getAdventureSummary(bestByLevel)) {
  assertPositiveInteger(summary.firstLevel, "firstLevel");
  assertPositiveInteger(summary.unlockedThrough, "unlockedThrough");
  if (summary.unlockedThrough > MAX_ADVENTURE_LEVEL || summary.unlockedThrough < summary.firstLevel
    || summary.unlockedThrough - summary.firstLevel >= CHAPTER_SIZE) throw new RangeError("Invalid adventure frontier.");
  for (let level = summary.firstLevel; level <= summary.unlockedThrough; level += 1) {
    if (!isAdventureLevelCleared(bestByLevel, level)) return level;
  }
  return summary.unlockedThrough;
}

function parseNormalLevelKey(key) {
  const match = /^(easy|normal|hard|superHard):([1-9]\d*)$/.exec(key);
  if (!match) return null;
  const level = Number(match[2]);
  return Number.isSafeInteger(level) && level <= MAX_ADVENTURE_LEVEL ? { mode: match[1], level } : null;
}

function assertPositiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`${name} must be a positive safe integer.`);
}
function isRecord(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
