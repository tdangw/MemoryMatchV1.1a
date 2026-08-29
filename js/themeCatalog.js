import { GAME_CONFIG } from "./config.js";
import { IMAGE_THEME_ASSETS } from "./themeAssets.js";
import { shuffleArray } from "./utils.js";

const COMPUTER_SYMBOLS = Object.freeze([
  "+", "-", "×", "÷", "=", "≠", "<", ">", "≤", "≥", "%", "#",
  "@", "&", "|", "^", "~", "_", "/", "\\", "(", ")", "[", "]",
  "{", "}", "*", "!", "?", ":", ";",
]);

const LEGACY_THEME_IDS = Object.freeze({
  food: "foods",
  "antiques-spy": "historical-artifacts",
  animals: "animals-land",
  plants: "trees",
});

export const THEMES = Object.freeze([
  // Mặc định dùng 1.000 ảnh WebP; các chủ đề tạo mã dùng generator bên dưới.
  { id: "default", title: "Mặc định", price: 0, kind: "image", imageCount: GAME_CONFIG.cardImages.count, assetFolder: GAME_CONFIG.cardImages.defaultTheme, icon: "images" },
  { id: "animals-land", title: "Động vật trên cạn", price: 1, kind: "image", assetFolder: "animals-land", assets: IMAGE_THEME_ASSETS["animals-land"], icon: "paw", playable: false },
  { id: "animals-air", title: "Động vật trên không", price: 1, kind: "image", assetFolder: "animals-air", assets: IMAGE_THEME_ASSETS["animals-air"], icon: "bird", playable: false },
  { id: "animals-sea", title: "Động vật dưới biển", price: 1, kind: "image", assetFolder: "animals-sea", assets: IMAGE_THEME_ASSETS["animals-sea"], icon: "fish", playable: false },
  { id: "foods", title: "Đồ ăn", price: 1, kind: "image", assetFolder: "foods", assets: IMAGE_THEME_ASSETS.foods, icon: "utensils" },
  { id: "drinks", title: "Đồ uống", price: 1, kind: "image", assetFolder: "drinks", assets: IMAGE_THEME_ASSETS.drinks, icon: "cup" },
  { id: "fruits", title: "Trái cây", price: 1, kind: "image", assetFolder: "fruits", assets: IMAGE_THEME_ASSETS.fruits, icon: "apple", playable: false },
  { id: "vegetables", title: "Rau củ", price: 1, kind: "image", assetFolder: "vegetables", assets: IMAGE_THEME_ASSETS.vegetables, icon: "carrot", playable: false },
  { id: "nature", title: "Thiên nhiên", price: 1, kind: "image", assetFolder: "nature", assets: IMAGE_THEME_ASSETS.nature, icon: "leaf" },
  { id: "flowers", title: "Hoa", price: 1, kind: "image", assetFolder: "flowers", assets: IMAGE_THEME_ASSETS.flowers, icon: "flower" },
  { id: "trees", title: "Cây", price: 1, kind: "image", assetFolder: "trees", assets: IMAGE_THEME_ASSETS.trees, icon: "tree", playable: false },
  { id: "leaves", title: "Lá", price: 1, kind: "image", assetFolder: "leaves", assets: IMAGE_THEME_ASSETS.leaves, icon: "leaf", playable: false },
  { id: "geometry", title: "Hình học", price: 1, kind: "image", assetFolder: "geometry", assets: IMAGE_THEME_ASSETS.geometry, icon: "shapes" },
  { id: "cyberpunk", title: "Cyberpunk", price: 1, kind: "image", assetFolder: "cyberpunk", assets: IMAGE_THEME_ASSETS.cyberpunk, icon: "terminal" },
  { id: "magic-rpg", title: "RPG phép thuật", price: 1, kind: "image", assetFolder: "magic-rpg", assets: IMAGE_THEME_ASSETS["magic-rpg"], icon: "wand" },
  { id: "space", title: "Vũ trụ", price: 1, kind: "image", assetFolder: "space", assets: IMAGE_THEME_ASSETS.space, icon: "star" },
  { id: "household", title: "Vật dụng gia đình", price: 1, kind: "image", assetFolder: "household", assets: IMAGE_THEME_ASSETS.household, icon: "home" },
  { id: "office-supplies", title: "Đồ dùng văn phòng", price: 1, kind: "image", assetFolder: "office-supplies", assets: IMAGE_THEME_ASSETS["office-supplies"], icon: "briefcase" },
  { id: "garden-tools", title: "Dụng cụ làm vườn", price: 1, kind: "image", assetFolder: "garden-tools", assets: IMAGE_THEME_ASSETS["garden-tools"], icon: "shovel" },
  { id: "fashion", title: "Thời trang & phụ kiện", price: 1, kind: "image", assetFolder: "fashion", assets: IMAGE_THEME_ASSETS.fashion, icon: "hanger" },
  { id: "vehicles", title: "Phương tiện giao thông", price: 1, kind: "image", assetFolder: "vehicles", assets: IMAGE_THEME_ASSETS.vehicles, icon: "car" },
  { id: "historical-artifacts", title: "Cổ vật lịch sử", price: 1, kind: "image", assetFolder: "historical-artifacts", assets: IMAGE_THEME_ASSETS["historical-artifacts"], icon: "landmark" },
  { id: "spy-gadgets", title: "Thiết bị gián điệp", price: 1, kind: "image", assetFolder: "spy-gadgets", assets: IMAGE_THEME_ASSETS["spy-gadgets"], icon: "spyglass" },
  { id: "festivals", title: "Lễ hội", price: 1, kind: "image", assetFolder: "festivals", assets: IMAGE_THEME_ASSETS.festivals, icon: "celebrate" },
  { id: "instruments", title: "Nhạc cụ", price: 1, kind: "image", assetFolder: "instruments", assets: IMAGE_THEME_ASSETS.instruments, icon: "music", playable: false },
  { id: "mystery", title: "Huyền bí", price: 1, kind: "image", assetFolder: "mystery", assets: IMAGE_THEME_ASSETS.mystery, icon: "wand", playable: false },
  { id: "alphabet", title: "Chữ cái", price: 1, kind: "generated", generator: "alphabet", icon: "type" },
  { id: "numbers-2", title: "2 Số", price: 1, kind: "generated", generator: "numbers-2", icon: "hash" },
  { id: "numbers-3", title: "3 Số", price: 1, kind: "generated", generator: "numbers-3", icon: "hash" },
  { id: "computer-symbols", title: "Ký hiệu máy tính", price: 1, kind: "generated", generator: "computer-symbols", icon: "terminal" },
]);

export function getTheme(id) {
  const resolvedId = LEGACY_THEME_IDS[id] || id;
  return THEMES.find((theme) => theme.id === resolvedId) || THEMES[0];
}

export function getUsableTheme(id) {
  const theme = getTheme(id);
  return theme.kind && theme.playable !== false ? theme : THEMES[0];
}

export function isThemePlayable(theme) {
  return theme.kind && theme.playable !== false;
}

export function getThemeCards(themeId, pairCount) {
  const theme = getUsableTheme(themeId);
  const values = pickThemeValues(theme, pairCount);
  return values.map((value) => {
    if (theme.kind === "image") {
      if (theme.assets) {
        return {
          id: `${theme.id}-${value.id}`,
          alt: `${theme.title}: ${value.label}`,
          src: `${import.meta.env.BASE_URL}assets/images/themes/${theme.assetFolder}/${value.file}`,
        };
      }
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
  if (theme.kind === "image") values = theme.assets ? [...theme.assets] : Array.from({ length: theme.imageCount }, (_, index) => index + 1);
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
