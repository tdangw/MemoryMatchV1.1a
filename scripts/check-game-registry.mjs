import assert from "node:assert/strict";
import { getGameNavigation, getReleasedGames, isKnownGame } from "../js/gameRegistry.js";

assert.deepEqual(getReleasedGames().map(game => game.id), ["memory-match", "link-connect", "triple-connect"]);
assert.equal(getGameNavigation("triple-connect"), null, "Navigation is registered by the application bootstrap.");
assert.equal(getGameNavigation("unknown-game"), null);
assert.equal(isKnownGame("triple-connect"), true);
assert.equal(isKnownGame("unknown-game"), false);
console.log("Game registry release and unknown-ID contracts passed.");
