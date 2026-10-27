import { TRIPLE_PRODUCT_DECISIONS } from './tripleConnect/tripleConfig.js';
import { liveopsEnabled } from './liveops/availability.js';
import { festivalChestsEnabled } from './liveops/availability.js';
import { normalizeSparkSave, applySpecialDrop } from './liveops/sparkModel.js';
import {
  openChapterDatabase, readChapterProfile, writeChapterProfile,
  hydrateChapterProfile, readChapter, resetChapterProfile,
  exportChapterSnapshot, replaceChapterSnapshot, readChapterMetadata, writeChapterMetadata, readChapterBackups,
  ensureChapterProfileOwner,
  updateChapterMetadata,
  updateChapterMetadataPair,
  migrateChapterLevelRankings,
} from "./chapterStore.js";
import { GAMEPLAY_SEASON, gameplaySeasonReset } from './progression/gameplaySeason.js';
import { settleAchievementInventory, normalizeAchievementLedger, ACHIEVEMENT_GAME_KEYS, ACHIEVEMENT_COVERAGE_REVISION } from './progression/achievementModel.js';
import { normalizeRewardLedger, validateRewardReceipt, MAX_PENDING_REWARD_ROUNDS } from './liveops/ledger.js';
import { normalizeAcquisitions } from './progression/acquisitionModel.js';
import { normalizeFact } from './liveops/model.js';

export const SAVE_FORMAT_VERSION = 2;
const ROOT_STORAGE_KEY = "memoryMatchSave";
const SEASON_STORAGE_KEY = 'memoryMatchSave:multiwave1';
let activeStorageKey = ROOT_STORAGE_KEY;
const PRIMARY_MARKER_KEY = "memoryMatchChapterBackend";
const SETTINGS_KEYS = new Set([
  "uiSkin",
  "tutorialProgress",
  "sound", "music", "soundVolume", "musicVolume", "meteorEffects",
  "boardCoordinates", "cardDescriptions", "lastPlayedGameId",
]);
let database = null;
let initialization = null;
let queue = Promise.resolve();
let knownRevision = 0;
let lastPersistenceError = null;
let currentEnvelope = null;
let committedRewardCoins = 0;
let blocked = false;
const subscribers = new Set();
const failureSubscribers = new Set();
const commitSubscribers = new Set();

export function subscribeToLocalCommit(listener) {
  commitSubscribers.add(listener);
  return () => commitSubscribers.delete(listener);
}
export async function updateSyncMetadata(key, update, isCurrent = () => true) {
  await initialize();
  if (!database || blocked) throw new Error('Không thể lưu hàng đợi trên thiết bị.');
  return updateChapterMetadata(database, `cloud:${key}`, update, isCurrent);
}
export async function updateSyncMetadataPair(keys, update, isCurrent = () => true) {
  await initialize();
  if (!database || blocked) throw new Error('Không thể lưu trên thiết bị.');
  return updateChapterMetadataPair(database, keys.map(key => `cloud:${key}`), update, isCurrent);
}
function notifyCommit(patch) {
  for (const listener of commitSubscribers) {
    try { listener({ revision: knownRevision, patch }); }
    catch (error) { console.error("Persistence subscriber failed", error); }
  }
}

export async function loadPersistentGameData() {
  await queue;
  await initialize();
  if (blocked && lastPersistenceError?.type === "initialize") return createDefaultPayload();
  if (database) {
    const envelope = await readChapterProfile(database);
    if (envelope && (!isSupportedEnvelope(envelope) || envelope.formatVersion !== SAVE_FORMAT_VERSION)) {
      blocked = true;
      reportPersistenceError("format", new Error("Profile không đúng định dạng. Dữ liệu được giữ nguyên."));
      return createDefaultPayload();
    }
    if (blocked && !envelope) return createDefaultPayload();
    currentEnvelope = envelope || createEnvelope(createDefaultPayload(), 0);
    knownRevision = currentEnvelope.revision;
    blocked = false;
    return hydrateChapterProfile(database, currentEnvelope);
  }
  if (localStorage.getItem(PRIMARY_MARKER_KEY) || (blocked && lastPersistenceError?.type === "initialize")) {
    blocked = true;
    return createDefaultPayload();
  }
  const envelope = readLocalEnvelope();
  if (blocked && !envelope) return createDefaultPayload();
  blocked = false;
  currentEnvelope = envelope || createEnvelope(createDefaultPayload(), 0);
  knownRevision = currentEnvelope.revision;
  return structuredClone(currentEnvelope.data);
}

