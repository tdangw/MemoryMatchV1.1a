import assert from "node:assert/strict";
import {
  equipTheme,
  getEquippedThemeId,
  getOwnedThemeIds,
  normalizeAppearance,
  ownTheme,
} from "../js/appearance.js";

const migrated = normalizeAppearance({
  themes: { memoryMatch: "animals-land" },
  ownedThemes: ["default", "animals-land"],
});
assert.equal(getEquippedThemeId(migrated, "memory-match"), "animals-land");
assert.equal(getEquippedThemeId(migrated, "link-connect"), "default");
assert.equal(equipTheme(migrated, "link-connect", "animals-land"), true);
assert.equal(getEquippedThemeId(migrated, "memory-match"), "animals-land");
assert.equal(getEquippedThemeId(migrated, "link-connect"), "animals-land");
assert.equal(ownTheme(migrated, "link-connect", "animals-land"), false);

const currentOwnership = normalizeAppearance({ ownedThemes: ["default", "animals-land", "drinks"] });
assert.deepEqual(getOwnedThemeIds(currentOwnership).sort(), ["animals-land", "default", "drinks"]);

console.log("Appearance theme checks passed.");
