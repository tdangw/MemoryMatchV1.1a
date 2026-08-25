import { GAME_CONFIG } from "./config.js";
import { shuffleArray } from "./utils.js";

const COMPUTER_SYMBOLS = Object.freeze([
  "+", "-", "×", "÷", "=", "≠", "<", ">", "≤", "≥", "%", "#",
  "@", "&", "|", "^", "~", "_", "/", "\\", "(", ")", "[", "]",
  "{", "}", "*", "!", "?", ":", ";",
]);

export const THEMES = Object.freeze([
  // Mặc định dùng 1.000 ảnh WebP; các chủ đề tạo mã dùng generator bên dưới.
  { id: "default", title: "Mặc định", price: 0, kind: "image", imageCount: GAME_CONFIG.cardImages.count, assetFolder: GAME_CONFIG.cardImages.defaultTheme, icon: "images" },
  { id: "animals", title: "Động vật chibi", price: 1, kind: "image", imageCount: 24, assetFolder: "animals", assetPrefix: "animals-", icon: "paw" },
  { id: "food", title: "Đồ ăn & thức uống", price: 1, kind: "image", imageCount: 24, assetFolder: "food", assetPrefix: "food-", icon: "utensils" },
  { id: "nature", title: "Thiên nhiên", price: 1, kind: "image", imageCount: 24, assetFolder: "nature", assetPrefix: "nature-", icon: "leaf" },
  { id: "flowers", title: "Cây cối & hoa lá", price: 1, kind: "image", imageCount: 24, assetFolder: "flowers", assetPrefix: "flowers-", icon: "flower" },
  { id: "geometry", title: "Hình học", price: 1, kind: "image", imageCount: 24, assetFolder: "geometry", assetPrefix: "geometry-", icon: "shapes" },
  { id: "cyberpunk", title: "Cyberpunk", comingSoon: true, icon: "terminal" },
  { id: "magic-rpg", title: "RPG phép thuật", comingSoon: true, icon: "wand" },
  { id: "space", title: "Vũ trụ", comingSoon: true, icon: "star" },
  { id: "household", title: "Vật dụng gia đình", comingSoon: true, icon: "home" },
  { id: "office-supplies", title: "Đồ dùng văn phòng", comingSoon: true, icon: "briefcase" },
  { id: "garden-tools", title: "Dụng cụ làm vườn", comingSoon: true, icon: "shovel" },
  { id: "fashion", title: "Thời trang & phụ kiện", comingSoon: true, icon: "hanger" },
  { id: "vehicles", title: "Phương tiện giao thông", comingSoon: true, icon: "car" },
  { id: "antiques-spy", title: "Cổ vật & gián điệp", comingSoon: true, icon: "spyglass" },
  { id: "festivals", title: "Lễ hội", comingSoon: true, icon: "celebrate" },
  { id: "alphabet", title: "Chữ cái", price: 1, kind: "generated", generator: "alphabet", icon: "type" },
  { id: "numbers-2", title: "2 Số", price: 1, kind: "generated", generator: "numbers-2", icon: "hash" },
  { id: "numbers-3", title: "3 Số", price: 1, kind: "generated", generator: "numbers-3", icon: "hash" },
  { id: "computer-symbols", title: "Ký hiệu máy tính", price: 1, kind: "generated", generator: "computer-symbols", icon: "terminal" },
]);

export function getTheme(id) {
  return THEMES.find((theme) => theme.id === id) || THEMES[0];
}

export function getUsableTheme(id) {
  const theme = getTheme(id);
  return theme.kind ? theme : THEMES[0];
}

export function getThemeCards(themeId, pairCount) {
  const theme = getUsableTheme(themeId);
  const values = pickThemeValues(theme, pairCount);
  return values.map((value) => {
    if (theme.kind === "image") {
      const filename = theme.assetPrefix
        ? `${theme.assetPrefix}${String(value).padStart(2, "0")}.webp`
        : `MM-image (${value}).webp`;
      return { id: String(value), alt: `Thẻ ${value}`, src: `${import.meta.env.BASE_URL}assets/images/themes/${theme.assetFolder}/${filename}` };
    }
    const label = String(value);
    return {
      id: `${theme.id}-${label}`,
      alt: `${theme.title}: ${label}`,
      src: createGeneratedCardImage(label, theme),
    };
  });
}

