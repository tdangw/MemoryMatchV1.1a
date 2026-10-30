import { publishRewardPeriod } from './rewardPeriodViewState.js';
import { hourlyGiftCandidate } from './hourlyGift.js';
import { committedRewardsForTransition, mergeCommittedRewards } from './rewardFeedbackModel.js';
import { CHEST_TYPES, CHEST_VERSION } from './chestConfig.js';
import { chestCandidate } from './chests.js';
import { festivalChestsEnabled } from './availability.js';
import { ownedProfileCosmeticItems } from '../progression/achievementModel.js';
import { chestSupportCount, creditChestSupport } from './supportInventory.js';
import { LETTER_ALPHABET, LETTER_SYNC_KEYS_PER_COMMIT } from './config.js';
import { subscribeToAppPages } from '../appPageLifecycle.js';
import { getFirebaseBackend } from '../firebaseBackend.js';
import { getAccountService } from '../accountService.js';
import { commitSparkOperation, loadPersistentGameData, loadSyncMetadata, saveSyncMetadata, updateSyncMetadata } from '../persistence.js';
import { getActiveGameScope, createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { liveopsEnabled } from './availability.js';
import { DAY_MS } from './model.js';
import { normalizeSparkSave, transitionSpark, secureSector, secureUnit, resolveSparkOperation } from './sparkModel.js';
import { confirmSparkClock, readSparkState } from './store.js';
import { publishCloudSnapshot, CloudConflictError } from '../cloudStore.js';
import { encodeCloudSnapshot, stableJSON } from '../cloudSnapshot.js';
import { normalizeAcquisitions } from '../progression/acquisitionModel.js';
let running = null, clock = null, binding = null, statusTask = null;
function updateClock(value) { clock = value; publishRewardPeriod(); }
const pendingKey = identity => `sparkPending:${identity.environment}:${identity.uid}:${identity.profileId}`;
export function bindLiveopsAccount(account) {
  binding?.dispose(); updateClock(null);
  if (!liveopsEnabled()) { binding = null; return () => {}; }
  const scope = createGameShellLifecycle(); binding = scope; let bound = null;
  const recover = () => void requestLiveops().catch(error => console.info('Rewards await connection', error.code || error.name));
  scope.own(account.subscribe(state => {
    const identity = account.getIdentity(), key = identity ? `${identity.uid}:${identity.profileId}` : null;
    if (!key) { bound = null; updateClock(null); return; }
    if (state.conflict || ['connecting','restoring','syncing'].includes(state.phase)) return;
    if (key !== bound) { bound = key; recover(); }
  }));
  scope.own(subscribeToAppPages(() => {
    if(getActiveGameScope())return;
    const identity=account.getIdentity();if(!identity)return;
    void loadPersistentGameData().then(data=>{
      if(!scope.active||account.getIdentity()?.profileId!==identity.profileId||getActiveGameScope())return;
      const save=normalizeSparkSave(data.appearance.spark),state=save.state;
      const dirty=(data.appearance.rewards?.pending||[]).some(item=>item.uid===identity.uid)
        || festivalChestsEnabled() && CHEST_TYPES.some(type=>Object.values(data.appearance.achievements?.grants||{}).filter(grant=>grant.chestType===type).length!==(state?.chests?.sourceEarned?.[type]||0))
        || festivalChestsEnabled() && save.fireflyEarned!==(state?.festival?.earnedTotal||0)
        || save.ticketEarned!==(state?.ticketEarned||0)
        || LETTER_ALPHABET.some(letter=>(save.letterEarned[letter]||0)!==(state?.letters.earned[letter]||0));
      if(dirty)recover();
    }).catch(error=>console.info('Reward progress awaits recovery',error.code||error.name));
  }));
  let clockRefresh=null;
  scope.listen(document,'visibilitychange',()=>{
    const identity=account.getIdentity();
    if(document.hidden||!navigator.onLine||!identity||clockNow(identity)!==null||clockRefresh)return;
    const owns=()=>scope.active&&account.getIdentity()?.uid===identity.uid&&account.getIdentity()?.profileId===identity.profileId;
    clockRefresh=(async()=>{
      const backend=await getFirebaseBackend();if(!backend||!owns())return;
      const confirmed=await confirmSparkClock(backend.database,identity.environment,identity.uid,owns);
      if(owns())updateClock({uid:identity.uid,profileId:identity.profileId,now:confirmed.timestamp,observedAt:performance.now(),observedWall:Date.now()});
    })().catch(error=>console.info('Reward clock awaits connection',error.code||error.name)).finally(()=>{clockRefresh=null;});
  });
  scope.listen(window, 'online', () => { updateClock(null); recover(); });
  return () => { scope.dispose(); if (binding === scope) { binding = null; updateClock(null); } };
}
function clockNow(identity) {
  if(clock&&Math.abs((Date.now()-clock.observedWall)-(performance.now()-clock.observedAt))>2000)return null;
  return clock && clock.uid === identity.uid && clock.profileId === identity.profileId
    ? Math.floor(clock.now + performance.now() - clock.observedAt) : null;
}
export function trustedRewardPeriod() {
  const identity = getAccountService()?.getIdentity();
  if (!identity) return null;
  const now = clockNow(identity);
  return now === null ? null : { uid: identity.uid, day: Math.floor(now / DAY_MS) };
}
export function requestLiveops(command = { type: 'status' }) {
  if (!liveopsEnabled()) return Promise.reject(Object.assign(new Error('Nhiệm vụ và vòng quay sắp mở.'), { code: 'rewards/not-enabled' }));
  const captured = getAccountService()?.getIdentity();
  if(!captured)return Promise.reject(new Error('Kết nối tài khoản để nhận thưởng.'));
  const ownerKey = captured ? `${captured.uid}:${captured.profileId}` : null;
  if(command.type==='status' && statusTask?.ownerKey === ownerKey)return statusTask.task;
  const action = structuredClone(command);
  const previous = running || Promise.resolve();
  const task = previous.catch(() => {}).then(() => perform(action,0,captured));
  if(action.type==='status')statusTask={ownerKey,task};
  running = task;
  void task.finally(() => { if (running === task) running = null; if(statusTask?.task===task)statusTask=null; }).catch(() => {});
  return task;
}
async function perform(command, pass = 0, expected = null, totals = {reads:0,writes:0,bytes:0,coins:0}, committedRewards = []) {
  if(pass > 4 + Math.ceil(LETTER_ALPHABET.length / LETTER_SYNC_KEYS_PER_COMMIT)) throw new Error('Hãy tải lại tiến độ để hoàn tất đồng bộ.');
  const account = getAccountService(), initial = account?.getIdentity();
  if(expected && (initial?.uid!==expected.uid || initial?.profileId!==expected.profileId))throw new Error('Tài khoản đã thay đổi.');
  if (!initial || !navigator.onLine || getActiveGameScope()) throw new Error('Kết nối tài khoản để nhận thưởng.');
  const key = pendingKey(initial);
  let operation = await loadSyncMetadata(key);
  if(operation?.type==='openChest' && operation.candidate && operation.candidate.poolVersion!==CHEST_VERSION)throw Object.assign(new Error('Quà đang chờ thuộc phiên bản mới hơn. Hãy cập nhật ứng dụng; rương và quà được giữ nguyên.'),{code:'rewards/unsupported-candidate'});
  const savedAd = await loadSyncMetadata(`rewardedPending:${initial.uid}`);
  if (!operation && savedAd?.earned && savedAd.profileId === initial.profileId) operation = savedAd;
  // A pending spin is resolved before accepting the next command. Status is the recovery entry point.
  if (!operation && command.type !== 'status' && command.type !== 'prepareAd') {
    operation = { ...command, ...(command.type === 'claimHourlyGift' ? {candidate:hourlyGiftCandidate(secureUnit)} : {}), operation: crypto.randomUUID(), sector: secureSector(), randomLetter:LETTER_ALPHABET[Math.floor(secureUnit()*LETTER_ALPHABET.length)] };
    await saveSyncMetadata(key, operation, () => account.getIdentity()?.profileId === initial.profileId);
  }
  let result;
  try { result = await account.runRewardOperation(async ({ backend, identity, metadata, isCurrent, cleanupOperations }) => {
    totals.reads+=cleanupOperations.reads;totals.writes+=cleanupOperations.writes;
    if (identity.uid !== initial.uid || identity.profileId !== initial.profileId) throw new Error('Tài khoản đã thay đổi.');
    let stored;
    if (clockNow(identity) === null) {
      stored = await confirmSparkClock(backend.database, identity.environment, identity.uid, isCurrent);
      totals.reads+=stored.operations.reads;totals.writes+=stored.operations.writes;
      updateClock({ uid: identity.uid, profileId: identity.profileId, now: stored.timestamp, observedAt: performance.now(), observedWall:Date.now() });
    } else {stored = await readSparkState(backend.database, identity.environment, identity.uid);totals.reads++;}
    const now = clockNow(identity);
    if (now === null || !Number.isSafeInteger(now)) throw new Error('Chưa xác nhận được thời gian.');
    return commitSparkOperation(async snapshot => {
      const data = snapshot.profile.data, local = normalizeSparkSave(data.appearance.spark);
      if (local.ownerUid && local.ownerUid !== identity.uid) throw new Error('Hãy khôi phục bản lưu của tài khoản đang dùng.');
      const remoteRevision = stored.state?.revision || 0;
      if ((local.state?.revision || 0) !== remoteRevision) throw new CloudConflictError(await importRoot(backend, identity));
      const initializing = !stored.state;
      const pending = data.appearance.rewards?.pending || [];
      const periodOnly = Boolean(stored.state && stored.state.day !== Math.floor(now / DAY_MS));
      const sourceCounts=Object.fromEntries(CHEST_TYPES.map(type=>[type,Object.values(data.appearance.achievements?.grants||{}).filter(grant=>grant.chestType===type).length]));
      const newSources=festivalChestsEnabled()&&CHEST_TYPES.some(type=>sourceCounts[type] !== (stored.state?.chests?.sourceEarned?.[type]||0));
      const migrateOnly=festivalChestsEnabled()&&!initializing&&!periodOnly&&!stored.state.chests;
      const sourcesOnly=newSources&&!initializing&&!periodOnly&&!migrateOnly;
      const earnedBefore = stored.state?.letters.earned || {};
      const changedLetters = LETTER_ALPHABET.filter(letter=>(local.letterEarned[letter]||0)!==(earnedBefore[letter]||0));
      const newFireflies = festivalChestsEnabled() && local.fireflyEarned !== (stored.state?.festival?.earnedTotal||0);
      const newTickets = local.ticketEarned !== (stored.state?.ticketEarned || 0);
      const unappliedDrops = newFireflies || newTickets || changedLetters.length > 0;
      const hasFacts = pending.some(v=>v.uid===identity.uid);
      const preflightOnly = Boolean(operation && (unappliedDrops || hasFacts));
      const statsOnly = !sourcesOnly && !migrateOnly && !initializing && !periodOnly && Boolean(hasFacts || newTickets || newFireflies);
      const letterOnly = !sourcesOnly && !migrateOnly && !initializing && !periodOnly && !statsOnly && changedLetters.length > 0;
      const earnedCandidate = {...earnedBefore};
      if(letterOnly)for(const letter of changedLetters.slice(0,LETTER_SYNC_KEYS_PER_COMMIT))earnedCandidate[letter]=local.letterEarned[letter]||0;
      const remainingLetterWork = letterOnly ? changedLetters.length > LETTER_SYNC_KEYS_PER_COMMIT : changedLetters.length > 0;
      const reconcileOnly = sourcesOnly || migrateOnly || initializing || periodOnly || preflightOnly || statsOnly || letterOnly;
      const resolved = resolveSparkOperation(stored.state, operation, now);
      const action = operation && !reconcileOnly ? { ...resolved.command, day: resolved.command.day ?? Math.floor(now / DAY_MS),
        sequence: operation.sequence ?? (['sellLetter','fuseLetter','exchangeLetterSet'].includes(operation.type) ? stored.state?.letters.sequence || 0 : operation.type==='claimHourlyGift' ? stored.state?.hourlyGift?.sequence||0 : operation.type==='openChest' ? stored.state?.chests?.sequence||0 : stored.state?.ticketSpent || 0) + 1 } : { type: 'status' };
      const ownedIds=ownedProfileCosmeticItems(data.appearance).map(item=>item.id);
      if(action.type==='openChest'&&!action.candidate)action.candidate=chestCandidate(action.chestType,action.gameId,ownedIds,secureUnit);
      // Candidate/sector survive loss of response; day/sequence are saved before publishing.
      if (operation && !reconcileOnly) {
        operation = { ...operation, ...action, sector: operation.sector };
        await updateSyncMetadata(key, () => operation, isCurrent);
      }
      const acquisitions = normalizeAcquisitions(data.appearance.acquisitions);
      let result;
      try { result = transitionSpark(stored.state, action, { uid: identity.uid, now, sector: operation?.sector ?? 0,
        ticketEarned: initializing ? 0 : periodOnly || migrateOnly || sourcesOnly ? stored.state.ticketEarned : local.ticketEarned, letterEarned:initializing ? {} : earnedCandidate, randomLetter:operation?.randomLetter, ownedItemIds:ownedIds, festivalEnabled:festivalChestsEnabled()&&(!periodOnly||Boolean(stored.state.chests)),sourceEarned:sourcesOnly?sourceCounts:undefined,fireflyEarned:initializing||migrateOnly?0:periodOnly||sourcesOnly?(stored.state.festival?.earnedTotal||0):local.fireflyEarned,supportCount:['openChest','claimHourlyGift'].includes(action.type)&&action.candidate.kind==='support'?chestSupportCount(data.progress,action.candidate.gameId,action.candidate.key):0, facts: (initializing || periodOnly || migrateOnly || sourcesOnly ? [] : pending).filter(v => v.uid === identity.uid).map(v => v.fact) }); }
      catch(error) { if(!['rewards/inventory-full','rewards/gift-cooldown'].includes(error.code))error.code='rewards/invalid-operation'; throw error; }
      const changed = stableJSON(result.state) !== stableJSON(stored.state && cleanState(stored.state)) || pending.some(v => v.uid === identity.uid);
      if (!changed) return { ...result, committedRewards, expiredOperation:resolved.discarded, operations:{...totals}, appliedCoins:totals.coins };
      const feedback = committedRewardsForTransition(stored.state, result);
      result.state.revision = remoteRevision + 1;
      let added = 0;
      for (const receipt of result.receipts) {
        added += receipt.coins;
        if(receipt.support)creditChestSupport(data.progress,receipt.support);
        if (receipt.acquisition) acquisitions.grants[receipt.receiptId] = { ...receipt.acquisition,
          receiptId: receipt.receiptId, ownerUid: identity.uid, grantedAt: receipt.grantedAt };
      }
      result.ownedItemIds=[...new Set([...ownedIds,...Object.values(acquisitions.grants).flatMap(grant=>grant.items)])];
      data.coins += added;
      if (!Number.isSafeInteger(data.coins)) throw new Error('Kho Xu đã đầy.');
      data.appearance = { ...data.appearance, acquisitions: normalizeAcquisitions(acquisitions),
        spark: { ...local, economyRevision:local.economyRevision+1, state: result.state, ownerUid:identity.uid }, rewards: { ...(data.appearance.rewards || { version:1, applied:{} }), pending: initializing || periodOnly || migrateOnly || sourcesOnly ? pending : pending.filter(v => v.uid !== identity.uid) } };
      const encoded = await encodeCloudSnapshot(snapshot);
      const published = await publishCloudSnapshot({ database: backend.database, environment: identity.environment, uid: identity.uid,
        encoded, expectedRevision: metadata.cloudRevision, playerName: identity.playerName, isCurrent,
        economyRevision:local.economyRevision+1, rewardRevision: remoteRevision, reward: { state: result.state, expectedRevision: remoteRevision, hourlyGiftClaim:result.hourlyGiftApplied },
        onStagePlan: jobs => updateSyncMetadata(`${identity.environment}:work:${identity.uid}`, () => ({ jobs }), isCurrent) });
      if(!published.cleanupError)await updateSyncMetadata(`${identity.environment}:work:${identity.uid}`,()=>({jobs:[]}),isCurrent);
      committedRewards = mergeCommittedRewards(committedRewards, feedback);
      totals.reads+=published.reads;totals.writes+=published.writes;totals.bytes+=encoded.byteLength;totals.coins+=added;
      let viewState=result.state,viewNow=result.serverNow;
      if(result.hourlyGiftApplied){
        viewNow=clockNow(identity)??viewNow;
        try {
          const confirmed=await readSparkState(backend.database,identity.environment,identity.uid);totals.reads++;
          viewState={...result.state,hourlyGift:confirmed.state.hourlyGift};viewNow=clockNow(identity)??viewNow;
        } catch(error) {
          // The grant is already committed. Keep the countdown conservative until the next status read.
          console.info('Gift clock will refresh on next connection',error.code||error.name);
          viewState={...result.state,hourlyGift:{...result.state.hourlyGift,claimedAt:viewNow}};
        }
      }
      return { ...result, committedRewards, state:viewState, serverNow:viewNow, initializing, continueOperation:reconcileOnly && Boolean(migrateOnly || sourcesOnly && (operation||unappliedDrops||hasFacts) || operation || initializing && (unappliedDrops || hasFacts || newSources) || periodOnly && (unappliedDrops || hasFacts) || remainingLetterWork), expiredOperation:resolved.discarded, root: published.root, data, added, appliedCoins:totals.coins,
        operations: {...totals} };
    }, isCurrent);
  }); } catch(error) {
    if(error.code==='rewards/inventory-full'&&operation?.type==='openChest')error.pendingChest={chestType:operation.chestType,gameId:operation.gameId};
    if(['rewards/invalid-operation','rewards/gift-cooldown'].includes(error.code)) {
      await saveSyncMetadata(key,null,()=>account.getIdentity()?.profileId===initial.profileId);
      if(savedAd?.operation===operation?.operation)await saveSyncMetadata(`rewardedPending:${initial.uid}`,null,()=>account.getIdentity()?.profileId===initial.profileId);
    }
    throw error;
  }
  const continuation=result.continueOperation;delete result.data;delete result.added;
  if (continuation) return perform(command,pass+1,initial,totals,committedRewards);
  if (operation) await saveSyncMetadata(key, null, () => account.getIdentity()?.profileId === initial.profileId);
  if (savedAd?.earned && operation?.operation === savedAd.operation)
    await saveSyncMetadata(`rewardedPending:${initial.uid}`, null, () => account.getIdentity()?.profileId === initial.profileId);
  if (command.type === 'prepareAd') {
    if (result.state.spins.ads.length >= 10) throw new Error('Bạn đã dùng hết lượt quảng cáo hôm nay.');
    result.adOperation = { type:'spin', source:'ad', operation:crypto.randomUUID(), ordinal:result.state.spins.ads.length + 1,
      sector:secureSector(), day:result.state.day, profileId:initial.profileId };
  }
  return result;
}
function cleanState(state) { const { rootRevision, fingerprint, updatedAt, ...value } = state; return value; }
async function importRoot(backend, identity) {
  return (await import('../cloudStore.js')).readCloudRoot(backend.database, identity.environment, identity.uid);
}
