import {
  LINK_EXIT_EFFECTS,
  LINK_PATH_EFFECTS,
  migrateLinkExitEffectId,
  migrateLinkPathEffectId,
} from "../linkConnect/linkEffects.js";

const PATH_FAMILIES = Object.freeze({
  default: "tracer", electric: "jagged", laser: "dual-stroke", fire: "sparks", magic: "symbols",
  cyber: "packets", rainbow: "gradient", hydro: "wave", plasma: "helix", holy: "motes",
  shadow: "ribbon", spiral: "helix", dashed: "dash", bullet: "projectile", kame: "charge",
  halo: "rings", matrix: "symbols", sonic: "wavelets", chains: "links", meteor: "sparks", poison: "droplets",
});
const EXIT_FAMILIES = Object.freeze({
  default: "waapi", dissolve: "mask", finedust: "particles", split4: "fragments", split2: "fragments",
  split8: "fragments", triangles: "fragments", crumble: "particles", gravity: "waapi", collide: "pair",
  portal: "portal", blackhole: "group", freeze: "shards", burn: "mask", pixel: "pixels", implode: "implode",
  slice: "fragments", bubble: "droplets", origami: "fold", "electric-shock": "shock", ghost: "ghost",
});

function makeEntry(effect, family, duration, qualityCost, supportsTargetCounts) {
  return Object.freeze({
    ...effect,
    family,
    duration,
    qualityCost,
    supportsTargetCounts: Object.freeze(supportsTargetCounts),
    reducedPreset: Object.freeze({ duration: 150, family: "reduced-fade" }),
  });
}

export const EFFECT_V2_PATHS = Object.freeze(LINK_PATH_EFFECTS.map(effect => makeEntry(
  effect, PATH_FAMILIES[effect.id], effect.id === "bullet" ? 180 : 260, effect.id === "meteor" ? 3 : 1, [2, 3],
)));
export const EFFECT_V2_EXITS = Object.freeze(LINK_EXIT_EFFECTS.map(effect => makeEntry(
  effect, EXIT_FAMILIES[effect.id], ["blackhole", "collide", "freeze", "pixel"].includes(effect.id) ? 320 : 260,
  ["blackhole", "collide", "freeze", "pixel", "split8"].includes(effect.id) ? 3 : 1,
  effect.id === "collide" ? [2] : [2, 3],
)));

function resolve(entries, id, migrate) {
  const migratedId = migrate(id);
  return entries.find(entry => entry.id === migratedId) || entries[0];
}

export const getEffectV2Path = id => resolve(EFFECT_V2_PATHS, id, migrateLinkPathEffectId);
export const getEffectV2Exit = id => resolve(EFFECT_V2_EXITS, id, migrateLinkExitEffectId);

export function validateEffectV2Catalog() {
  for (const [label, entries, expected] of [["path", EFFECT_V2_PATHS, 21], ["exit", EFFECT_V2_EXITS, 21]]) {
    if (entries.length !== expected || new Set(entries.map(entry => entry.id)).size !== expected) {
      throw new Error(`Invalid ${label} effect catalog`);
    }
    for (const entry of entries) {
      if (!entry.family || !entry.reducedPreset || entry.duration < 120 || entry.duration > 500
        || !entry.supportsTargetCounts.includes(2)) throw new Error(`Invalid ${label} preset: ${entry.id}`);
    }
  }
  return true;
}
