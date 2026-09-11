import assert from "node:assert/strict";
import { GAME_SHELL_DEFAULTS as defaults, normalizeGameShellConfig as normalize, getGameShellCssVariables } from "../js/gameShell/gameShellConfig.js";

assert.deepEqual(normalize(), defaults);
const custom = normalize({ layout: { gap: 0, contentMaxWidth: 640 }, motion: { star: 0 } });
assert.equal(custom.layout.gap, 0);
assert.equal(custom.layout.contentMaxWidth, 640);
assert.equal(custom.hud.minHeight, defaults.hud.minHeight);
assert.equal(defaults.layout.contentMaxWidth, 700);
assert.ok(Object.isFrozen(custom.layout));
assert.throws(() => { custom.layout.gap = 99; }, TypeError);
for (const bad of [null, [], true, 0, "config"]) assert.throws(() => normalize(bad), TypeError);
for (const bad of [-1, NaN, Infinity, "10", null, {}, []]) {
  assert.throws(() => normalize({ layout: { gap: bad } }), /layout.gap/);
}
for (const bad of [{ unknown: {} }, { layout: { rows: 2 } }, { layout: [] }, { layout: null }, JSON.parse('{"__proto__":{"polluted":1}}'), JSON.parse('{"hud":{"constructor":2}}')]) {
  assert.throws(() => normalize(bad), TypeError);
}
assert.equal({}.polluted, undefined);
assert.throws(() => normalize({ layers: { hud: 1.5 } }), /layers.hud/);
assert.throws(() => normalize({ layout: { contentMaxWidth: 0 } }), /contentMaxWidth/);
assert.throws(() => normalize({ breakpoints: { mobile: 300, narrow: 400 } }), /breakpoints.narrow/);
const warnings = [];
const production = { development: false, warn: text => warnings.push(text) };
const first = normalize({ layout: { gap: -1, contentMaxWidth: 640 }, unexpected: {} }, production);
normalize({ layout: { gap: NaN }, unexpected: {} }, production);
assert.equal(warnings.length, 2);
assert.equal(first.layout.gap, defaults.layout.gap);
assert.equal(first.layout.contentMaxWidth, 640);
assert.deepEqual(normalize(null, production), defaults);
assert.deepEqual(normalize({ breakpoints: { mobile: 300 } }, production).breakpoints, { mobile: 300, narrow: 300, landscapeHeight: 600 });
const css = getGameShellCssVariables({ motion: { star: 0 }, layers: { hud: 7 } });
assert.equal(css["--shell-motion-star"], "0ms");
assert.equal(css["--shell-layers-hud"], "7");
assert.equal(css["--shell-layout-content-max-width"], "700px");
assert.equal(css["--shell-layout-compact-landscape-max-rows"], "6");
assert.equal(css["--shell-hud-compact-landscape-width-ratio"], "0.9");
console.log("Game Shell defaults, overrides, validation and production fallback passed.");
