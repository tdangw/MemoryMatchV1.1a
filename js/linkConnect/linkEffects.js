const EFFECT_PRICE = 1;
import { ACHIEVEMENT_ITEMS } from '../progression/achievementCatalog.generated.js';
const achievementEffects = slot => ACHIEVEMENT_ITEMS.filter(item => slot.includes(item.equipSlot)).map(item =>
  Object.freeze({ id: item.id, title: item.name, icon: 'star', price: null, achievementOnly: true,
    gameId: item.gameId, className: `${item.equipSlot.endsWith('PathEffect') ? 'link-path-overlay' : 'link-tile'}--${item.id}` }));

function effect(id, title, icon, className, defaultOwned = false) {
  return Object.freeze({ id, title, icon, price: defaultOwned ? 0 : EFFECT_PRICE, className, defaultOwned });
}

// Bộ thử nghiệm giữ một effect mặc định miễn phí và 20 mẫu từ Visual FX Lab.
// Renderer có thể tối ưu/viết lại từng effect mà không đổi ID đã lưu.
export const LINK_PATH_EFFECTS = Object.freeze([
  effect("default", "Default", "wand", "link-path-overlay--default", true),
  effect("electric", "Electric", "wand", "link-path-overlay--electric"),
  effect("laser", "Laser", "star", "link-path-overlay--laser"),
  effect("fire", "Fire", "celebrate", "link-path-overlay--fire"),
  effect("magic", "Magic", "star", "link-path-overlay--magic"),
  effect("cyber", "Cyber", "terminal", "link-path-overlay--cyber"),
  effect("rainbow", "Rainbow", "celebrate", "link-path-overlay--rainbow"),
  effect("hydro", "Hydro", "celebrate", "link-path-overlay--hydro"),
  effect("plasma", "Plasma", "star", "link-path-overlay--plasma"),
  effect("holy", "Holy", "star", "link-path-overlay--holy"),
  effect("shadow", "Shadow", "moon", "link-path-overlay--shadow"),
  effect("spiral", "Spiral", "restart", "link-path-overlay--spiral"),
  effect("dashed", "Dashed", "more", "link-path-overlay--dashed"),
  effect("bullet", "Bullet", "arrow-right", "link-path-overlay--bullet"),
  effect("kame", "Kame", "play", "link-path-overlay--kame"),
  effect("halo", "Halo", "star", "link-path-overlay--halo"),
  effect("matrix", "Matrix", "terminal", "link-path-overlay--matrix"),
  effect("sonic", "Sonic", "music", "link-path-overlay--sonic"),
  effect("chains", "Chains", "link", "link-path-overlay--chains"),
  effect("meteor", "Meteor", "celebrate", "link-path-overlay--meteor"),
  effect("poison", "Poison", "leaf", "link-path-overlay--poison"),
  ...achievementEffects(['linkPathEffect', 'triplePathEffect']),
]);

export const LINK_EXIT_EFFECTS = Object.freeze([
  effect("default", "Default", "wand", "link-tile--default", true),
  effect("dissolve", "Dissolve", "wand", "link-tile--dissolve"),
  effect("finedust", "Fine Dust", "star", "link-tile--finedust"),
  effect("split4", "Split 4", "collection", "link-tile--split4"),
  effect("split2", "Split 2", "slash", "link-tile--split2"),
  effect("split8", "Split 8", "collection", "link-tile--split8"),
  effect("triangles", "Triangles", "play", "link-tile--triangles"),
  effect("crumble", "Crumble", "celebrate", "link-tile--crumble"),
  effect("gravity", "Gravity", "arrow-right", "link-tile--gravity"),
  effect("collide", "Collide", "celebrate", "link-tile--collide"),
  effect("portal", "Portal", "restart", "link-tile--portal"),
  effect("blackhole", "Black Hole", "moon", "link-tile--blackhole"),
  effect("freeze", "Freeze", "star", "link-tile--freeze"),
  effect("burn", "Burn", "celebrate", "link-tile--burn"),
  effect("pixel", "Pixel", "terminal", "link-tile--pixel"),
  effect("implode", "Implode", "play", "link-tile--implode"),
  effect("slice", "Slice", "slash", "link-tile--slice"),
  effect("bubble", "Bubble", "celebrate", "link-tile--bubble"),
  effect("origami", "Origami", "arrow-right", "link-tile--origami"),
  effect("electric-shock", "Electric Shock", "wand", "link-tile--electric-shock"),
  effect("ghost", "Ghost", "moon", "link-tile--ghost"),
  ...achievementEffects(['linkExitEffect', 'tripleExitEffect']),
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
