import { THEME_ASSET_MANIFEST } from "./generated/themeAssetManifest.js";
import { shuffleArray } from "./utils.js";
import { selectThemeAssets } from "./themeSelection.js";

const ALPHABET_VALUES = Object.freeze([
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "Ă", "Â", "Đ", "Ê", "Ô", "Ơ", "Ư", "À", "Á", "Ả", "Ã", "Ạ",
  "È", "É", "Ẻ", "Ẽ", "Ẹ", "Ì", "Í", "Ỉ", "Ĩ", "Ị",
]);

const TWO_DIGIT_VALUES = Object.freeze([
  ...Array.from({ length: 6 }, (_, index) => String(index).padStart(2, "0")),
  ...Array.from({ length: 90 }, (_, index) => String(index + 10)),
]);

const COMPUTER_SYMBOLS = Object.freeze([
  "+", "-", "×", "÷", "=", "≠", "<", ">", "≤", "≥", "%", "#",
  "@", "&", "|", "^", "~", "_", "/", "\\", "(", ")", "[", "]",
  "{", "}", "*", "!", "?", ":", ";",
  "←", "→", "↑", "↓", "↵", "⇥", "⌫", "⌦", "⌘", "⌥", "⌃", "⎋",
  "±", "∞", "√", "∑", "∏", "∫",
]);

const LEGACY_THEME_IDS = Object.freeze({
  food: "foods",
  "antiques-spy": "historical-artifacts",
  animals: "animals-land",
  plants: "trees",
});

const IMAGE_THEME_DEFINITIONS = Object.freeze([
  { id: "default", title: "Mặc định", price: 0, icon: "images" },
  { id: "animals-land", title: "Động vật trên cạn", price: 1, icon: "paw" },
  { id: "animals-air", title: "Động vật trên không", price: 1, icon: "bird" },
  { id: "animals-sea", title: "Động vật dưới biển", price: 1, icon: "fish" },
  { id: "foods", title: "Đồ ăn", price: 1, icon: "utensils" },
  { id: "drinks", title: "Đồ uống", price: 1, icon: "cup" },
  { id: "fruits", title: "Trái cây", price: 1, icon: "apple" },
  { id: "vegetables", title: "Rau củ", price: 1, icon: "carrot" },
  { id: "nature", title: "Thiên nhiên", price: 1, icon: "leaf" },
  { id: "flowers", title: "Hoa", price: 1, icon: "flower" },
  { id: "trees", title: "Cây", price: 1, icon: "tree" },
  { id: "leaves", title: "Lá", price: 1, icon: "leaf" },
  { id: "geometry", title: "Hình học", price: 1, icon: "shapes" },
  { id: "cyberpunk", title: "Cyberpunk", price: 1, icon: "terminal" },
  { id: "magic-rpg", title: "RPG phép thuật", price: 1, icon: "wand" },
  { id: "space", title: "Vũ trụ", price: 1, icon: "star" },
  { id: "household", title: "Vật dụng gia đình", price: 1, icon: "home" },
  { id: "office-supplies", title: "Đồ dùng văn phòng", price: 1, icon: "briefcase" },
  { id: "garden-tools", title: "Dụng cụ làm vườn", price: 1, icon: "shovel" },
  { id: "fashion", title: "Thời trang & phụ kiện", price: 1, icon: "hanger" },
  { id: "vehicles", title: "Phương tiện giao thông", price: 1, icon: "car" },
  { id: "historical-artifacts", title: "Cổ vật lịch sử", price: 1, icon: "landmark" },
  { id: "spy-gadgets", title: "Thiết bị gián điệp", price: 1, icon: "spyglass" },
  { id: "festivals", title: "Lễ hội", price: 1, icon: "celebrate" },
  { id: "instruments", title: "Nhạc cụ", price: 1, icon: "music" },
  { id: "mystery", title: "Huyền bí", price: 1, icon: "wand" },
]);

const IMAGE_THEMES = IMAGE_THEME_DEFINITIONS.map((theme) =>
  Object.freeze({
    ...theme,
    kind: "image",
    assetFolder: theme.id,
    assets: THEME_ASSET_MANIFEST[theme.id] || Object.freeze([]),
  }),
);

export const THEMES = Object.freeze([
  ...IMAGE_THEMES,
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
  return theme.kind === "generated" || (theme.kind === "image" && theme.assets.length > 0);
}

export function getThemeSelectionEligibility(themeId, count) {
  if (!Number.isInteger(count) || count < 1) throw new TypeError("Theme selection count must be a positive integer.");
  const theme = getUsableTheme(themeId);
  const available = theme.kind === "image" ? theme.assets.length : getGeneratedValues(theme).length;
  return Object.freeze({ theme, required: count, available, ok: available >= count });
}

export function getThemeCards(themeId, pairCount, { assetPaths, history, random } = {}) {
  const theme = getUsableTheme(themeId);
  const restoredValues = assetPaths ? getAssetsByPath(theme, assetPaths) : null;
  const values = restoredValues?.length === pairCount
    ? restoredValues
    : pickThemeValues(theme, pairCount, { history, random });
  if (values.length !== pairCount) return [];
  return values.map((value) => {
    if (theme.kind === "image") {
      return {
        id: `${theme.id}-${value.path}`,
        alt: `${theme.title}: ${humanizeAssetId(assetIdFromFile(value.path))}`,
        src: `${import.meta.env.BASE_URL}assets/images/themes/${theme.assetFolder}/${value.path}`,
        assetPath: value.path,
        special: value.special === true,
      };
    }
    const label = String(value);
    return {
      id: `${theme.id}-${label}`,
      alt: `${theme.title}: ${label}`,
      src: createGeneratedCardImage(label, theme),
      assetPath: null,
      special: false,
    };
  });
}

export function selectThemeCards(themeId, count, { history, random } = {}) {
  const theme = getUsableTheme(themeId);
  if (theme.kind !== "image") return getThemeCards(theme.id, count);
  return selectThemeAssets({ assets: theme.assets, count, history, random });
}

function pickThemeValues(theme, pairCount, { history, random } = {}) {
  let values;
  if (theme.kind === "image") return selectThemeAssets({ assets: theme.assets, count: pairCount, history, random });
  values = getGeneratedValues(theme);
  shuffleArray(values);
  return values.slice(0, pairCount);
}

function getAssetsByPath(theme, assetPaths) {
  if (theme.kind !== "image" || !Array.isArray(assetPaths)) return [];
  const byPath = new Map(theme.assets.map((asset) => [asset.path, asset]));
  const values = assetPaths.map((path) => byPath.get(path)).filter(Boolean);
  return new Set(values.map((asset) => asset.path)).size === values.length ? values : [];
}

function getGeneratedValues(theme) {
  if (theme.generator === "alphabet") return [...ALPHABET_VALUES];
  if (theme.generator === "numbers-2") return [...TWO_DIGIT_VALUES];
  if (theme.generator === "numbers-3") return Array.from({ length: 900 }, (_, index) => index + 100);
  return [...COMPUTER_SYMBOLS];
}

function humanizeAssetId(id) {
  return id.replaceAll("-", " ");
}

function assetIdFromFile(file) {
  return file.replace(/\.webp$/i, "").replaceAll(/[\\/]/g, "-");
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
