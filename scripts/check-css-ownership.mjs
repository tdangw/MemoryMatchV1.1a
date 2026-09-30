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

const hudPaths = ["styles/game-shell/hud-unified.css", "styles/hud.css", "styles/link-connect.css", "styles/triple-connect.css"];
const hudSources = await Promise.all(hudPaths.map(readCss));
const unifiedPath = hudPaths[0];

// Inspect leaf rules (also inside media queries), not load order or exact
// selector strings. Aliases and more specific selectors still share an owner.
function assertHudOwnership(sources) {
  for (const [path, css] of sources) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, selector, body] of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const declarations = [...body.matchAll(/([\w-]+)\s*:\s*([^;]+)(?:;|$)/g)];
      // Split groups without splitting :is()/:where() arguments. A state
      // selector in one group cannot grant ownership to another base selector.
      const selectors = [];
      let depth = 0;
      let start = 0;
      for (let index = 0; index < selector.length; index++) {
        if ("([".includes(selector[index])) depth++;
        else if (")]".includes(selector[index])) depth--;
        else if (selector[index] === "," && depth === 0) { selectors.push(selector.slice(start, index).trim()); start = index + 1; }
      }
      selectors.push(selector.slice(start).trim());
      for (const entry of selectors) {
        const hudBase = /#game-title|\.(?:(?:link|triple)-)?game-hud\b|\.game-hud__|\.game-stats\b|\.game-menu-toggle\b|\.game-actions-menu\b|\.(?:memory|link|triple)-tools-(?:toggle|menu)\b/.test(entry);
        const gameState = /\.is-previewing|\.is-time-frozen/.test(entry);
        if (path !== unifiedPath && hudBase && !gameState) {
          assert.equal(declarations.length, 0, `${path}: shared HUD base ${entry} belongs to ${unifiedPath}`);
        }
        if (path !== unifiedPath && /^(?:\.memory-special-hud|\.link-special-hud|\.triple-connect-game > \.triple-connect__milestones)$/.test(entry)) {
          for (const [, property] of declarations) assert(!/^margin(?:-|$)/.test(property), `${path}: milestone spacing belongs to ${unifiedPath}`);
        }
      }
      if (path !== unifiedPath) for (const [, property] of declarations) {
        assert(!property.startsWith("--unified-hud-"), `${path}: shared HUD token ${property} has multiple owners`);
      }
    }
  }
}
const hudEntries = hudPaths.map((path, index) => [path, hudSources[index]]);
assertHudOwnership(hudEntries);
assert.doesNotMatch(legacy, /#game-title(?:\s+span)?\s*[,\{]/, "legacy ID rules must not override shared HUD geometry/typography");
assert.doesNotMatch(modals, /\.game-stats\s+\.info\s*[,\{]/, "modal stylesheet must not own HUD cell display");
// Negative fixtures verify base aliases, shorthand properties and responsive
// rules cannot silently become a second owner.
for (const fixture of [".link-game-hud .stat-card { padding: 8px; }", "@media (width < 600px) { .game-menu-toggle { width: 30px; } }", ":root { --unified-hud-label: red; }", ".link-game-hud .stat-card, .link-game-hud .stat-timer.is-time-frozen { padding: 8px; }"]) {
  assert.throws(() => assertHudOwnership([...hudEntries, ["fixture.css", fixture]]), /owner|belongs/, `HUD ownership guard missed ${fixture}`);
}
assert.match(hudSources[0], /--unified-hud-milestone-margin:\s*[^;]+;/);
assert.match(hudSources[0], /\[data-shell-region="milestones"\]\s*\{\s*margin:\s*var\(--unified-hud-milestone-margin\)/);

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
