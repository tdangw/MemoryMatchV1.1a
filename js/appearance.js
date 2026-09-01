import { THEMES, getTheme, getUsableTheme } from "./themeCatalog.js";

const DEFAULT_APPEARANCE = Object.freeze({
  cardBack: "classic",
  flipEffect: "bounce",
  themes: Object.freeze({ memoryMatch: "default", linkConnect: "default" }),
  ownedCardBacks: ["classic"],
  ownedFlipEffects: ["bounce"],
  ownedThemesByGame: Object.freeze({
    memoryMatch: Object.freeze(["default"]),
    linkConnect: Object.freeze(["default"]),
  }),
});

export const CARD_BACKS = Object.freeze([
  {
    id: "classic",
    title: "Hoàng hôn",
    price: 0,
    previewClass: "card-back--classic",
  },
  {
    id: "midnight",
    title: "Đêm sao",
    price: 120,
    previewClass: "card-back--midnight",
  },
  {
    id: "aurora",
    title: "Cực quang",
    price: 180,
    previewClass: "card-back--aurora",
  },
  {
    id: "candy",
    title: "Kẹo sắc màu",
    price: 220,
    previewClass: "card-back--candy",
  },
]);

export const FLIP_EFFECTS = Object.freeze([
  { id: "bounce", title: "Bật nảy", price: 0, animationClass: "appear-bounce" },
  {
    id: "fade-scale",
    title: "Mờ phóng to",
    price: 90,
    animationClass: "appear-fade-scale",
  },
  { id: "pop", title: "Nảy nhanh", price: 110, animationClass: "appear-pop" },
  {
    id: "slide-up",
    title: "Trượt lên",
    price: 130,
    animationClass: "appear-slide-up",
  },
  {
    id: "flip-y",
    title: "Lật 3D",
    price: 170,
    animationClass: "appear-flip-y",
  },
  {
    id: "zoom-rotate",
    title: "Xoay thu phóng",
    price: 200,
    animationClass: "appear-zoom-rotate",
  },
  {
    id: "blur-in",
    title: "Tan mờ",
    price: 150,
    animationClass: "appear-blur-in",
  },
]);

function knownId(items, id, fallback) {
  return items.some((item) => item.id === id) ? id : fallback;
}

function ownedIds(items, value, defaultId) {
  const ids = Array.isArray(value)
    ? value.filter((id) => items.some((item) => item.id === id))
    : [];
  return [...new Set([defaultId, ...ids])];
}

export function normalizeAppearance(value = {}) {
  const ownedCardBacks = ownedIds(
    CARD_BACKS,
    value.ownedCardBacks,
    DEFAULT_APPEARANCE.cardBack,
  );
  const ownedFlipEffects = ownedIds(
    FLIP_EFFECTS,
    value.ownedFlipEffects,
    DEFAULT_APPEARANCE.flipEffect,
  );
  const cardBack = knownId(
    CARD_BACKS,
    value.cardBack,
    DEFAULT_APPEARANCE.cardBack,
  );
  const flipEffect = knownId(
    FLIP_EFFECTS,
    value.flipEffect,
    DEFAULT_APPEARANCE.flipEffect,
  );
  const ownedThemesByGame = normalizeOwnedThemes(value);
  const themes = normalizeEquippedThemes(value, ownedThemesByGame);
  return {
    cardBack: ownedCardBacks.includes(cardBack)
      ? cardBack
      : DEFAULT_APPEARANCE.cardBack,
    flipEffect: ownedFlipEffects.includes(flipEffect)
      ? flipEffect
      : DEFAULT_APPEARANCE.flipEffect,
    themes,
    ownedCardBacks,
    ownedFlipEffects,
    ownedThemesByGame,
  };
}

export function getEquippedThemeId(appearance, gameId = "memory-match") {
  const key = getThemeKey(gameId);
  return appearance?.themes?.[key] || DEFAULT_APPEARANCE.themes[key];
}

export function equipTheme(appearance, gameId, themeId) {
  const key = getThemeKey(gameId);
  const requestedTheme = getUsableTheme(themeId).id;
  if (!getOwnedThemeIds(appearance, gameId).includes(requestedTheme)) return false;
  appearance.themes = { ...appearance.themes, [key]: requestedTheme };
  return true;
}

export function getOwnedThemeIds(appearance, gameId = "memory-match") {
  const key = getThemeKey(gameId);
  return appearance?.ownedThemesByGame?.[key]
    || DEFAULT_APPEARANCE.ownedThemesByGame[key];
}

export function ownTheme(appearance, gameId, themeId) {
  const key = getThemeKey(gameId);
  const requestedTheme = getUsableTheme(themeId).id;
  if (!THEMES.some((theme) => theme.id === requestedTheme)) return false;
  const ownedThemes = getOwnedThemeIds(appearance, gameId);
  if (ownedThemes.includes(requestedTheme)) return false;
  appearance.ownedThemesByGame = {
    ...appearance.ownedThemesByGame,
    [key]: [...ownedThemes, requestedTheme],
  };
  return true;
}

function normalizeOwnedThemes(value) {
  const saved = value.ownedThemesByGame && typeof value.ownedThemesByGame === "object"
    ? value.ownedThemesByGame
    : {};
  // Dữ liệu trước Phase 4 chỉ thuộc Memory Match; không tự mở chủ đề ở Link Connect.
  const legacyMemoryThemes = value.ownedThemes;
  return {
    memoryMatch: normalizeOwnedThemeIds(saved.memoryMatch ?? legacyMemoryThemes, "memoryMatch"),
    linkConnect: normalizeOwnedThemeIds(saved.linkConnect, "linkConnect"),
  };
}

function normalizeOwnedThemeIds(value, gameKey) {
  return ownedIds(
    THEMES,
    value,
    DEFAULT_APPEARANCE.ownedThemesByGame[gameKey][0],
  ).filter((id) => getTheme(id).id === id);
}

function normalizeEquippedThemes(value, ownedThemesByGame) {
  const savedThemes = value.themes && typeof value.themes === "object" ? value.themes : {};
  const legacyTheme = value.theme;
  return {
    memoryMatch: normalizeEquippedTheme(savedThemes.memoryMatch ?? legacyTheme, ownedThemesByGame.memoryMatch, "memoryMatch"),
    linkConnect: normalizeEquippedTheme(savedThemes.linkConnect, ownedThemesByGame.linkConnect, "linkConnect"),
  };
}

function normalizeEquippedTheme(requestedTheme, ownedThemes, gameKey) {
  const themeId = getUsableTheme(requestedTheme).id;
  return ownedThemes.includes(themeId) ? themeId : DEFAULT_APPEARANCE.themes[gameKey];
}

function getThemeKey(gameId) {
  return gameId === "link-connect" || gameId === "linkConnect"
    ? "linkConnect"
    : "memoryMatch";
}

export function getCardBackClass(id) {
  return (
    CARD_BACKS.find((item) => item.id === id)?.previewClass ||
    "card-back--classic"
  );
}

export function getFlipAnimationClass(id) {
  return (
    FLIP_EFFECTS.find((item) => item.id === id)?.animationClass ||
    "appear-bounce"
  );
}
