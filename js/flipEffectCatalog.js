import { ACHIEVEMENT_ITEMS } from './progression/achievementCatalog.generated.js';

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
