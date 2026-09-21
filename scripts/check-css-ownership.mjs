import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const readCss = (path) => readFile(new URL(path, root), "utf8");
const [legacy, board, gameplay, modals, shop] = await Promise.all([
  readCss("style.css"),
  readCss("styles/board.css"),
  readCss("styles/gameplay-ui.css"),
  readCss("styles/modals.css"),
  readCss("styles/shop.css"),
]);

function keyframes(css) {
  return [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(([, name]) => name);
}

const all = [legacy, board, gameplay, modals, shop].flatMap(keyframes);
for (const ambiguous of ["pop", "shimmer", "slideUp", "fadein"]) {
  assert(!all.includes(ambiguous), `ambiguous global keyframe remains: ${ambiguous}`);
}

assert(keyframes(gameplay).includes("app-fade-in"), "gameplay UI must own its fade primitive");
assert(keyframes(gameplay).includes("app-loading-shimmer"), "gameplay UI must own loading shimmer");
assert(keyframes(gameplay).includes("app-level-intro-enter"), "level reward needs its own intro keyframe");
assert(keyframes(gameplay).includes("app-dialog-pop-enter"), "dialog reward needs its own pop keyframe");
assert(keyframes(board).includes("memory-lucky-shimmer"), "Memory board must namespace its shimmer");
assert(keyframes(board).includes("memory-card-enter-up"), "Memory board must namespace card entrance");

assert(!legacy.includes(".bonus-overlay"), "legacy stylesheet must not own bonus overlay");
assert(!gameplay.includes(".bonus-overlay"), "gameplay backdrop needs an explicit selector");
assert(gameplay.includes(".gameplay-bonus-backdrop"), "gameplay backdrop owner missing");
for (const selector of [".shop-item-grid", ".shop-item {", ".shop-item-title {"]) {
  assert(!legacy.includes(selector), `legacy stylesheet must not own ${selector}`);
}
assert(!/\.shop-item\s*\{/.test(modals), "modal stylesheet must not own the shop item base rule");
assert(!/\.shop-item-title\s*\{/.test(modals), "modal stylesheet must not own the shop title base rule");
assert(shop.includes(".shop-item-grid"), "shop stylesheet must own shop grid");

console.log("CSS ownership and collision checks passed.");
