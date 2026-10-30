import { GAMEPLAY_LIMITS } from '../gameplayTuning.js';
import { CHEST_TYPES, CHEST_POLICY, CHEST_POOLS, CHEST_VERSION, CHEST_SUPPORTS, FESTIVAL_MILESTONES } from './chestConfig.js';
const integer = value => Number.isSafeInteger(value) && value >= 0;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = () => { throw new Error('Bản lưu Kho rương chưa toàn vẹn. Dữ liệu được giữ nguyên.'); };
const counters = () => Object.fromEntries(CHEST_TYPES.map(type => [type,0]));
export function normalizeChests(value) {
  if (value === undefined) return { version:1, earned:counters(), spent:counters(), sourceEarned:counters(), sequence:0, last:null };
  if (!record(value) || value.version !== 1 || !integer(value.sequence) || !record(value.earned) || !record(value.spent)
    || Object.keys(value.earned).length !== 4 || Object.keys(value.spent).length !== 4
    || CHEST_TYPES.some(type => !integer(value.earned[type]) || !integer(value.spent[type]) || value.spent[type] > value.earned[type])
    || value.sequence !== CHEST_TYPES.reduce((sum,type) => sum + value.spent[type],0)) invalid();
  if (value.last !== null) {
    const last = value.last;
    if (!record(last) || last.sequence !== value.sequence || typeof last.operation !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(last.operation)
      || !CHEST_TYPES.includes(last.chestType) || !['coins','item','support'].includes(last.kind) || last.poolVersion !== CHEST_VERSION || !CHEST_SUPPORTS[last.gameId]
      || !integer(last.coins)) invalid();
    if (last.kind === 'item' && !CHEST_POOLS[last.chestType]?.includes(last.itemId)) invalid();
    if (last.kind === 'support' && !CHEST_SUPPORTS[last.gameId].some(item => item.key === last.key && item.label === last.label)) invalid();
    if (last.kind !== 'coins' && last.coins !== 0) invalid();
    if (last.kind === 'coins' && (last.reason === 'coins' ? last.coins !== CHEST_POLICY[last.chestType].coins
      : !['duplicate','full','overflow'].includes(last.reason) || (last.reason === 'overflow' ? last.coins !== GAMEPLAY_LIMITS.itemOverflowCoins : !CHEST_POLICY[last.chestType].duplicate || ![CHEST_POLICY[last.chestType].duplicate, last.chestType === 'avatar' ? 300 : 200].includes(last.coins)))) invalid();
  } else if (value.sequence !== 0) invalid();
  const sourceEarned = value.sourceEarned === undefined ? counters() : value.sourceEarned;
  if (!record(sourceEarned) || Object.keys(sourceEarned).length !== 4 || CHEST_TYPES.some(type => !integer(sourceEarned[type]) || sourceEarned[type] > value.earned[type])) invalid();
  return { ...structuredClone(value),sourceEarned:{...sourceEarned} };
}
export function creditSourceChests(value, incoming) {
  let chests = normalizeChests(value);
  if (!record(incoming) || Object.keys(incoming).length !== 4) invalid();
  for (const type of CHEST_TYPES) {
    if (!integer(incoming[type]) || incoming[type] < chests.sourceEarned[type]) invalid();
    const delta = incoming[type] - chests.sourceEarned[type];
    if (delta) { chests = earnChest(chests,type,delta); chests.sourceEarned[type] = incoming[type]; }
  }
  return normalizeChests(chests);
}
export function normalizeFestival(value) {
  if (value === undefined) return { version:1, earnedTotal:0, completedCycles:0, mask:0 };
  if (!record(value) || value.version !== 1 || !integer(value.earnedTotal) || !integer(value.completedCycles)
    || !Number.isInteger(value.mask) || value.mask < 0 || value.mask > 14 || value.earnedTotal < value.completedCycles * 100) invalid();
  const available = value.earnedTotal - value.completedCycles * 100;
  if (FESTIVAL_MILESTONES.some((item,index) => (value.mask & (1 << index)) && available < item.points)) invalid();
  return structuredClone(value);
}
export function earnChest(value, type, quantity = 1) {
  const chests = normalizeChests(value);
  if (!CHEST_TYPES.includes(type) || !integer(quantity) || quantity < 1) invalid();
  chests.earned[type] += quantity; return normalizeChests(chests);
}
export function claimFestival(festivalValue, chestValue, command) {
  const festival = normalizeFestival(festivalValue); let chests = normalizeChests(chestValue);
  if (!integer(command.cycle) || command.cycle > festival.completedCycles) invalid();
  const index = FESTIVAL_MILESTONES.findIndex(item => item.points === command.points);
  if (index < 0) invalid();
  const milestone = FESTIVAL_MILESTONES[index];
  if (command.cycle < festival.completedCycles || festival.mask & (1 << index)) return { festival,chests,coins:0 };
  if (festival.earnedTotal - festival.completedCycles * 100 < milestone.points) throw new Error('Chưa đủ huy hiệu để nhận quà.');
  festival.mask |= 1 << index;
  if (milestone.chest) chests = earnChest(chests,milestone.chest);
  if (festival.mask === 15) { festival.completedCycles++; festival.mask = 0; }
  return { festival:normalizeFestival(festival), chests, coins:milestone.coins };
}
/** Called once outside a retriable transaction. The caller durably saves this candidate. */
export function chestCandidate(type, gameId, ownedIds, random) {
  const policy = CHEST_POLICY[type], pool = CHEST_POOLS[type], owned = new Set(ownedIds);
  if (!policy || !CHEST_SUPPORTS[gameId]) invalid();
  const base = { chestType:type, gameId, poolVersion:CHEST_VERSION };
  const unowned = pool?.filter(id => !owned.has(id));
  if (unowned?.length === 0) return { ...base, kind:'coins', coins:policy.duplicate, reason:'full' };
  const sample = () => { const n = random(); if (!(n >= 0 && n < 1)) invalid(); return n; };
  const category = sample();
  if (category < policy.coinChance) return { ...base, kind:'coins', coins:policy.coins, reason:'coins' };
  if (category < policy.coinChance + policy.supportChance) {
    const support = CHEST_SUPPORTS[gameId][Math.floor(sample() * CHEST_SUPPORTS[gameId].length)];
    return { ...base, kind:'support', coins:0, ...support };
  }
  return { ...base, kind:'item', coins:0, itemId:unowned[Math.floor(sample() * unowned.length)] };
}
export function openChest(value, command, ownedIds, supportCount) {
  const chests = normalizeChests(value), candidate = command.candidate;
  if (chests.last?.operation === command.operation) return { chests,result:chests.last,applied:false };
  if (!candidate || candidate.chestType !== command.chestType || candidate.gameId !== command.gameId || candidate.poolVersion !== CHEST_VERSION
    || command.sequence !== chests.sequence + 1 || !CHEST_TYPES.includes(command.chestType)
    || chests.earned[command.chestType] <= chests.spent[command.chestType]) invalid();
  if (candidate.kind === 'item' && !CHEST_POOLS[command.chestType]?.includes(candidate.itemId)) invalid();
  let result = { ...candidate, operation:command.operation, sequence:command.sequence };
  // A queued, uncommitted conversion uses today's approved value; replayed receipts returned above retain their original grant.
  if (candidate.kind === 'coins' && ['duplicate','full'].includes(candidate.reason)) result = { ...result, coins:CHEST_POLICY[command.chestType].duplicate };
  // Ownership is canonical at commit. A concurrently acquired item becomes duplicate Xu.
  if (candidate.kind === 'item' && ownedIds.includes(candidate.itemId)) result = { ...result,kind:'coins',coins:CHEST_POLICY[command.chestType].duplicate,reason:'duplicate' };
  if (candidate.kind === 'support') {
    if (!integer(supportCount) || supportCount > GAMEPLAY_LIMITS.itemCount) invalid();
    if (supportCount === GAMEPLAY_LIMITS.itemCount) result = { ...result, kind:'coins', coins:GAMEPLAY_LIMITS.itemOverflowCoins, reason:'overflow' };
  }
  chests.spent[command.chestType]++; chests.sequence++; chests.last = result;
  return { chests:normalizeChests(chests), result, applied:true };
}
