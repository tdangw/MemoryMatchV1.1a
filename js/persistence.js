import {
  openChapterDatabase, readChapterProfile, writeChapterProfile,
  hydrateChapterProfile, readChapter, resetChapterProfile,
  exportChapterSnapshot, replaceChapterSnapshot, readChapterMetadata, writeChapterMetadata, readChapterBackups,
  ensureChapterProfileOwner,
  updateChapterMetadata,
} from "./chapterStore.js";

export const SAVE_FORMAT_VERSION = 2;
const ROOT_STORAGE_KEY = "memoryMatchSave";
const PRIMARY_MARKER_KEY = "memoryMatchChapterBackend";
const SETTINGS_KEYS = new Set([
  "sound", "music", "soundVolume", "musicVolume", "meteorEffects",
  "boardCoordinates", "cardDescriptions", "lastPlayedGameId",
]);
let database = null;
let initialization = null;
let queue = Promise.resolve();
let knownRevision = 0;
let lastPersistenceError = null;
let currentEnvelope = null;
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

/** Snapshot at invocation: a later round cannot change a queued write's data. */
export function savePersistentGameData({ coins, appearance, progress, settings } = {}) {
  const patch = structuredClone({
    ...(coins !== undefined ? { coins: normalizeNonNegativeInteger(coins) } : {}),
    ...(appearance !== undefined ? { appearance } : {}),
    ...(progress !== undefined ? { progress } : {}),
    ...(settings !== undefined ? { settings } : {}),
  });
  return enqueue(async () => {
    await initialize();
    if (blocked) return false;
    try {
      const previous = database ? currentEnvelope : readLocalEnvelope();
      if (!database && localStorage.getItem(PRIMARY_MARKER_KEY)) throw new Error("Backend chính đã được sử dụng. Không ghi vào bản localStorage cũ.");
      if (blocked) return false;
      if (!database && previous && previous.revision > knownRevision) throw new Error("Dữ liệu đã được cập nhật ở tab khác.");
      const envelope = createEnvelope({ ...(previous?.data || createDefaultPayload()), ...patch }, knownRevision + 1);
      if (patch.settings) envelope.data.settings = { ...previous?.data.settings, ...patch.settings };
      if (database) currentEnvelope = await writeChapterProfile(database, envelope, knownRevision);
      else {
        localStorage.setItem(ROOT_STORAGE_KEY, JSON.stringify(envelope));
        currentEnvelope = envelope;
      }
      knownRevision = envelope.revision;
      lastPersistenceError = null;
      if (database) {
        try { localStorage.setItem(PRIMARY_MARKER_KEY, String(knownRevision)); }
        catch (error) { console.warn("[Persistence] Không gửi được thông báo giữa các tab:", error.message); }
      }
      notifyCommit(patch);
      return true;
    } catch (error) { blocked = true; reportPersistenceError("write", error); return false; }
  });
}

export const saveProgress = progress => savePersistentGameData({ progress });
export const saveCoins = coins => savePersistentGameData({ coins });
export const saveAppearance = appearance => savePersistentGameData({ appearance });
export const flushPersistentWrites = () => queue;
export function saveSetting(key, value) {
  if (!SETTINGS_KEYS.has(key)) return Promise.resolve(false);
  return savePersistentGameData({ settings: { [key]: value } });
}

export function clearPersistentGameData() {
  return enqueue(async () => {
    await initialize();
    try {
      const envelope = createEnvelope(createDefaultPayload(), knownRevision + 1);
      if (database) await resetChapterProfile(database, envelope, knownRevision);
      else localStorage.setItem(ROOT_STORAGE_KEY, JSON.stringify(envelope));
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
    if (blocked || !database || !isCurrent()) return false;
    const envelope = createEnvelope(snapshot.profile.data, knownRevision + 1);
    await replaceChapterSnapshot(database, snapshot, envelope, knownRevision, `cloud:${environment}`, { ...metadata, lastSyncedLocalRevision: synced ? envelope.revision : 0 }, isCurrent);
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
    if (![ROOT_STORAGE_KEY, PRIMARY_MARKER_KEY].includes(event.key) || !event.newValue) return;
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
    const serialized = localStorage.getItem(ROOT_STORAGE_KEY);
    if (!serialized) return null;
    const parsed = JSON.parse(serialized);
    if (!isSupportedEnvelope(parsed)) {
      throw new Error("Bản lưu không đúng định dạng hỗ trợ. Dữ liệu gốc được giữ nguyên.");
    }
    return createEnvelope(parsed.data, parsed.revision);
  } catch (error) { blocked = true; reportPersistenceError("read", error); return null; }
}
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
