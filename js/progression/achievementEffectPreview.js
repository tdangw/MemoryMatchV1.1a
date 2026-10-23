import { achievementItem, achievementAssetUrl } from './achievementModel.js';
import { getGameDefinition } from '../gameCatalog.js';
// Covers stay static; gameplay owns the corresponding motion.
export function decorateAchievementEffectPreview(preview, item) {
  const reward = achievementItem(item.id);
  if (!reward || reward.type !== 'effect-cover') return false;
  preview.className = 'achievement-effect-cover';
  const image = document.createElement('img'); image.src = achievementAssetUrl(reward, 128);
  image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
  const source = document.createElement('small'); source.className = 'achievement-effect-cover__source';
  source.textContent = `${getGameDefinition(reward.gameId).title} · Màn ${reward.level}`;
  preview.replaceChildren(image, source); return true;
}
