import assert from "node:assert/strict";
import {
  equipTheme,
  getEquippedThemeId,
  getOwnedThemeIds,
  normalizeAppearance,
  ownTheme,
} from "../js/appearance.js";

const migrated = normalizeAppearance({
  theme: "animals-land",
  ownedThemes: ["default", "animals-land"],
});
assert.equal(getEquippedThemeId(migrated, "memory-match"), "animals-land");
assert.equal(getEquippedThemeId(migrated, "link-connect"), "default");
assert.equal(equipTheme(migrated, "link-connect", "animals-land"), true);
assert.equal(getEquippedThemeId(migrated, "memory-match"), "animals-land");
assert.equal(getEquippedThemeId(migrated, "link-connect"), "animals-land");
assert.equal(ownTheme(migrated, "link-connect", "animals-land"), false);

const splitOwnership = normalizeAppearance({
  ownedThemesByGame: {
    memoryMatch: ["default", "animals-land"],
    linkConnect: ["default", "drinks"],
  },
});
assert.deepEqual(getOwnedThemeIds(splitOwnership).sort(), ["animals-land", "default", "drinks"]);

console.log("Appearance theme checks passed.");
