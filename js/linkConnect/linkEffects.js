const EFFECT_PRICE = 1;

function effect(id, title, icon, className, defaultOwned = false) {
  return Object.freeze({ id, title, icon, price: defaultOwned ? 0 : EFFECT_PRICE, className, defaultOwned });
}

export const LINK_PATH_EFFECTS = Object.freeze([
  effect("electric", "Đường nối tiêu chuẩn", "wand", "link-path-overlay--electric", true),
  effect("laser", "Laser", "star", "link-path-overlay--laser"), effect("fire", "Tia lửa", "celebrate", "link-path-overlay--fire"), effect("magic", "Bụi phép", "star", "link-path-overlay--magic"), effect("cyber", "Xung Cyber", "terminal", "link-path-overlay--cyber"), effect("rainbow", "Bảy sắc", "celebrate", "link-path-overlay--rainbow"), effect("hydro", "Thủy triều", "celebrate", "link-path-overlay--hydro"), effect("plasma", "Plasma tím", "star", "link-path-overlay--plasma"), effect("holy", "Hào quang", "star", "link-path-overlay--holy"), effect("shadow", "Màn đêm", "moon", "link-path-overlay--shadow"), effect("spiral", "Xoắn ốc", "restart", "link-path-overlay--spiral"), effect("dashed", "Đoạn đứt", "more", "link-path-overlay--dashed"), effect("bullet", "Viên đạn", "arrow-right", "link-path-overlay--bullet"), effect("kame", "Chưởng lực", "play", "link-path-overlay--kame"), effect("halo", "Halo Beam", "star", "link-path-overlay--halo"), effect("matrix", "Matrix", "terminal", "link-path-overlay--matrix"), effect("sonic", "Xung âm thanh", "music", "link-path-overlay--sonic"), effect("chains", "Xích vàng", "link", "link-path-overlay--chains"), effect("meteor", "Sao băng", "celebrate", "link-path-overlay--meteor"), effect("poison", "Nọc acid", "leaf", "link-path-overlay--poison"),
]);

export const LINK_EXIT_EFFECTS = Object.freeze([
  // Hiệu ứng gốc trước khi bổ sung catalog: CSS thuần, nhẹ và luôn sở hữu.
  effect("default", "Xóa thẻ tiêu chuẩn", "wand", "link-tile--default", true),
  effect("dissolve", "Tan biến", "wand", "link-tile--dissolve"),
  effect("split4", "Vỡ 4 mảnh", "collection", "link-tile--split4"), effect("split2", "Vỡ 2 mảnh", "slash", "link-tile--split2"), effect("split8", "Vỡ 8 mảnh", "collection", "link-tile--split8"), effect("triangles", "Mảnh tam giác", "play", "link-tile--triangles"), effect("crumble", "Vụn nhỏ", "celebrate", "link-tile--crumble"), effect("finedust", "Bụi mịn", "star", "link-tile--finedust"), effect("gravity", "Rơi xuống", "arrow-right", "link-tile--gravity"), effect("collide", "Đập vỡ", "celebrate", "link-tile--collide"), effect("portal", "Dịch chuyển", "restart", "link-tile--portal"), effect("blackhole", "Hố đen", "moon", "link-tile--blackhole"), effect("freeze", "Đóng băng", "star", "link-tile--freeze"), effect("burn", "Bốc cháy", "celebrate", "link-tile--burn"), effect("pixel", "Pixel Glitch", "terminal", "link-tile--pixel"), effect("implode", "Sụp đổ", "play", "link-tile--implode"), effect("slice", "Nhát kiếm", "slash", "link-tile--slice"), effect("bubble", "Bong bóng", "celebrate", "link-tile--bubble"), effect("origami", "Origami", "arrow-right", "link-tile--origami"), effect("electric-shock", "Sốc điện", "wand", "link-tile--electric-shock"), effect("ghost", "Hồn bay", "moon", "link-tile--ghost"),
]);

export function getLinkPathEffect(id) { return LINK_PATH_EFFECTS.find((item) => item.id === id) || LINK_PATH_EFFECTS[0]; }
export function getLinkExitEffect(id) { return LINK_EXIT_EFFECTS.find((item) => item.id === id) || LINK_EXIT_EFFECTS[0]; }

export function getActiveLinkConnectionEffect(appearance) {
  const pathEffect = getLinkPathEffect(appearance?.linkPathEffect);
  const exitEffect = getLinkExitEffect(appearance?.linkExitEffect);
  return { pathClass: pathEffect.className, exitClass: exitEffect.className, exitId: exitEffect.id };
}