/** Startup-only season boundary; clear gameplay and sync state in one CAS transaction. */
export function ensureGameplaySeason() {
  return enqueue(async () => {
    await initialize();
    if (blocked) return false;
    try {
      if (!database) {
        const local = readLocalEnvelope();
        if (blocked) return false;
        currentEnvelope = local || createEnvelope(createDefaultPayload(), 0);
        knownRevision = currentEnvelope.revision;
      }
      const next = gameplaySeasonReset(currentEnvelope?.data);
      if (!next) return true;
      const envelope = createEnvelope(next, knownRevision + 1);
      if (database) await resetChapterProfile(database, envelope, knownRevision, { clearAuxiliary: true });
      else {
        localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(envelope));
        activeStorageKey = SEASON_STORAGE_KEY;
      }
      currentEnvelope = envelope; knownRevision = envelope.revision;
      if (database) localStorage.setItem(PRIMARY_MARKER_KEY, String(knownRevision));
      return true;
    } catch (error) { blocked = true; reportPersistenceError('season', error); return false; }
  });
}

/** Snapshot at invocation: a later round cannot change a queued write's data. */
export function savePersistentGameData({ coins, appearance, progress, settings, rewardFact, ticketDrop, onSpecialDrop, cloudEvent = false, isCurrent = () => true } = {}) {
  const dropAttempt = ticketDrop ? structuredClone(ticketDrop) : null;
  const settledRewardFact = rewardFact ? structuredClone(rewardFact) : null;
  const rewardCoinsAtInvocation = committedRewardCoins;
  const patch = structuredClone({
    ...(coins !== undefined ? { coins: normalizeNonNegativeInteger(coins) } : {}),
    ...(appearance !== undefined ? { appearance } : {}),
    ...(progress !== undefined ? { progress } : {}),
    ...(settings !== undefined ? { settings } : {}),
  });
  return enqueue(async () => {
    await initialize();
    if (blocked || !isCurrent()) return false;
    try {
      const previous = database ? currentEnvelope : readLocalEnvelope();
      if (!database && localStorage.getItem(PRIMARY_MARKER_KEY)) throw new Error("Backend chính đã được sử dụng. Không ghi vào bản localStorage cũ.");
      if (blocked) return false;
      if (!database && previous && previous.revision > knownRevision) throw new Error("Dữ liệu đã được cập nhật ở tab khác.");
      const envelope = createEnvelope({ ...(previous?.data || createDefaultPayload()), ...patch }, knownRevision + 1);
      // A shop/settlement snapshot can queue while a server reward transaction
      // is in flight. Preserve that intervening delta instead of overwriting it.
      if (patch.coins !== undefined) envelope.data.coins += committedRewardCoins - rewardCoinsAtInvocation;
      if (patch.settings) envelope.data.settings = { ...previous?.data.settings, ...patch.settings };
      if (patch.progress || patch.appearance) envelope.data.appearance = settleAchievementInventory(previous?.data.appearance,
        envelope.data.appearance, patch.progress || {});
      let specialDrop=null;
      if (dropAttempt && liveopsEnabled()) {
        const dropped = applySpecialDrop(envelope.data.appearance.spark, dropAttempt,{dropFireflies:festivalChestsEnabled()});
        envelope.data.appearance.spark = dropped.save;
        specialDrop={letter:dropped.letter,ticket:dropped.dropped,firefly:dropped.firefly};
      }
      if (settledRewardFact) {
        const item = settledRewardFact; item.fact = normalizeFact(item.fact);
        const rewards = normalizeRewardLedger(envelope.data.appearance.rewards);
        const spark = normalizeSparkSave(envelope.data.appearance.spark), settledKey = `${item.fact.gameId}:${item.fact.mode}`;
        if (spark.settled[settledKey] !== item.fact.roundId && !rewards.pending.some(entry => entry.uid === item.uid && entry.fact.roundId === item.fact.roundId && entry.fact.gameId === item.fact.gameId)) {
          if (rewards.pending.length >= MAX_PENDING_REWARD_ROUNDS) throw new Error('Reward upload queue is full');
          rewards.pending.push(item);
        }
        spark.settled[settledKey] = item.fact.roundId;
        envelope.data.appearance = { ...envelope.data.appearance, rewards, spark };
      }
      if (economicSignature(envelope.data) !== economicSignature(previous?.data || createDefaultPayload())) {
        const spark = normalizeSparkSave(envelope.data.appearance.spark);
        spark.economyRevision = normalizeSparkSave(previous?.data.appearance.spark).economyRevision + 1;
        if(!Number.isSafeInteger(spark.economyRevision))throw new Error('Lịch sử kho đã đầy.');
        envelope.data.appearance.spark = spark;
      }
      if (database) currentEnvelope = await writeChapterProfile(database, envelope, knownRevision, { isCurrent });
      else {
        localStorage.setItem(activeStorageKey, JSON.stringify(envelope));
        currentEnvelope = envelope;
      }
      knownRevision = envelope.revision;
      lastPersistenceError = null;
      if (database) {
        try { localStorage.setItem(PRIMARY_MARKER_KEY, String(knownRevision)); }
        catch (error) { console.warn("[Persistence] Không gửi được thông báo giữa các tab:", error.message); }
      }
      notifyCommit({ ...patch, ...(patch.coins !== undefined ? { coins: envelope.data.coins } : {}), ...((patch.progress || patch.appearance || rewardFact || dropAttempt) ? { appearance: structuredClone(envelope.data.appearance) } : {}),
        ...(settledRewardFact ? { rewardSettlement: true } : {}), ...(cloudEvent ? { cloudEvent: true } : {}) });
      if(specialDrop && typeof onSpecialDrop==='function'){
        try{onSpecialDrop(specialDrop);}catch(error){console.error('Letter reward presentation failed',error);}
      }
      return true;
    } catch (error) { if (error.name === 'AbortError' && !isCurrent()) return false; blocked = true; reportPersistenceError("write", error); return false; }
  });
}

