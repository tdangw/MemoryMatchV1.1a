import { festivalChestsEnabled } from '../liveops/availability.js';
import { LETTER_REWARD_ITEMS } from '../liveops/letterCatalog.generated.js';
import { mergeSparkSave } from '../liveops/sparkModel.js';
import { ACHIEVEMENT_ITEMS, EXTRA_COSMETIC_ITEMS } from './achievementCatalog.generated.js';
import { mergeAcquisitions, extraOwnedIds } from './acquisitionModel.js';
import { mergeRewardLedger } from '../liveops/ledger.js';
import { MASTERY_DIFFICULTIES, hasCertifiedCompletion } from './difficultyProgress.js';
import { isCompletedLevelResult } from '../adventureProgress.js';
export { ACHIEVEMENT_ITEMS };
export const PROFILE_COSMETIC_ITEMS = Object.freeze([
  ...EXTRA_COSMETIC_ITEMS.filter(item => item.sourceKind === 'starter'),
  ...ACHIEVEMENT_ITEMS.filter(item => item.type !== 'effect-cover'),
  ...EXTRA_COSMETIC_ITEMS.filter(item => item.sourceKind !== 'starter'),
  ...LETTER_REWARD_ITEMS,
]);
export const ACHIEVEMENT_COVERAGE_REVISION = 2;
export const cosmeticItem = id => PROFILE_COSMETIC_ITEMS.find(item => item.id === id) || null;
export const ACHIEVEMENT_GAME_KEYS = Object.freeze({ 'memory-match': 'memoryMatch', 'link-connect': 'linkConnect', 'triple-connect': 'tripleConnect' });
export const ACHIEVEMENT_OWNED_SLOTS = Object.freeze({ flipEffect: 'ownedFlipEffects', linkPathEffect: 'ownedLinkPathEffects', linkExitEffect: 'ownedLinkExitEffects', triplePathEffect: 'ownedTriplePathEffects', tripleExitEffect: 'ownedTripleExitEffects' });
const catalog = new Map(ACHIEVEMENT_ITEMS.map(item => [item.id, item]));
const byLevel = new Map(ACHIEVEMENT_ITEMS.map(item => [`${item.gameId}:${item.level}`, item]));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const achievementItem = id => catalog.get(id) || null;
export const achievementAt = (gameId, level) => byLevel.get(`${gameId}:${level}`) || null;
export function normalizeAchievementLedger(value) {
  if (value === undefined) return { version: 1, grants: {}, hintsSeen: {}, backfillVersion: 0, coverageRevision: 0 };
  if (!object(value) || value.version !== 1 || !object(value.grants)) throw new Error('Bản lưu Thành tích chưa được hỗ trợ. Dữ liệu được giữ nguyên.');
  const grants = {};
  for (const [key, grant] of Object.entries(value.grants)) {
    const item = byLevel.get(key);
    if (!item || !object(grant) || grant.itemId !== item.id || grant.catalogVersion !== 1
      || !Number.isSafeInteger(grant.grantedAt) || grant.grantedAt < 0 || typeof grant.announced !== 'boolean' || grant.chestType!==undefined&&(!['avatar','frame','badge'].includes(item.type)||grant.chestType!==item.type))
      throw new Error('Bản lưu Thành tích chưa toàn vẹn. Dữ liệu được giữ nguyên.');
    grants[key] = { itemId: item.id, catalogVersion: 1, grantedAt: grant.grantedAt, announced: grant.announced, ...(grant.chestType?{chestType:grant.chestType}:{}) };
  }
  const hintsSeen = Object.fromEntries(['avatar', 'frame', 'badge', 'effect-cover'].filter(type => value.hintsSeen?.[type] === true).map(type => [type, true]));
  const coverageRevision = value.coverageRevision ?? (value.backfillVersion === 1 ? 1 : 0);
  if (!Number.isSafeInteger(coverageRevision) || coverageRevision < 0 || coverageRevision > ACHIEVEMENT_COVERAGE_REVISION)
    throw new Error('Phạm vi Thành tích chưa được hỗ trợ. Dữ liệu được giữ nguyên.');
  return { version: 1, grants, hintsSeen, backfillVersion: value.backfillVersion === 1 ? 1 : 0, coverageRevision };
}
export function ownedAchievementItems(appearance) {
  return Object.values(normalizeAchievementLedger(appearance?.achievements).grants).filter(grant=>!grant.chestType).map(grant => catalog.get(grant.itemId));
}
export function ownedProfileCosmeticItems(appearance) {
  const owned = new Set([...ownedAchievementItems(appearance).map(item => item.id), ...extraOwnedIds(appearance?.acquisitions)]);
  return PROFILE_COSMETIC_ITEMS.filter(item => owned.has(item.id));
}
export function normalizeProfileCosmetics(value, ledger, acquisitions) {
  const owned = new Set([...Object.values(ledger.grants).filter(grant=>!grant.chestType).map(grant => grant.itemId), ...extraOwnedIds(acquisitions)]);
  return Object.fromEntries(['avatar', 'frame', 'badge'].map(slot => {
    const id = value?.[slot], item = cosmeticItem(id);
    return [slot, item?.type === slot && owned.has(id) ? id : null];
  }));
}
/** Pure settlement projection. Receipts, inventory and announcements share one payload. */
export function settleAchievementInventory(previous = {}, incoming = previous, progress = {}, { backfill = false, now = Date.now(), chestRewards=festivalChestsEnabled() } = {}) {
  const before = normalizeAchievementLedger(previous.achievements), next = normalizeAchievementLedger(incoming.achievements);
  const grants = { ...before.grants, ...next.grants };
  // A stale queued appearance must not un-announce a durable receipt.
  for(const [key,grant]of Object.entries(before.grants))if(next.grants[key]&&next.grants[key].chestType!==grant.chestType)throw new Error('Quyền thưởng Thành tích đã được lưu và không thể đổi loại.');
  for (const [key, grant] of Object.entries(before.grants)) if (grant.announced) grants[key] = { ...grants[key], announced: true };
  const ledger = { version: 1, grants, hintsSeen: { ...before.hintsSeen, ...next.hintsSeen }, backfillVersion: backfill || before.backfillVersion || next.backfillVersion ? 1 : 0,
    coverageRevision: backfill ? ACHIEVEMENT_COVERAGE_REVISION : Math.max(before.coverageRevision, next.coverageRevision) };
  for (const item of ACHIEVEMENT_ITEMS) {
    const key = `${item.gameId}:${item.level}`;
    if (grants[key]) continue;
    const completed = progress[ACHIEVEMENT_GAME_KEYS[item.gameId]]?.bestByLevel || {};
    if (MASTERY_DIFFICULTIES.every(mode => isCompletedLevelResult(completed[`${mode}:${item.level}`]) && hasCertifiedCompletion(completed, mode, item.level)))
      grants[key] = { itemId: item.id, catalogVersion: 1, grantedAt: now, announced: backfill, ...(chestRewards&&['avatar','frame','badge'].includes(item.type)?{chestType:item.type}:{}) };
  }
  const appearance = { ...incoming, achievements: ledger, acquisitions: mergeAcquisitions(previous.acquisitions, incoming.acquisitions) };
  appearance.spark = mergeSparkSave(previous.spark, incoming.spark);
  appearance.rewards = mergeRewardLedger(previous.rewards, incoming.rewards);
  for (const grant of Object.values(grants)) {
    const item = catalog.get(grant.itemId), ownedSlot = ACHIEVEMENT_OWNED_SLOTS[item.equipSlot];
    if (ownedSlot) appearance[ownedSlot] = [...new Set([...(appearance[ownedSlot] || []), item.id])];
  }
  appearance.profileCosmetics = normalizeProfileCosmetics(incoming.profileCosmetics, ledger, appearance.acquisitions);
  return appearance;
}
export function pendingAchievements(appearance, gameId = null, level = null) {
  const ledger = normalizeAchievementLedger(appearance?.achievements);
  return Object.entries(ledger.grants).filter(([, grant]) => !grant.announced).map(([key, grant]) => ({ ...catalog.get(grant.itemId), key, grant }))
    .filter(item => (!gameId || item.gameId === gameId) && (level === null || item.level === level));
}
export const achievementAssetUrl = (item, size = 256) => `${import.meta.env?.BASE_URL || '/'}${item.files[size]}`;
