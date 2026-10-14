import assert from 'node:assert/strict';
import { getChallengeLayout } from '../js/config.js';
import { getLinkChallengeLayout } from '../js/linkConnect/linkConfig.js';
import { TRIPLE_CHALLENGE_STAGES } from '../js/tripleConnect/tripleConfig.js';
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