export const saveProgress = progress => savePersistentGameData({ progress });
export const saveCoins = coins => savePersistentGameData({ coins });
export const saveAppearance = (appearance, options = {}) => savePersistentGameData({ appearance, ...options });
export const flushPersistentWrites = () => queue;
/** Account-owned cloud transaction. The callback must not enqueue persistence work. */
export function commitSparkOperation(operation, isCurrent = () => true) {
  return enqueue(async () => {
    await initialize();
    if (blocked || !database || !isCurrent()) throw new Error('Chưa thể lưu phần thưởng.');
    const snapshot = await exportChapterSnapshot(database);
    if (snapshot.profile.revision !== knownRevision) throw new Error('Bản lưu thay đổi ở tab khác. Hãy tải lại.');
    const result = await operation(structuredClone(snapshot));
    if (!isCurrent()) throw new Error('Tài khoản đã thay đổi. Quyền nhận đã được lưu.');
    if (!result.data) return result;
    const envelope = createEnvelope(result.data, knownRevision + 1);
    currentEnvelope = await writeChapterProfile(database, envelope, knownRevision, { isCurrent });
    knownRevision = envelope.revision;
    committedRewardCoins += result.added || 0;
    // Snapshot already published by this operation. Updating RAM must not enqueue a second upload.
    notifyCommit({ coins: envelope.data.coins, appearance: structuredClone(envelope.data.appearance), rewardInventory:structuredClone(envelope.data.progress), rewardPublished: true });
    return result;
  });
}
/** Server receipts and wallet delta commit together; retry never adds twice. */
export function commitLiveopsReceipts(uid, receipts, { isCurrent = () => true, acknowledgedRounds = [] } = {}) {
  const batch = structuredClone(receipts);
  return enqueue(async () => {
    await initialize();
    if (blocked || !isCurrent()) return false;
    try {
      const previous = database ? currentEnvelope : readLocalEnvelope();
      if (blocked || !previous) return false;
      const data = structuredClone(previous.data), rewards = normalizeRewardLedger(data.appearance.rewards);
      let sequence = rewards.applied[uid] || 0, added = 0;
      const acquisitions = normalizeAcquisitions(data.appearance.acquisitions);
      for (const candidate of batch) {
        const receipt = validateRewardReceipt(candidate, uid);
        if (receipt.sequence <= sequence) continue;
        if (receipt.sequence !== sequence + 1) throw new Error('Reward receipt sequence has a gap');
        added += receipt.coins; sequence = receipt.sequence;
        if (receipt.acquisition) {
          const grant = { ...receipt.acquisition, receiptId: receipt.receiptId, ownerUid: uid, grantedAt: receipt.grantedAt };
          acquisitions.grants[grant.receiptId] = grant;
        }
      }
      const pending = rewards.pending.filter(item => item.uid !== uid || !acknowledgedRounds.includes(`${item.fact.gameId}:${item.fact.roundId}`));
      if (sequence === (rewards.applied[uid] || 0) && pending.length === rewards.pending.length) return { coins: data.coins, added: 0 };
      rewards.applied[uid] = sequence; rewards.pending = pending;
      data.appearance = { ...data.appearance, acquisitions: normalizeAcquisitions(acquisitions), rewards };
      data.coins += added;
      if (!Number.isSafeInteger(data.coins)) throw new Error('Wallet capacity reached');
      const envelope = createEnvelope(data, knownRevision + 1);
      if (database) currentEnvelope = await writeChapterProfile(database, envelope, knownRevision, { isCurrent });
      else {
        if (!isCurrent() || localStorage.getItem(PRIMARY_MARKER_KEY)) return false;
        const latest = readLocalEnvelope();
        if (latest?.revision !== knownRevision) throw new Error('Profile changed in another tab');
        localStorage.setItem(activeStorageKey, JSON.stringify(envelope)); currentEnvelope = envelope;
      }
      knownRevision = envelope.revision;
      committedRewardCoins += added;
      notifyCommit({ ...(added > 0 ? { coins: data.coins } : {}), appearance: data.appearance, cloudEvent: true });
      return { coins: data.coins, added };
    } catch (error) {
      if (error.name === 'AbortError' && !isCurrent()) return false;
      reportPersistenceError('reward', error); throw error;
    }
  });
}
/** The catalog only covers chapter 1; three bounded reads backfill old certified wins. */
export function backfillAchievementInventory() {
  return enqueue(async () => {
    await initialize(); if (blocked) return false;
    try {
      const previous = database ? currentEnvelope : readLocalEnvelope();
      if (normalizeAchievementLedger(previous?.data.appearance?.achievements).coverageRevision >= ACHIEVEMENT_COVERAGE_REVISION) return true;
      const progress = {};
      for (const key of Object.values(ACHIEVEMENT_GAME_KEYS)) progress[key] = database
        ? await readChapter(database, key, 1) : previous?.data.progress[key] || {};
      const appearance = settleAchievementInventory(previous?.data.appearance, previous?.data.appearance, progress, { backfill: true });
      const envelope = createEnvelope({ ...(previous?.data || createDefaultPayload()), appearance }, knownRevision + 1);
      if (database) currentEnvelope = await writeChapterProfile(database, envelope, knownRevision);
      else { localStorage.setItem(activeStorageKey, JSON.stringify(envelope)); currentEnvelope = envelope; }
      knownRevision = envelope.revision;
      notifyCommit({ appearance: structuredClone(appearance), cloudEvent: true }); return true;
    } catch (error) { blocked = true; reportPersistenceError('achievements', error); return false; }
  });
}
export function migrateLevelRankingsBatch(owner, isCurrent = () => true) {
  return enqueue(async () => {
    await initialize();
    if (!database || blocked) throw new Error('Level migration requires the chapter database.');
    const result = await migrateChapterLevelRankings(database, owner, knownRevision, isCurrent);
    currentEnvelope = result.envelope; knownRevision = result.envelope.revision;
    return { complete: result.complete, progress: structuredClone(result.envelope.data.progress) };
  });
}
export function saveSetting(key, value) {
  if (!SETTINGS_KEYS.has(key)) return Promise.resolve(false);
  return savePersistentGameData({ settings: { [key]: value } });
}

