import { getModeLayout, getLevelTimeBonus, getLevelHintBonus, getPreviewDurationMs } from './config.js';
import { getLinkModeLayout, getLinkLevelTimeBonus, getLinkLevelHintBonus } from './linkConnect/linkConfig.js';
import { getTripleModeConfig, getTripleTrayCapacity } from './tripleConnect/tripleConfig.js';
import { isNormalAdventureMode, getChapterNumber } from './adventureProgress.js';

function check(mode, level) {
  if (!isNormalAdventureMode(mode)) throw new RangeError('Level previews require a normal difficulty.');
  getChapterNumber(level);
}
function hintCount(profile, mode, level, getBonus) {
  const current = profile.items.hint;
  return current + (profile.startedLevels[`${mode}:${level}`] ? 0 : getBonus(level, current));
}
// Read-only preview: the actual start transaction still owns all grants and persistence.
export function previewMemoryLevel(mode, level, profile) {
  check(mode, level);
  const layout = getModeLayout(mode);
  return { tileCount: layout.tileCount, target: `${layout.tileCount / 2} cặp · ${layout.tileCount} thẻ`, timeSeconds: layout.timeSeconds + getLevelTimeBonus(level), hints: hintCount(profile, mode, level, getLevelHintBonus), assistNote: `Xem trước ${getPreviewDurationMs(mode) / 1000} giây` };
}
export function previewLinkLevel(mode, level, profile) {
  check(mode, level);
  const layout = getLinkModeLayout(mode);
  return { tileCount: layout.tileCount, target: `${layout.tileCount / 2} cặp · ${layout.tileCount} thẻ`, timeSeconds: layout.timeSeconds + getLinkLevelTimeBonus(level), hints: hintCount(profile, mode, level, getLinkLevelHintBonus), assistNote: '' };
}
export function previewTripleLevel(mode, level, profile) {
  check(mode, level);
  const layout = getTripleModeConfig(mode);
  return { tileCount: layout.tileCount, target: `${layout.tileCount / 3} bộ ba · ${layout.tileCount} thẻ`, timeSeconds: layout.timeSeconds, hints: profile.items.hint, assistNote: `Khay ${getTripleTrayCapacity(profile.trayExpansionSlots)} ô` };
}
