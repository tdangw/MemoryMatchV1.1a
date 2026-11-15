import { getModeLayout, getChallengeLayout, getLevelTimeBonus, getLevelHintBonus, getPreviewDurationMs } from './config.js';
import { getLinkModeLayout, getLinkChallengeLayout, getLinkChallengeTime, getLinkLevelTimeBonus, getLinkLevelHintBonus } from './linkConnect/linkConfig.js';
import { getTripleModeConfig, getTripleChallengeStage, getTripleTrayCapacity } from './tripleConnect/tripleConfig.js';
import { getChapterNumber } from './adventureProgress.js';
import { getGameMode } from './gameCatalog.js';
import { calculateWaveTime, getLevelWaveCount, getProgressionStarTargets } from './progression/gameplayRules.js';

function wavePreview(gameId, mode, level, groupSize, preview) {
  const waves = getLevelWaveCount(level);
  return { ...preview, timeSeconds: calculateWaveTime({ gameId, mode, totalGroups: preview.tileCount / groupSize }),
    threeStarScore: getProgressionStarTargets({ gameId, totalGroups: preview.tileCount / groupSize * waves, mode }).three,
    waves, target: `${preview.target} × ${waves} đợt` };
}

function check(mode, level) {
  if (!getGameMode(mode)) throw new RangeError('Unknown preview mode.');
  getChapterNumber(level);
}
function hintCount(profile, mode, level, getBonus) {
  const current = profile.items.hint;
  return current + (profile.startedLevels[`${mode}:${level}`] ? 0 : getBonus(level, current));
}
// Read-only preview: the actual start transaction still owns all grants and persistence.
function memoryPreview(mode, level, profile) {
  check(mode, level);
  const modeLayout = getModeLayout(mode);
  const layout = mode === 'challenge' ? getChallengeLayout(level) : modeLayout;
  const timeSeconds = mode === 'endless' ? 0 : mode === 'challenge' ? modeLayout.timeSeconds : modeLayout.timeSeconds + getLevelTimeBonus(level);
  return { tileCount: layout.tileCount, target: `${layout.tileCount / 2} cặp · ${layout.tileCount} thẻ`, timeSeconds, hints: hintCount(profile, mode, level, getLevelHintBonus), assistNote: `Xem trước ${getPreviewDurationMs(mode) / 1000} giây`, ...(mode === 'endless' ? { goal: 'Ghi nhớ vị trí và ghép hết các cặp thẻ để sang màn tiếp theo.' } : {}) };
}
function linkPreview(mode, level, profile) {
  check(mode, level);
  const modeLayout = getLinkModeLayout(mode);
  const layout = mode === 'challenge' ? getLinkChallengeLayout(level) : modeLayout;
  const timeSeconds = mode === 'endless' ? 0 : mode === 'challenge' ? getLinkChallengeTime(level) : modeLayout.timeSeconds + getLinkLevelTimeBonus(level);
  return { tileCount: layout.tileCount, target: `${layout.tileCount / 2} cặp · ${layout.tileCount} thẻ`, timeSeconds, hints: hintCount(profile, mode, level, getLinkLevelHintBonus), assistNote: '', ...(mode === 'endless' ? { goal: 'Tìm đường nối và ghép hết các cặp thẻ để sang màn tiếp theo.' } : {}) };
}
function triplePreview(mode, level, profile) {
  check(mode, level);
  const layout = mode === 'challenge' ? getTripleChallengeStage(level) : getTripleModeConfig(mode);
  return { tileCount: layout.tileCount, target: `${layout.tileCount / 3} bộ ba · ${layout.tileCount} thẻ`, timeSeconds: layout.timeSeconds, hints: profile.items.hint, assistNote: `Khay ${getTripleTrayCapacity(profile.trayExpansionSlots)} ô`, ...(mode === 'endless' ? { goal: 'Ghép hết các bộ ba để sang màn tiếp theo. Đừng để khay đầy!' } : {}) };
}
export function previewMemoryLevel(mode, level, profile) { return wavePreview('memory-match', mode, level, 2, memoryPreview(mode, level, profile)); }
export function previewLinkLevel(mode, level, profile) { return wavePreview('link-connect', mode, level, 2, linkPreview(mode, level, profile)); }
export function previewTripleLevel(mode, level, profile) { return wavePreview('triple-connect', mode, level, 3, triplePreview(mode, level, profile)); }

