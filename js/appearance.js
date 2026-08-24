const DEFAULT_APPEARANCE = Object.freeze({
  cardBack: "classic",
  flipEffect: "bounce",
  ownedCardBacks: ["classic"],
  ownedFlipEffects: ["bounce"],
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
  return {
    cardBack: ownedCardBacks.includes(cardBack)
      ? cardBack
      : DEFAULT_APPEARANCE.cardBack,
    flipEffect: ownedFlipEffects.includes(flipEffect)
      ? flipEffect
      : DEFAULT_APPEARANCE.flipEffect,
    ownedCardBacks,
    ownedFlipEffects,
  };
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
