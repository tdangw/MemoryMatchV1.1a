import assert from "node:assert/strict";
import { THEME_ASSET_MANIFEST } from "../js/generated/themeAssetManifest.js";
import {
  appendThemeSelectionHistory,
  normalizeThemeSelectionHistory,
  selectThemeAssets,
} from "../js/themeSelection.js";
import { getThemeCards, getThemeSelectionAssets, getThemeSelectionEligibility } from "../js/themeCatalog.js";

const assets = Object.freeze(Array.from({ length: 8 }, (_, index) => ({ path: `nested/${index}.webp` })));
const sequence = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
let cursor = 0;
const selected = selectThemeAssets({
  assets,
  count: 4,
  history: [["nested/0.webp"], ["nested/1.webp"], ["nested/2.webp"]],
  random: () => sequence[cursor++],
});
assert.equal(selected.length, 4);
assert.equal(new Set(selected.map((asset) => asset.path)).size, 4);
assert.deepEqual(selectThemeAssets({ assets, count: 0 }), []);
cursor = 0;
const expected = assets.map((asset, index) => {
  const score = index < 3 ? 3 - index : 0;
  return { asset, index, key: -Math.log(Math.max(Number.MIN_VALUE, Math.min(1 - Number.EPSILON, sequence[cursor++]))) * (1 + score) };
}).sort((left, right) => left.key - right.key || left.index - right.index).slice(0, 4).map(({ asset }) => asset.path);
assert.deepEqual(selected.map((asset) => asset.path), expected, "Bounded heap must preserve the weighted-sampling result.");
assert.throws(() => selectThemeAssets({ assets, count: 9 }), /requires 9 distinct assets/);
assert.doesNotThrow(() => selectThemeAssets({ assets, count: 1, random: () => 0 }));

const weightedAssets = Object.freeze([{ path: "recent.webp" }, { path: "fresh.webp" }]);
let recentWins = 0;
for (let index = 1; index <= 200; index += 1) {
  let state = index;
  const random = () => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 4294967296);
  if (selectThemeAssets({ assets: weightedAssets, count: 1, history: [["recent.webp"]], random })[0].path === "recent.webp") recentWins += 1;
}
assert.ok(recentWins > 0 && recentWins < 80, "Recent assets must remain possible but be materially less likely.");

const normalized = normalizeThemeSelectionHistory({
  default: [["missing.webp", "nested/0.webp", "nested/0.webp"], "bad", ["nested/1.webp"]],
}, { default: assets });
assert.deepEqual(normalized, { default: [["nested/0.webp"], ["nested/1.webp"]] });
assert.deepEqual(
  appendThemeSelectionHistory({ default: [["a"], ["b"], ["c"]] }, "default", ["d", "d"]),
  { default: [["d"], ["a"], ["b"]] },
);

const recursiveAsset = Object.values(THEME_ASSET_MANIFEST).flat().find((asset) => asset.path.includes("/"));
assert.ok(recursiveAsset, "Generated manifest must retain nested asset paths.");
const specialAsset = Object.values(THEME_ASSET_MANIFEST).flat().find((asset) => asset.path.split("/").includes("special"));
assert.ok(specialAsset?.special, "Assets under special/ must remain flagged special.");

assert.equal(getThemeSelectionEligibility("default", 1).ok, true);
const insufficient = getThemeSelectionEligibility("default", 99999);
assert.equal(insufficient.ok, false);
assert.equal(insufficient.required, 99999);

const generatedPool = getThemeSelectionAssets("alphabet");
const generatedIds = selectThemeAssets({ assets: generatedPool, count: 4, random: () => .4 }).map(({ path }) => path);
assert.equal(new Set(generatedIds).size, 4, "Generated selections must be genuinely distinct.");
assert.ok(generatedIds.every((id) => id.startsWith("generated:alphabet:")));
const restoredGenerated = getThemeCards("alphabet", 4, { assetPaths: generatedIds });
assert.deepEqual(restoredGenerated.map(({ assetPath }) => assetPath), generatedIds);
assert.ok(restoredGenerated.every(({ src }) => src.startsWith("data:image/svg+xml")));

console.log("Shared theme selection checks passed.");
