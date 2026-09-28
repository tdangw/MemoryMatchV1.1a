const EFFECT_PRICE = 1;

function effect(id, title, icon, className, defaultOwned = false) {
  return Object.freeze({ id, title, icon, price: defaultOwned ? 0 : EFFECT_PRICE, className, defaultOwned });
}

// Bộ thử nghiệm giữ một effect mặc định miễn phí và 20 mẫu từ Visual FX Lab.
// Renderer có thể tối ưu/viết lại từng effect mà không đổi ID đã lưu.
export const LINK_PATH_EFFECTS = Object.freeze([
  effect("default", "Đường nối tiêu chuẩn", "wand", "link-path-overlay--default", true),
  effect("electric", "Tia điện chân thực", "wand", "link-path-overlay--electric"),
  effect("laser", "Tia Laser Neon", "star", "link-path-overlay--laser"),
  effect("fire", "Tia lửa rực rỡ", "celebrate", "link-path-overlay--fire"),
  effect("magic", "Bụi phép kỳ ảo", "star", "link-path-overlay--magic"),
  effect("cyber", "Xung nhịp Cyber", "terminal", "link-path-overlay--cyber"),
  effect("rainbow", "Bảy sắc cầu vồng", "celebrate", "link-path-overlay--rainbow"),
  effect("hydro", "Dòng thủy triều", "celebrate", "link-path-overlay--hydro"),
  effect("plasma", "Tia Plasma vũ trụ", "star", "link-path-overlay--plasma"),
  effect("holy", "Hào quang hoàng kim", "star", "link-path-overlay--holy"),
  effect("shadow", "Xung màn đêm", "moon", "link-path-overlay--shadow"),
  effect("spiral", "Xoắn ốc Helical", "restart", "link-path-overlay--spiral"),
  effect("dashed", "Đoạn đứt năng lượng", "more", "link-path-overlay--dashed"),
  effect("bullet", "Viên đạn tốc độ", "arrow-right", "link-path-overlay--bullet"),
  effect("kame", "Chưởng lực Energy Wave", "play", "link-path-overlay--kame"),
  effect("halo", "Halo Beam", "star", "link-path-overlay--halo"),
  effect("matrix", "Ma trận Digital Code", "terminal", "link-path-overlay--matrix"),
  effect("sonic", "Xung âm thanh", "music", "link-path-overlay--sonic"),
  effect("chains", "Xích mạ vàng", "link", "link-path-overlay--chains"),
  effect("meteor", "Sao băng thần thánh", "celebrate", "link-path-overlay--meteor"),
  effect("poison", "Nọc độc Acid", "leaf", "link-path-overlay--poison"),
]);

export const LINK_EXIT_EFFECTS = Object.freeze([
  effect("default", "Xóa thẻ tiêu chuẩn", "wand", "link-tile--default", true),
  effect("dissolve", "Tan biến khói tro", "wand", "link-tile--dissolve"),
  effect("finedust", "Bụi mịn", "star", "link-tile--finedust"),
  effect("split4", "Vỡ 4 mảnh", "collection", "link-tile--split4"),
  effect("split2", "Vỡ 2 mảnh", "slash", "link-tile--split2"),
  effect("split8", "Vỡ 8 mảnh", "collection", "link-tile--split8"),
  effect("triangles", "Mảnh tam giác", "play", "link-tile--triangles"),
  effect("crumble", "Vụn nhỏ rơi tự do", "celebrate", "link-tile--crumble"),
  effect("gravity", "Rơi xuống", "arrow-right", "link-tile--gravity"),
  effect("collide", "Đập vào nhau vỡ", "celebrate", "link-tile--collide"),
  effect("portal", "Dịch chuyển", "restart", "link-tile--portal"),
  effect("blackhole", "Hố đen vũ trụ", "moon", "link-tile--blackhole"),
  effect("freeze", "Đóng băng vỡ", "star", "link-tile--freeze"),
  effect("burn", "Bốc cháy", "celebrate", "link-tile--burn"),
  effect("pixel", "Pixel Glitch", "terminal", "link-tile--pixel"),
  effect("implode", "Sụp đổ Implosion", "play", "link-tile--implode"),
  effect("slice", "Nhát kiếm", "slash", "link-tile--slice"),
  effect("bubble", "Bong bóng", "celebrate", "link-tile--bubble"),
  effect("origami", "Giấy Origami", "arrow-right", "link-tile--origami"),
  effect("electric-shock", "Sốc điện vỡ", "wand", "link-tile--electric-shock"),
  effect("ghost", "Hồn bay", "moon", "link-tile--ghost"),
]);

export function getLinkPathEffect(id) { return LINK_PATH_EFFECTS.find((item) => item.id === id) || LINK_PATH_EFFECTS[0]; }
export function getLinkExitEffect(id) { return LINK_EXIT_EFFECTS.find((item) => item.id === id) || LINK_EXIT_EFFECTS[0]; }

export function getActiveLinkConnectionEffect(appearance) {
  const pathEffect = getLinkPathEffect(appearance?.linkPathEffect);
  const exitEffect = getLinkExitEffect(appearance?.linkExitEffect);
  return {
    pathId: pathEffect.id,
    pathClass: pathEffect.className,
    exitClass: exitEffect.className,
    exitId: exitEffect.id,
  };
}
