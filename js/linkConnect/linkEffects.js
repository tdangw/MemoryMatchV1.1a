const EFFECT_PRICE = 1;

function effect(id, title, icon, className, defaultOwned = false) {
  return Object.freeze({ id, title, icon, price: defaultOwned ? 0 : EFFECT_PRICE, className, defaultOwned });
}

// Biến thể màu chỉ được giữ khi vẫn nhận biết rõ trên màn hình nhỏ.
export const LINK_PATH_EFFECTS = Object.freeze([
  effect("electric", "Điện tiêu chuẩn", "wand", "link-path-overlay--electric", true),
  effect("storm", "Điện bão", "wand", "link-path-overlay--storm"),
  effect("laser", "Laser hồng", "star", "link-path-overlay--laser"),
  effect("laser-ice", "Laser băng", "star", "link-path-overlay--laser-ice"),
  effect("rainbow", "Quang phổ", "celebrate", "link-path-overlay--rainbow"),
  effect("fire", "Tia lửa", "celebrate", "link-path-overlay--fire"),
  effect("magic", "Bụi phép", "star", "link-path-overlay--magic"),
  effect("sonic", "Xung", "music", "link-path-overlay--pulse"),
  effect("matrix", "Mũi tên dữ liệu", "arrow-right", "link-path-overlay--arrows"),
  effect("fireworks", "Pháo hoa", "celebrate", "link-path-overlay--fireworks"),
]);

export const LINK_EXIT_EFFECTS = Object.freeze([
  effect("default", "Xóa thẻ tiêu chuẩn", "wand", "link-tile--default", true),
  effect("finedust", "Bụi mịn", "star", "link-tile--finedust"),
  effect("split4", "Vỡ 4 mảnh", "collection", "link-tile--split4"),
  effect("gravity", "Rơi xuống", "arrow-right", "link-tile--gravity"),
  effect("portal", "Dịch chuyển", "restart", "link-tile--portal"),
  effect("burn", "Bốc cháy", "celebrate", "link-tile--burn"),
  effect("pixel", "Pixel Glitch", "terminal", "link-tile--pixel"),
  effect("slice", "Nhát kiếm", "slash", "link-tile--slice"),
  effect("bubble", "Bong bóng", "celebrate", "link-tile--bubble"),
]);

const PATH_EFFECT_MIGRATIONS = Object.freeze({
  cyber: "sonic", hydro: "laser-ice", plasma: "magic", holy: "rainbow", shadow: "electric", spiral: "magic",
  dashed: "matrix", bullet: "matrix", kame: "laser-ice", halo: "rainbow", chains: "matrix", meteor: "fire", poison: "magic",
});

const EXIT_EFFECT_MIGRATIONS = Object.freeze({
  dissolve: "finedust", split2: "split4", split8: "split4", triangles: "split4", crumble: "split4", collide: "split4",
  blackhole: "portal", implode: "portal", freeze: "default", origami: "slice", "electric-shock": "default", ghost: "bubble",
});

export function migrateLinkPathEffectId(id) { return PATH_EFFECT_MIGRATIONS[id] || id; }
export function migrateLinkExitEffectId(id) { return EXIT_EFFECT_MIGRATIONS[id] || id; }
export function getLinkPathEffect(id) { return LINK_PATH_EFFECTS.find((item) => item.id === id) || LINK_PATH_EFFECTS[0]; }
export function getLinkExitEffect(id) { return LINK_EXIT_EFFECTS.find((item) => item.id === id) || LINK_EXIT_EFFECTS[0]; }

export function getActiveLinkConnectionEffect(appearance) {
  const pathEffect = getLinkPathEffect(migrateLinkPathEffectId(appearance?.linkPathEffect));
  const exitEffect = getLinkExitEffect(migrateLinkExitEffectId(appearance?.linkExitEffect));
  return {
    pathId: pathEffect.id,
    pathClass: pathEffect.className,
    exitClass: exitEffect.className,
    exitId: exitEffect.id,
  };
}