export function clearPersistentGameData() {
  return enqueue(async () => {
    await initialize();
    try {
      const data = createDefaultPayload();
      if (currentEnvelope?.data.progress.gameplaySeason === GAMEPLAY_SEASON) data.progress.gameplaySeason = GAMEPLAY_SEASON;
      const envelope = createEnvelope(data, knownRevision + 1);
      if (database) await resetChapterProfile(database, envelope, knownRevision);
      else localStorage.setItem(activeStorageKey, JSON.stringify(envelope));
      currentEnvelope = envelope;
      knownRevision = envelope.revision;
      blocked = false;
      lastPersistenceError = null;
      notifyCommit({ reset: true });
      return true;
    } catch (error) { reportPersistenceError("remove", error); return false; }
  });
}

export async function loadPersistentChapter(game, number) {
  await initialize();
  if (blocked) throw new Error(lastPersistenceError?.message || "Không truy cập được dữ liệu.");
  if (database) return readChapter(database, game, number);
  const progress = currentEnvelope?.data.progress[game] || {};
  const first = (number - 1) * 100 + 1;
  const last = first + 99;
  return {
    bestByLevel: Object.fromEntries(Object.entries(progress.bestByLevel || {}).filter(([key]) => {
      const level = Number(key.split(":")[1]);
      return level >= first && level <= last;
    })),
    claimedChests: Object.fromEntries(Object.entries(progress.claimedChests || {}).filter(([key]) => Number(key) > (number - 1) * 10 && Number(key) <= number * 10)),
    startedLevels: Object.fromEntries(Object.entries(progress.startedLevels || {}).filter(([key]) => {
      const level = Number(key.split(":")[1]);
      return level >= first && level <= last;
    })),
  };
}

