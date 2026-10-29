import { GAMEPLAY_LIMITS } from '../gameplayTuning.js';
import { getGameProgressKey } from '../gameCatalog.js';
import { CHEST_SUPPORTS } from './chestConfig.js';
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
/** Missing inventories on a fresh profile mean zero; malformed stored values never do. */
export function chestSupportCount(progress, gameId, key) {
  if (!CHEST_SUPPORTS[gameId]?.some(item => item.key === key)) throw new Error('Hỗ trợ không thuộc trò đã chọn.');
  const profile = progress[getGameProgressKey(gameId)];
  if (profile !== undefined && !record(profile) || profile?.items !== undefined && !record(profile.items)) throw new Error('Kho hỗ trợ chưa toàn vẹn.');
  const value = profile?.items?.[key];
  if (value === undefined) return 0;
  if (!Number.isSafeInteger(value) || value < 0 || value > GAMEPLAY_LIMITS.itemCount) throw new Error('Số lượng hỗ trợ chưa toàn vẹn.');
  return value;
}
export function creditChestSupport(progress, { gameId,key }) {
  const count = chestSupportCount(progress,gameId,key);
  if (count >= GAMEPLAY_LIMITS.itemCount) throw Object.assign(new Error('Kho hỗ trợ đã đầy. Rương được giữ để thử lại khi có chỗ.'), {code:'rewards/inventory-full'});
  const gameKey = getGameProgressKey(gameId), profile = progress[gameKey] || {};
  progress[gameKey] = { ...profile,items:{...profile.items,[key]:count+1} };
}
