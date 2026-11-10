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
    if (!record(item) || !ownerPattern.test(item.uid) || !record(item.fact)
      || item.profileId !== undefined && (typeof item.profileId !== 'string' || !ownerPattern.test(item.profileId))) throw new Error('Invalid pending reward fact');
    else normalizeFact(item.fact);
  if(value.overflow!==undefined){
    if(!record(value.overflow)||Object.keys(value.overflow).some(k=>!['dated','undated'].includes(k)))throw new Error('Invalid overflow reward batches');
    for(const [key,item]of Object.entries(value.overflow)){
      if(!record(item)||!ownerPattern.test(item.uid)||!ownerPattern.test(item.profileId)||item.fact?.version!==3||(key==='undated')!==(item.fact.day===null))throw new Error('Invalid overflow reward batch');
      normalizeFact(item.fact);
    }
  }
  return structuredClone(value);
}
export function mergeRewardLedger(before, incoming) {
  const a = normalizeRewardLedger(before), b = normalizeRewardLedger(incoming);
  for (const [uid, seq] of Object.entries(a.applied)) b.applied[uid] = Math.max(seq, b.applied[uid] || 0);
  // Only settlement/binding/acknowledgment in the device writer edits this list.
  // Appearance snapshots cannot add back an acknowledged round or change its day.
  // Verified restores use the import boundary rather than this stale-view merge.
  return { version: 1, applied: b.applied, pending:a.pending,...(a.overflow?{overflow:a.overflow}:{}) };
}
/** Only the device writer edits the overflow batch. It is never sent or mutated
 * in flight; binding moves it into the immutable pending list when space exists. */
export function appendRewardFact(ledger,item){
  if(ledger.pending.length<MAX_PENDING_REWARD_ROUNDS){ledger.pending.push(item);return;}
  const key=item.fact.day===null?'undated':'dated',prior=ledger.overflow?.[key];
  if(prior&&(prior.uid!==item.uid||prior.profileId!==item.profileId))throw new Error('Reward batch owner changed');
  // Only the latest already-known day can still qualify when a later known day
  // exists. Older periods never receive backfill; undated rounds remain separate.
  if(key==='dated'&&prior&&prior.fact.day>item.fact.day)return;
  const old=prior?.fact.day===item.fact.day?prior.fact:null,cap=n=>Math.min(1000000,n);
  ledger.overflow={...ledger.overflow,[key]:{uid:item.uid,profileId:item.profileId,fact:{...item.fact,version:3,roundId:old?.roundId||crypto.randomUUID(),
    matches:cap((old?.matches||0)+item.fact.matches),wins:cap((old?.wins||0)+1),noHintWins:cap((old?.noHintWins||0)+Number(item.fact.noHint)),
    points:cap((old?.points||0)+(({easy:5,normal:7,hard:9,superHard:12})[item.fact.mode]||5))}}};
}
export function validateRewardReceipt(receipt, uid) {
  if (!record(receipt) || receipt.ownerUid !== uid || !ownerPattern.test(uid)
    || typeof receipt.receiptId !== 'string' || !receipt.receiptId.startsWith(`${uid}:`)
    || !Number.isSafeInteger(receipt.sequence) || receipt.sequence < 1
    || receipt.configVersion !== 1 || !Number.isSafeInteger(receipt.coins) || receipt.coins < 0 || receipt.coins > 50
    || !Number.isSafeInteger(receipt.grantedAt) || receipt.grantedAt < 0) throw new Error('Invalid reward receipt');
  return receipt;
}