export function getPersistenceStatus() {
  return { formatVersion: SAVE_FORMAT_VERSION, revision: knownRevision, backend: database ? "indexedDB" : "localStorage", blocked, error: lastPersistenceError };
}

export async function exportPersistentSnapshot() {
  await queue;
  await initialize();
  if (blocked || !database) throw new Error("Sao lưu cần backend IndexedDB đang hoạt động.");
  const snapshot = await exportChapterSnapshot(database);
  if (snapshot.profile.revision !== knownRevision) throw new Error("Bản lưu vừa thay đổi ở tab khác. Hãy tải lại trước khi đồng bộ.");
  return snapshot;
}
export async function loadSyncMetadata(environment) {
  await queue;
  await initialize();
  return database && !blocked ? await readChapterMetadata(database, `cloud:${environment}`) || null : null;
}
export async function loadProfileOwner() {
  await queue;
  await initialize();
  if (!database || blocked) return null;
  return ensureChapterProfileOwner(database);
}
export function saveSyncMetadata(environment, metadata, isCurrent = () => true) {
  return enqueue(async () => {
    await initialize();
    if (blocked || !database || !isCurrent()) return false;
    await writeChapterMetadata(database, `cloud:${environment}`, metadata);
    return true;
  });
}
export function importPersistentSnapshot(snapshot, environment, metadata, isCurrent = () => true, { synced = true } = {}) {
  return enqueue(async () => {
    await initialize();
    if (currentEnvelope?.data.progress.gameplaySeason === GAMEPLAY_SEASON && snapshot?.profile?.data.progress.gameplaySeason !== GAMEPLAY_SEASON)
      throw new Error('Bản lưu không cùng phiên bản. Dữ liệu hiện tại được giữ nguyên.');
    if (blocked || !database || !isCurrent()) return false;
    const restored = structuredClone(snapshot.profile.data), certified = {};
    for (const key of Object.values(ACHIEVEMENT_GAME_KEYS)) certified[key] = snapshot.chapters.find(entry => entry.key === `${key}:1`)?.value || restored.progress[key] || {};
    restored.appearance = settleAchievementInventory(restored.appearance, restored.appearance, certified, { backfill: true });
    const envelope = createEnvelope(restored, knownRevision + 1);
    const needsRewardReconcile = !synced && Boolean(currentEnvelope?.data.appearance.spark?.state || restored.appearance.spark?.state);
    await replaceChapterSnapshot(database, snapshot, envelope, knownRevision, `cloud:${environment}`, { ...metadata, ...(needsRewardReconcile ? {restoreNeedsReconcile:true} : {}), lastSyncedLocalRevision: synced ? envelope.revision : 0 }, isCurrent);
    currentEnvelope = envelope; knownRevision = envelope.revision;
    try { localStorage.setItem(PRIMARY_MARKER_KEY, String(knownRevision)); }
    catch (error) { console.warn("[Persistence] Không gửi được thông báo import giữa các tab:", error.message); }
    if (!synced) notifyCommit({ restored: true });
    return true;
  });
}
export async function getLocalRestoreBackups() {
  await queue;
  await initialize();
  return database ? readChapterBackups(database) : [];
}
export function isPersistenceBlocked() { return blocked; }
export function subscribeToExternalSave(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}
export function subscribeToPersistenceFailure(listener) {
  failureSubscribers.add(listener);
  if (blocked && lastPersistenceError) listener(lastPersistenceError);
  return () => failureSubscribers.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", async event => {
    if (![activeStorageKey, PRIMARY_MARKER_KEY].includes(event.key) || !event.newValue) return;
    try {
      await initialize();
      await queue;
      const envelope = database ? await readChapterProfile(database) : readLocalEnvelope();
      if (!envelope || envelope.revision <= knownRevision) return;
      const data = database ? await hydrateChapterProfile(database, envelope) : envelope.data;
      for (const listener of subscribers) listener({ data, revision: envelope.revision, accept: () => {
        currentEnvelope = envelope;
        knownRevision = envelope.revision;
        lastPersistenceError = null;
      } });
    } catch (error) { reportPersistenceError("external", error); }
  });
}

