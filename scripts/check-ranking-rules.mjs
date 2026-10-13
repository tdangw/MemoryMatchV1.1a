import assert from "node:assert/strict";
import { createRankedRun, reduceRankedRun, compareRankingResults, supportsRunRanking } from "../js/rankingRules.js";
let run = createRankedRun("triple-connect", "endless", 1, { id: "fixture" });
for (let level = 1; level < 10; level++) {
  run = reduceRankedRun(run, { type: "win", score: 100 });
  run = reduceRankedRun(run, { type: "advance", level: level + 1 });
}
run = reduceRankedRun(run, { type: "win", score: 999 });
run = reduceRankedRun(run, { type: "restart" });
assert.equal(run.previousScore, 900);
assert.equal(run.attemptScore, 0, "Restart replaces the current attempt; never adds its previous win twice.");
assert.equal(run.rankable, true);
for (let level = 10; level < 15; level++) {
  run = reduceRankedRun(run, { type: "win", score: 100 });
  run = reduceRankedRun(run, { type: "advance", level: level + 1 });
}
run = reduceRankedRun(run, { type: "score", score: 50 });
run = reduceRankedRun(run, { type: "finalize" });
assert.equal(run.level, 15);
assert.equal(run.previousScore + run.attemptScore, 1450);
assert.equal(reduceRankedRun(run, { type: "restart" }), run, "Finalized runs are immutable.");
assert.equal(createRankedRun("triple-connect", "challenge", 7, { id: "replay" }).rankable, false);
assert.equal(supportsRunRanking("memory-match", "endless"), true);
assert.equal(supportsRunRanking("link-connect", "endless"), true);
assert.ok(compareRankingResults({ durationMs: 1000 }, { durationMs: 1100 }) < 0);
assert.ok(compareRankingResults({ levelReached: 20, totalScore: 1 }, { levelReached: 19, totalScore: 100000 }, "run") < 0);
assert.ok(compareRankingResults({ levelReached: 20, totalScore: 100 }, { levelReached: 20, totalScore: 99 }, "run") < 0);
console.log("Ranking comparator, restart replacement, level-15 final score and finalized run checks passed.");
