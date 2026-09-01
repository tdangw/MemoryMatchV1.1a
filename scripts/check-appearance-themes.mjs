import assert from "node:assert/strict";
import {
  equipTheme,
  getEquippedThemeId,
  normalizeAppearance,
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

console.log("Appearance theme checks passed.");
