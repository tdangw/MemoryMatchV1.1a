import { normalizeSparkSave } from './liveops/sparkModel.js';
import { THEMES, getTheme, getUsableTheme } from "./themeCatalog.js";
import { LINK_EXIT_EFFECTS, LINK_PATH_EFFECTS } from "./linkConnect/linkEffects.js";
import { ACHIEVEMENT_ITEMS, normalizeAchievementLedger, normalizeProfileCosmetics, ACHIEVEMENT_OWNED_SLOTS } from './progression/achievementModel.js';
import { normalizeAcquisitions } from './progression/acquisitionModel.js';
import { normalizeRewardLedger } from './liveops/ledger.js';

const DEFAULT_APPEARANCE = Object.freeze({
  cardBack: "classic",
  flipEffect: "bounce",
  linkPathEffect: "default",
  linkExitEffect: "default",
  themes: Object.freeze({ memoryMatch: "default", linkConnect: "default", tripleConnect: "default" }),
  ownedCardBacks: ["classic"],
  ownedFlipEffects: ["bounce"],
  ownedLinkPathEffects: ["default"],
  ownedLinkExitEffects: ["default"],
  ownedThemes: ["default"],
  ownedTripleThemes: ["default"],
  triplePathEffect: "default",
  tripleExitEffect: "default",
  ownedTriplePathEffects: ["default"],
  ownedTripleExitEffects: ["default"],
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
  {
    id: "moon-mountain",
    title: "Nguyệt Sơn",
    price: 260,
    previewClass: "card-back--moon-mountain",
  },
  {
    id: "moonlit-garden",
    title: "Nguyệt Viên",
    price: 280,
    previewClass: "card-back--moonlit-garden",
  },
  {
    id: "starlight-path",
    title: "Tinh Lộ",
    price: 300,
    previewClass: "card-back--starlight-path",
  },
  {
    id: "crystal-triad",
    title: "Tam Tinh",
    price: 320,
    previewClass: "card-back--crystal-triad",
  },
  {
    id: "lunar-pair",
    title: "Song Nguyệt",
    price: 340,
    previewClass: "card-back--lunar-pair",
  },
  {
    id: "azure-link",
    title: "Lam Tuyến",
    price: 360,
    previewClass: "card-back--azure-link",
  },
  {
    id: "crystal-trio-light",
    title: "Tam Quang",
    price: 380,
    previewClass: "card-back--crystal-trio-light",
  },
]);

