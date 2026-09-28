import assert from "node:assert/strict";
import { gameState, hydrateGameState, resetGame } from "../js/gameState.js";

hydrateGameState({ progress: { memoryMatch: { items: { hint: 3 } } } });
assert.equal(gameState.hints, 3);
gameState.hints = 9;
resetGame();
assert.equal(gameState.hints, 9, "A new round retains the current inventory.");
hydrateGameState({ progress: { memoryMatch: { items: { hint: 2 }, activeSession: { mode: "easy", hints: 12 } } } });
assert.equal(gameState.hints, 2, "Legacy session hints cannot alter the current inventory.");
assert.deepEqual(gameState.progress.memoryMatch.sessionsByMode, {});
hydrateGameState({ progress: { memoryMatch: { sessionsByMode: { easy: { mode: "easy", hints: 90 } } } } });
assert.equal(gameState.hints, 0, "A partial current payload is normalized without migration.");
console.log("Hint inventory current-contract checks passed.");
