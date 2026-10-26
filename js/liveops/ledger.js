import { normalizeFact } from './model.js';
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const ownerPattern = /^[A-Za-z0-9_-]{1,128}$/;
export const MAX_PENDING_REWARD_ROUNDS = 4096;
export function normalizeRewardLedger(value) {
  if (value === undefined) return { version: 1, applied: {}, pending: [] };
  if (!record(value) || value.version !== 1 || !record(value.applied) || !Array.isArray(value.pending)
    || value.pending.length > MAX_PENDING_REWARD_ROUNDS) throw new Error('Bản lưu thưởng chưa toàn vẹn. Dữ liệu được giữ nguyên.');
  for (const [uid, seq] of Object.entries(value.applied))
    if (!ownerPattern.test(uid) || !Number.isSafeInteger(seq) || seq < 0) throw new Error('Invalid applied reward sequence');
  for (const item of value.pending)
    if (!record(item) || !ownerPattern.test(item.uid) || !record(item.fact)) throw new Error('Invalid pending reward fact');
    else normalizeFact(item.fact);
  return structuredClone(value);
}
export function mergeRewardLedger(before, incoming) {
  const a = normalizeRewardLedger(before), b = normalizeRewardLedger(incoming);
  for (const [uid, seq] of Object.entries(a.applied)) b.applied[uid] = Math.max(seq, b.applied[uid] || 0);
  // Pending removal is explicit in the persistence queue, never via a stale appearance.
  const facts = new Map([...a.pending, ...b.pending].map(item => [`${item.uid}:${item.fact.gameId}:${item.fact.roundId}`, item]));
  if (facts.size > MAX_PENDING_REWARD_ROUNDS) throw new Error('Reward upload queue is full');
  return { version: 1, applied: b.applied, pending: [...facts.values()] };
}
export function validateRewardReceipt(receipt, uid) {
  if (!record(receipt) || receipt.ownerUid !== uid || !ownerPattern.test(uid)
    || typeof receipt.receiptId !== 'string' || !receipt.receiptId.startsWith(`${uid}:`)
    || !Number.isSafeInteger(receipt.sequence) || receipt.sequence < 1
    || receipt.configVersion !== 1 || !Number.isSafeInteger(receipt.coins) || receipt.coins < 0 || receipt.coins > 50
    || !Number.isSafeInteger(receipt.grantedAt) || receipt.grantedAt < 0) throw new Error('Invalid reward receipt');
  return receipt;
}
