import { THEMES, getTheme, getUsableTheme } from "./themeCatalog.js";

const DEFAULT_APPEARANCE = Object.freeze({
  cardBack: "classic",
  flipEffect: "bounce",
  themes: Object.freeze({ memoryMatch: "default", linkConnect: "default" }),
  ownedCardBacks: ["classic"],
  ownedFlipEffects: ["bounce"],
  ownedThemes: ["default"],
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
  const ownedThemes = normalizeOwnedThemes(value);
  const themes = normalizeEquippedThemes(value, ownedThemes);
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
    ownedThemes,
  };
}

export function getEquippedThemeId(appearance, gameId = "memory-match") {
  const key = getThemeKey(gameId);
  return appearance?.themes?.[key] || DEFAULT_APPEARANCE.themes[key];
}

export function equipTheme(appearance, gameId, themeId) {
  const key = getThemeKey(gameId);
  const requestedTheme = getUsableTheme(themeId).id;
  if (!getOwnedThemeIds(appearance).includes(requestedTheme)) return false;
  appearance.themes = { ...appearance.themes, [key]: requestedTheme };
  return true;
}

export function getOwnedThemeIds(appearance, gameId = "memory-match") {
  return appearance?.ownedThemes || DEFAULT_APPEARANCE.ownedThemes;
}

export function ownTheme(appearance, gameId, themeId) {
  const requestedTheme = getUsableTheme(themeId).id;
  if (!THEMES.some((theme) => theme.id === requestedTheme)) return false;
  const ownedThemes = getOwnedThemeIds(appearance);
  if (ownedThemes.includes(requestedTheme)) return false;
  appearance.ownedThemes = [...ownedThemes, requestedTheme];
  return true;
}

function normalizeOwnedThemes(value) {
  const splitOwnership = value.ownedThemesByGame && typeof value.ownedThemesByGame === "object"
    ? Object.values(value.ownedThemesByGame).flatMap((themes) => Array.isArray(themes) ? themes : [])
    : [];
  const savedThemes = Array.isArray(value.ownedThemes)
    ? value.ownedThemes
    : splitOwnership;
  return ownedIds(
    THEMES,
    savedThemes,
    DEFAULT_APPEARANCE.ownedThemes[0],
  ).filter((id) => getTheme(id).id === id);
}

function normalizeEquippedThemes(value, ownedThemes) {
  const savedThemes = value.themes && typeof value.themes === "object" ? value.themes : {};
  const legacyTheme = value.theme;
  return {
    memoryMatch: normalizeEquippedTheme(savedThemes.memoryMatch ?? legacyTheme, ownedThemes, "memoryMatch"),
    linkConnect: normalizeEquippedTheme(savedThemes.linkConnect, ownedThemes, "linkConnect"),
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
