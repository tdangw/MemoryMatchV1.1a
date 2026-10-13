import assert from "node:assert/strict";
import {
  createAdventureChapterNodes, getAdventureSummary, getAdventureLevelState,
  getAdventureChestState, getChapterProgress, getSuggestedAdventureLevel,
  isAdventureLevelCleared, isCompletedLevelResult, MAX_ADVENTURE_CHAPTER, MAX_ADVENTURE_LEVEL, getChapterNumber,
} from "../js/adventureProgress.js";

const won = (stars = 0) => ({ score: 0, stars, cleared: true });
const results = {};
assert.deepEqual(getAdventureSummary(results), {
  currentChapter: 1, firstLevel: 1, lastLevel: 100, completedCount: 0, unlockedThrough: 1,
});
assert.equal(getAdventureLevelState(results, "easy", 1).locked, false);
assert.equal(getAdventureLevelState(results, "easy", 4).locked, true);
results["easy:3"] = won();
assert.equal(getAdventureSummary(results).unlockedThrough, 1, "Historical wins preserve results but do not skip missing earlier levels.");
assert.equal(getAdventureSummary(results).completedCount, 1);
assert.equal(getSuggestedAdventureLevel(results), 1);
assert.equal(getAdventureLevelState(results, "superHard", 6).locked, true);
assert.equal(getAdventureLevelState(results, "superHard", 3).stars, 0);
assert.equal(getAdventureLevelState(results, "superHard", 3).cleared, true);
results["normal:3"] = won(3);
assert.equal(getAdventureSummary(results).completedCount, 1, "Different modes never count the same level twice.");
results["challenge:50"] = won(3);
results["endless:500"] = won(3);
results["easy:4"] = { score: 0, stars: 0, cleared: false };
results["easy:5"] = { score: -1, stars: 3, cleared: true };
assert.equal(getAdventureSummary(results).unlockedThrough, 1);
assert.equal(isAdventureLevelCleared(results, 4), false);
assert.equal(isCompletedLevelResult({ score: 0, stars: 0 }), true, "Legacy best records are wins even with zero stars.");
assert.equal(isCompletedLevelResult({ score: "0", stars: 0 }), false);
assert.equal(isCompletedLevelResult({ score: 0, stars: 4 }), false);

const holes = { "easy:100": won(3), "hard:1000000": won(3) };
assert.equal(getAdventureSummary(holes).currentChapter, 1);
assert.equal(getAdventureSummary(holes).unlockedThrough, 1);
assert.equal(getAdventureLevelState(holes, "hard", 101).locked, true);
assert.equal(getChapterProgress(holes, 10000).available, false);
assert.equal(createAdventureChapterNodes(holes, "normal", 10000).length, 110, "Far-away levels must not materialize all previous chapters.");

const chapter = {};
for (let level = 1; level <= 99; level += 1) chapter[`${level % 2 ? "easy" : "hard"}:${level}`] = won(level % 4);
assert.equal(getChapterProgress(chapter, 1).complete, false);
assert.equal(getAdventureSummary(chapter).unlockedThrough, 100);
assert.equal(getAdventureChestState(chapter, 10).eligible, false);
chapter["normal:100"] = won();
assert.equal(getAdventureSummary(chapter).currentChapter, 2);
assert.equal(getAdventureSummary(chapter).unlockedThrough, 101);
assert.equal(getAdventureLevelState(chapter, "superHard", 100).locked, false);
assert.equal(getAdventureLevelState(chapter, "superHard", 101).locked, false);
assert.equal(getAdventureLevelState(chapter, "superHard", 104).locked, true);
assert.equal(getAdventureChestState(chapter, 10).eligible, true);
assert.equal(getAdventureChestState(chapter, 10, { "10": { coins: 100 } }).eligible, false);
assert.equal(getAdventureChestState(chapter, 11).completedCount, 0);
const nodes = createAdventureChapterNodes(chapter, "easy", 1);
assert.equal(nodes.filter(node => node.kind === "level").length, 100);
assert.equal(nodes.filter(node => node.kind === "chest").length, 10);
assert.equal(nodes[10].chestNumber, 1);
assert.equal(nodes[109].chestNumber, 10);
assert.equal(getSuggestedAdventureLevel(chapter), 101);

assert.throws(() => getAdventureLevelState({}, "challenge", 1), RangeError);
assert.throws(() => getChapterProgress({}, 0), RangeError);
assert.throws(() => getChapterProgress({}, Number.MAX_SAFE_INTEGER), RangeError);
assert.throws(() => getAdventureChestState({}, -1), RangeError);
assert.throws(() => getAdventureChestState({}, Number.MAX_SAFE_INTEGER), RangeError);
assert.throws(() => getChapterNumber(Number.MAX_SAFE_INTEGER), RangeError);
assert.throws(() => getAdventureSummary({}, MAX_ADVENTURE_CHAPTER + 1), RangeError);
assert.throws(() => getSuggestedAdventureLevel({}, { firstLevel: 1, unlockedThrough: MAX_ADVENTURE_LEVEL }), RangeError);
assert.equal(createAdventureChapterNodes({}, 'easy', MAX_ADVENTURE_CHAPTER).length, 110);
console.log("Adventure sequential unlock, shared completion, chapter boundary, chest eligibility and sparse-history checks passed.");