function pickThemeValues(theme, pairCount) {
  let values;
  if (theme.kind === "image") values = Array.from({ length: theme.imageCount }, (_, index) => index + 1);
  else if (theme.generator === "alphabet") values = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  else if (theme.generator === "numbers-2") values = Array.from({ length: 90 }, (_, index) => index + 10);
  else if (theme.generator === "numbers-3") values = Array.from({ length: 900 }, (_, index) => index + 100);
  else values = [...COMPUTER_SYMBOLS];
  shuffleArray(values);
  return values.slice(0, pairCount);
}

function createGeneratedCardImage(label, theme) {
  const escapedLabel = escapeSvg(label);
  const variant = getVisualVariant(label);
  const svg = theme.generator === "alphabet"
    ? createAlphabetCard(escapedLabel, variant)
    : theme.generator === "numbers-2" || theme.generator === "numbers-3"
      ? createNumberCard(escapedLabel, variant)
      : createComputerSymbolCard(escapedLabel, variant);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getVisualVariant(label) {
  return [...label].reduce((total, character) => total + character.codePointAt(0), 0) % 3;
}

function createAlphabetCard(label, variant) {
  const colors = [
    ["#5b8cff", "#5b45c8", "#dceaff"],
    ["#6fa5ff", "#824bc5", "#d9ecff"],
    ["#4d8de2", "#7039b7", "#e2dcff"],
  ][variant];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="Chữ cái ${label}"><defs><linearGradient id="face" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#07152f" flood-opacity=".36"/></filter></defs><rect width="160" height="160" rx="24" fill="#132d58"/><rect x="13" y="16" width="134" height="130" rx="24" fill="#0b1e42" opacity=".65"/><g filter="url(#shadow)"><rect x="20" y="17" width="120" height="120" rx="25" fill="url(#face)"/></g><text x="80" y="101" text-anchor="middle" fill="${colors[2]}" stroke="#253d90" stroke-width="2" paint-order="stroke" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="79" font-weight="800">${label}</text></svg>`;
}

function createNumberCard(label, variant) {
  const colors = [
    ["#0d665f", "#082f3c", "#75ffe4", "#164f55"],
    ["#127064", "#0a3541", "#a5ffe2", "#1c5b5e"],
    ["#075b68", "#082c43", "#81f6ff", "#125363"],
  ][variant];
  const fontSize = label.length >= 3 ? 53 : 66;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="Số ${label}"><defs><linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient><filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="160" height="160" rx="24" fill="#102b45"/><rect x="13" y="14" width="134" height="132" rx="21" fill="#071f2c" stroke="#326776" stroke-width="3"/><rect x="23" y="27" width="114" height="92" rx="12" fill="url(#panel)" stroke="#67cbbd" stroke-opacity=".55" stroke-width="2"/><text x="80" y="91" text-anchor="middle" fill="${colors[2]}" filter="url(#glow)" font-family="Courier New, monospace" font-size="${fontSize}" font-weight="700" letter-spacing="-3">${label}</text></svg>`;
}

function createComputerSymbolCard(label, variant) {
  const colors = [
    ["#1f3154", "#0d172b", "#62b5ff", "#e5f3ff"],
    ["#26375e", "#101a31", "#8b9dff", "#edf0ff"],
    ["#1e3f55", "#0d1d2d", "#66d4e8", "#e6fbff"],
  ][variant];
  const fontSize = label.length >= 2 ? 60 : 76;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="Ký hiệu máy tính ${label}"><defs><linearGradient id="key" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient><filter id="key-shadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="4" flood-color="#00091c" flood-opacity=".55"/></filter></defs><rect width="160" height="160" rx="24" fill="#0c1b34"/><g filter="url(#key-shadow)"><rect x="17" y="18" width="126" height="120" rx="20" fill="url(#key)" stroke="${colors[2]}" stroke-opacity=".68" stroke-width="2"/></g><text x="80" y="97" text-anchor="middle" fill="${colors[3]}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700">${label}</text></svg>`;
}

function escapeSvg(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
