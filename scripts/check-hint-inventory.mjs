import assert from "node:assert/strict";
import { gameState, hydrateGameState, resetGame } from "../js/gameState.js";

hydrateGameState({ progress: { memoryMatch: { items: { hint: 3 } } } });
assert.equal(gameState.progress.memoryMatch.items.hint, 3);
gameState.progress.memoryMatch.items.hint = 9;
resetGame();
assert.equal(gameState.progress.memoryMatch.items.hint, 9, "A new round retains the current inventory.");
hydrateGameState({ progress: { memoryMatch: { items: { hint: 2 }, sessionsByMode: { invalid: { mode: "invalid" } } } } });
assert.equal(gameState.progress.memoryMatch.items.hint, 2, "Invalid sessions cannot alter the current inventory.");
assert.deepEqual(gameState.progress.memoryMatch.sessionsByMode, {});
hydrateGameState({ progress: { memoryMatch: { sessionsByMode: { easy: { mode: "easy", hints: 90 } } } } });
assert.equal(gameState.progress.memoryMatch.items.hint, 0, "A partial current payload is normalized without migration.");
console.log("Hint inventory current-contract checks passed.");
