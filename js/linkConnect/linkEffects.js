export const LINK_CONNECTION_EFFECTS = Object.freeze([
  Object.freeze({ id: "electric", title: "Điện", pathClass: "link-path-overlay--electric", exitClass: "link-tile--dissolve" }),
  Object.freeze({ id: "laser", title: "Laser", pathClass: "link-path-overlay--laser", exitClass: "link-tile--fade" }),
  Object.freeze({ id: "cyber", title: "Xung Cyber", pathClass: "link-path-overlay--cyber", exitClass: "link-tile--pixel" }),
  Object.freeze({ id: "magic", title: "Bụi phép", pathClass: "link-path-overlay--magic", exitClass: "link-tile--magic" }),
]);

export function getActiveLinkConnectionEffect() {
  // Khi mở bán hiệu ứng, giá trị trang bị sẽ được đọc từ appearance ở đây.
  return LINK_CONNECTION_EFFECTS[0];
}
