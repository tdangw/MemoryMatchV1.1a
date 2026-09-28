export const SAVE_FORMAT_VERSION = 1;

const ROOT_STORAGE_KEY = "memoryMatchSave";
const SETTINGS_KEYS = new Set([
  "sound", "music", "soundVolume", "musicVolume", "meteorEffects",
  "boardCoordinates", "cardDescriptions",
]);

let knownRevision = 0;
let lastPersistenceError = null;

export function loadPersistentGameData() {
  const stored = readEnvelope();
  if (!stored) {
    knownRevision = 0;
    return createDefaultPayload();
  }
  knownRevision = stored.revision;
  return stored.data;
}

export function savePersistentGameData({ coins, appearance, progress, settings } = {}) {
  const patch = {};
  if (coins !== undefined) patch.coins = normalizeNonNegativeInteger(coins);
  if (appearance !== undefined) patch.appearance = appearance;
  if (progress !== undefined) patch.progress = progress;
  if (settings !== undefined) patch.settings = settings;
  return updateEnvelope(patch);
}

export const saveProgress = progress => savePersistentGameData({ progress });
export const saveCoins = coins => savePersistentGameData({ coins });
export const saveAppearance = appearance => savePersistentGameData({ appearance });

export function saveSetting(key, value) {
  if (!SETTINGS_KEYS.has(key)) return false;
  const current = readEnvelope()?.data || createDefaultPayload();
  return savePersistentGameData({ settings: { ...current.settings, [key]: value } });
}

export function clearPersistentGameData() {
  if (!removeStorageItem(ROOT_STORAGE_KEY)) return false;
  knownRevision = 0;
  lastPersistenceError = null;
  return true;
}

export function getPersistenceStatus() {
  return { formatVersion: SAVE_FORMAT_VERSION, revision: knownRevision, error: lastPersistenceError };
}

export function subscribeToExternalSave(listener) {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event) => {
    if (event.key !== ROOT_STORAGE_KEY || !event.newValue) return;
    const envelope = parseEnvelope(event.newValue);
    if (!envelope || envelope.revision <= knownRevision) return;
    listener?.({
      data: envelope.data,
      revision: envelope.revision,
      accept: () => {
        knownRevision = Math.max(knownRevision, envelope.revision);
        lastPersistenceError = null;
      },
    });
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function updateEnvelope(patch) {
  const current = readEnvelope() || createEnvelope(createDefaultPayload(), 0);
  if (current.revision > knownRevision) {
    reportPersistenceError("conflict", new Error("Dữ liệu đã được cập nhật ở tab khác."));
    return false;
  }
  return writeEnvelope(createEnvelope({ ...current.data, ...patch }, current.revision + 1));
}

function createDefaultPayload() {
  return { coins: 0, appearance: {}, progress: {}, settings: {} };
}

function createEnvelope(data, revision) {
  return {
    formatVersion: SAVE_FORMAT_VERSION,
    revision: normalizeNonNegativeInteger(revision),
    updatedAt: Date.now(),
    data: {
      coins: normalizeNonNegativeInteger(data?.coins),
      appearance: isRecord(data?.appearance) ? data.appearance : {},
      progress: isRecord(data?.progress) ? data.progress : {},
      settings: isRecord(data?.settings) ? data.settings : {},
    },
  };
}

function readEnvelope() {
  const serialized = readStorageItem(ROOT_STORAGE_KEY);
  return serialized ? parseEnvelope(serialized) : null;
}

function parseEnvelope(serialized) {
  try {
    const parsed = JSON.parse(serialized);
    if (!isCurrentEnvelope(parsed)) {
      reportPersistenceError("format", new Error("Bản lưu không đúng định dạng hiện hành."));
      return null;
    }
    return createEnvelope(parsed.data, parsed.revision);
  } catch (error) {
    reportPersistenceError("parse", error);
    return null;
  }
}

function isCurrentEnvelope(value) {
  return isRecord(value)
    && value.formatVersion === SAVE_FORMAT_VERSION
    && Number.isFinite(value.revision)
    && isRecord(value.data)
    && Number.isFinite(value.data.coins)
    && isRecord(value.data.appearance)
    && isRecord(value.data.progress)
    && isRecord(value.data.settings);
}

function writeEnvelope(envelope) {
  if (envelope.revision <= knownRevision) {
    reportPersistenceError("conflict", new Error("Revision bản lưu không tăng."));
    return false;
  }
  try {
    localStorage.setItem(ROOT_STORAGE_KEY, JSON.stringify(envelope));
    knownRevision = envelope.revision;
    lastPersistenceError = null;
    return true;
  } catch (error) {
    reportPersistenceError("write", error);
    return false;
  }
}

function readStorageItem(key) {
  try { return localStorage.getItem(key); }
  catch (error) { reportPersistenceError("read", error); return null; }
}

function removeStorageItem(key) {
  try { localStorage.removeItem(key); return true; }
  catch (error) { reportPersistenceError("remove", error); return false; }
}

function reportPersistenceError(type, error) {
  lastPersistenceError = { type, message: error?.message || String(error) };
  console.warn(`[Persistence] ${type}: ${lastPersistenceError.message}`);
}

function normalizeNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
