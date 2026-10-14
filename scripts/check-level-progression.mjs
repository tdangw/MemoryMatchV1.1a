import assert from 'node:assert/strict';
import { getChallengeLayout } from '../js/config.js';
import { getLinkChallengeLayout, getLinkChallengeTime } from '../js/linkConnect/linkConfig.js';
import { TRIPLE_CHALLENGE_STAGES, getTripleChallengeStage } from '../js/tripleConnect/tripleConfig.js';
import { resolveSessionTiming } from '../js/sessionTiming.js';
import { generateChallengeTripleBoard, replayTripleWitness } from '../js/tripleConnect/tripleBoard.js';
import { getAdventureSummary, getAdventureLevelState } from '../js/adventureProgress.js';
const wins = { 'easy:1': { score: 100, stars: 1, cleared: true } };
const summary = getAdventureSummary(wins);
assert.equal(summary.unlockedThrough, 2);
assert.equal(getAdventureLevelState(wins, 'hard', 2, summary).locked, false);
assert.equal(getAdventureLevelState(wins, 'hard', 1, summary).modeCleared, false);
for (const level of [1, 7, 8, 19, 20, 100, 100000, 100001, 1000000]) {
  assert(getChallengeLayout(level).tileCount <= 60);
  assert(getLinkChallengeLayout(level).tileCount <= 60);
}
for (const stage of TRIPLE_CHALLENGE_STAGES) {
  assert(stage.tileCount <= 93); assert(stage.layerCount <= 5);
  assert(stage.solverBudget.maxNodes <= 150000); assert(stage.solverBudget.deadlineMs <= 400);
  const generated = generateChallengeTripleBoard({ level: stage.level, seed: `level-baseline-${stage.level}` });
  assert.equal(replayTripleWitness(generated.board, generated.witness).ok, true);
}
console.log('Level progression: shared difficulty unlock, bounded pair layouts and Triple intro witnesses passed.');
const durations = [];
for (const level of [8, 9, 19, 20, 99, 100, 101, 999, 1000, 99999, 100000, 100001, 1000000, 9007199254740900]) {
  assert(getLinkChallengeTime(level) <= 150);
  const stage = getTripleChallengeStage(level); assert.equal(stage.level, level); assert(stage.tileCount <= 93);
  for (const variant of ['a', 'b']) {
    const start = performance.now();
    const generated = generateChallengeTripleBoard({ level, seed: `high-${level}-${variant}` });
    durations.push(performance.now() - start);
    assert.equal(replayTripleWitness(generated.board, generated.witness).ok, true);
    assert(generated.board.tiles.length <= 93);
  }
}
assert.equal(resolveSessionTiming({ reason: 'advance', carryOnAdvance: true, currentRemaining: 175, advanceBonus: 10, maxCarryBonusTime: 180 }).remainingTime, 180);
assert.equal(resolveSessionTiming({ reason: 'advance', carryOnAdvance: true, currentRemaining: 240, advanceBonus: 10, maxCarryBonusTime: 180 }).remainingTime, 240, 'Purchased time is not discarded by a bonus cap.');
assert.throws(() => getTripleChallengeStage(Number.MAX_SAFE_INTEGER), RangeError);
console.log(`High-level witnesses passed; max generation ${Math.max(...durations).toFixed(2)}ms across ${durations.length} cases (desktop Node, not phone FPS).`);