export const FLIP_EFFECTS = Object.freeze([
  ...ACHIEVEMENT_ITEMS.filter(item => item.equipSlot === 'flipEffect').map(item => Object.freeze({ id: item.id, title: item.name,
    price: null, achievementOnly: true, gameId: item.gameId, animationClass: item.id === 'memory-effect-moonflip' ? 'appear-storybook-moon' : 'appear-storybook-petals' })),
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
  const achievements = normalizeAchievementLedger(value.achievements);
  const acquisitions = normalizeAcquisitions(value.acquisitions);
  value = { ...value };
  const linkPaths = LINK_PATH_EFFECTS.filter(item => !item.gameId || item.gameId === 'link-connect');
  const linkExits = LINK_EXIT_EFFECTS.filter(item => !item.gameId || item.gameId === 'link-connect');
  const triplePaths = LINK_PATH_EFFECTS.filter(item => !item.gameId || item.gameId === 'triple-connect');
  const tripleExits = LINK_EXIT_EFFECTS.filter(item => !item.gameId || item.gameId === 'triple-connect');
  const granted = new Set(Object.values(achievements.grants).filter(grant=>!grant.chestType).map(grant => grant.itemId));
  for (const slot of Object.values(ACHIEVEMENT_OWNED_SLOTS)) if (Array.isArray(value[slot]))
    value[slot] = value[slot].filter(id => !ACHIEVEMENT_ITEMS.some(item => item.id === id) || granted.has(id));
  for (const grant of Object.values(achievements.grants)) {
    const item = ACHIEVEMENT_ITEMS.find(item => item.id === grant.itemId);
    const slot = ACHIEVEMENT_OWNED_SLOTS[item.equipSlot];
    if (slot) value[slot] = [...new Set([...(Array.isArray(value[slot]) ? value[slot] : []), item.id])];
  }
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
  const ownedLinkPathEffects = ownedIds(
    linkPaths,
    value.ownedLinkPathEffects,
    DEFAULT_APPEARANCE.linkPathEffect,
  );
  const ownedLinkExitEffects = ownedIds(
    linkExits,
    value.ownedLinkExitEffects,
    DEFAULT_APPEARANCE.linkExitEffect,
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
  const linkPathEffect = knownId(linkPaths, value.linkPathEffect, DEFAULT_APPEARANCE.linkPathEffect);
  const linkExitEffect = knownId(linkExits, value.linkExitEffect, DEFAULT_APPEARANCE.linkExitEffect);
  const ownedThemes = normalizeOwnedThemes(value);
  const ownedTripleThemes = ownedIds(THEMES, value.ownedTripleThemes, "default");
  const themes = normalizeEquippedThemes(value, ownedThemes, ownedTripleThemes);
  const ownedTriplePathEffects = ownedIds(triplePaths, value.ownedTriplePathEffects, "default");
  const ownedTripleExitEffects = ownedIds(tripleExits, value.ownedTripleExitEffects, "default");
  const triplePathEffect = knownId(triplePaths, value.triplePathEffect, "default");
  const tripleExitEffect = knownId(tripleExits, value.tripleExitEffect, "default");
  return {
    achievements,
    acquisitions,
    rewards: normalizeRewardLedger(value.rewards),
    spark: normalizeSparkSave(value.spark),
    profileCosmetics: normalizeProfileCosmetics(value.profileCosmetics, achievements, acquisitions),
    cardBack: ownedCardBacks.includes(cardBack)
      ? cardBack
      : DEFAULT_APPEARANCE.cardBack,
    flipEffect: ownedFlipEffects.includes(flipEffect)
      ? flipEffect
      : DEFAULT_APPEARANCE.flipEffect,
    linkPathEffect: ownedLinkPathEffects.includes(linkPathEffect)
      ? linkPathEffect
      : DEFAULT_APPEARANCE.linkPathEffect,
    linkExitEffect: ownedLinkExitEffects.includes(linkExitEffect)
      ? linkExitEffect
      : DEFAULT_APPEARANCE.linkExitEffect,
    themes,
    ownedCardBacks,
    ownedFlipEffects,
    ownedLinkPathEffects,
    ownedLinkExitEffects,
    ownedThemes,
    ownedTripleThemes,
    triplePathEffect: ownedTriplePathEffects.includes(triplePathEffect) ? triplePathEffect : "default",
    tripleExitEffect: ownedTripleExitEffects.includes(tripleExitEffect) ? tripleExitEffect : "default",
    ownedTriplePathEffects,
    ownedTripleExitEffects,
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
  if (gameId === "triple-connect" || gameId === "tripleConnect") return appearance?.ownedTripleThemes || DEFAULT_APPEARANCE.ownedTripleThemes;
  return appearance?.ownedThemes || DEFAULT_APPEARANCE.ownedThemes;
}

export function ownTheme(appearance, gameId, themeId) {
  const requestedTheme = getUsableTheme(themeId).id;
  if (!THEMES.some((theme) => theme.id === requestedTheme)) return false;
  const ownedThemes = getOwnedThemeIds(appearance, gameId);
  if (ownedThemes.includes(requestedTheme)) return false;
  if (gameId === "triple-connect" || gameId === "tripleConnect") appearance.ownedTripleThemes = [...ownedThemes, requestedTheme];
  else appearance.ownedThemes = [...ownedThemes, requestedTheme];
  return true;
}

function normalizeOwnedThemes(value) {
  const savedThemes = Array.isArray(value.ownedThemes) ? value.ownedThemes : [];
  return ownedIds(
    THEMES,
    savedThemes,
    DEFAULT_APPEARANCE.ownedThemes[0],
  ).filter((id) => getTheme(id).id === id);
}

function normalizeEquippedThemes(value, ownedThemes, ownedTripleThemes) {
  const savedThemes = value.themes && typeof value.themes === "object" ? value.themes : {};
  return {
    memoryMatch: normalizeEquippedTheme(savedThemes.memoryMatch, ownedThemes, "memoryMatch"),
    linkConnect: normalizeEquippedTheme(savedThemes.linkConnect, ownedThemes, "linkConnect"),
    tripleConnect: normalizeEquippedTheme(savedThemes.tripleConnect, ownedTripleThemes, "tripleConnect"),
  };
}

function normalizeEquippedTheme(requestedTheme, ownedThemes, gameKey) {
  const themeId = getUsableTheme(requestedTheme).id;
  return ownedThemes.includes(themeId) ? themeId : DEFAULT_APPEARANCE.themes[gameKey];
}

function getThemeKey(gameId) {
  if (gameId === "link-connect" || gameId === "linkConnect") return "linkConnect";
  if (gameId === "triple-connect" || gameId === "tripleConnect") return "tripleConnect";
  return "memoryMatch";
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