function initialize() {
  if (!initialization) initialization = initializeBackend();
  return initialization;
}
async function initializeBackend() {
  try {
    if (typeof indexedDB === "undefined") {
      if (localStorage.getItem(PRIMARY_MARKER_KEY)) throw new Error("Backend dữ liệu đã dùng trước đây không khả dụng. Không sử dụng bản v1 cũ.");
      const legacy = localStorage.getItem(ROOT_STORAGE_KEY);
      if (legacy && readLocalEnvelope() && JSON.parse(legacy).formatVersion === 1 && !localStorage.getItem("memoryMatchSaveV1Recovery")) {
        localStorage.setItem("memoryMatchSaveV1Recovery", legacy);
      }
      return;
    }
    database = await openChapterDatabase();
    const previous = await readChapterProfile(database);
    if (previous) {
      if (!isSupportedEnvelope(previous) || previous.formatVersion !== SAVE_FORMAT_VERSION) throw new Error("Profile không đúng định dạng hiện hành.");
      localStorage.setItem(PRIMARY_MARKER_KEY, String(previous.revision));
      currentEnvelope = previous; knownRevision = previous.revision; return;
    }
    const marker = localStorage.getItem(PRIMARY_MARKER_KEY);
    if (marker && marker !== "migrating") throw new Error("Không tìm thấy profile của backend mới. Cần phục hồi bản lưu.");
    const legacy = readLocalEnvelope();
    if (blocked) return;
    // Reserve the permanent fallback barrier before committing IDB. A crash can safely retry an unfinished migration.
    localStorage.setItem(PRIMARY_MARKER_KEY, "migrating");
    const envelope = createEnvelope(legacy?.data || createDefaultPayload(), 1);
    currentEnvelope = await writeChapterProfile(database, envelope, 0, { migration: true });
    knownRevision = 1;
    // The v1 source is retained as recovery data. No stale fallback after this commit.
    localStorage.setItem(PRIMARY_MARKER_KEY, "1");
  } catch (error) { blocked = true; reportPersistenceError("initialize", error); }
}
function readLocalEnvelope() {
  try {
    if (localStorage.getItem(SEASON_STORAGE_KEY)) activeStorageKey = SEASON_STORAGE_KEY;
    const serialized = localStorage.getItem(activeStorageKey);
    if (!serialized) return null;
    const parsed = JSON.parse(serialized);
    if (!isSupportedEnvelope(parsed)) {
      throw new Error("Bản lưu không đúng định dạng hỗ trợ. Dữ liệu gốc được giữ nguyên.");
    }
    return createEnvelope(parsed.data, parsed.revision);
  } catch (error) { blocked = true; reportPersistenceError("read", error); return null; }
}
function economicSignature(value) { return JSON.stringify([value.coins,...['memoryMatch','linkConnect','tripleConnect'].map(key=>Object.entries({...(key==='tripleConnect'?{hint:TRIPLE_PRODUCT_DECISIONS.initialItems.hint}:{}),...value.progress[key]?.items}).filter(([,amount])=>amount>0).sort(([a],[b])=>a.localeCompare(b)))]); }
function createDefaultPayload() { return { coins: 0, appearance: {}, progress: {}, settings: {} }; }
function createEnvelope(data, revision) {
  return { formatVersion: SAVE_FORMAT_VERSION, revision, updatedAt: Date.now(), data: {
    coins: normalizeNonNegativeInteger(data.coins), appearance: data.appearance, progress: data.progress, settings: data.settings,
  } };
}
function enqueue(operation) {
  const result = queue.then(operation);
  queue = result.then(() => {}, error => reportPersistenceError("queue", error));
  return result;
}
function reportPersistenceError(type, error) {
  lastPersistenceError = { type, message: error?.message || String(error) };
  console.warn(`[Persistence] ${type}: ${lastPersistenceError.message}`);
  if (blocked) for (const listener of failureSubscribers) listener(lastPersistenceError);
}
function normalizeNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}
function isRecord(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function isSupportedEnvelope(value) {
  return isRecord(value) && [1, SAVE_FORMAT_VERSION].includes(value.formatVersion)
    && Number.isSafeInteger(value.revision) && value.revision >= 0
    && isRecord(value.data) && Number.isFinite(value.data.coins)
    && isRecord(value.data.appearance) && isRecord(value.data.progress) && isRecord(value.data.settings);
}
