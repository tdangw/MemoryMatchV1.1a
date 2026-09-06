export const SAVE_SCHEMA_VERSION = 1;

const ROOT_STORAGE_KEY = "memoryMatchSave";
const LEGACY_STORAGE_KEYS = Object.freeze({
  coins: "coins",
  sound: "sound",
  music: "music",
  soundVolume: "soundVolume",
  musicVolume: "musicVolume",
  meteorEffects: "meteorEffects",
  boardCoordinates: "boardCoordinates",
  appearance: "appearance",
  progress: "progress",
});
const SETTINGS_KEYS = new Set([
  "sound",
  "music",
  "soundVolume",
  "musicVolume",
  "meteorEffects",
  "boardCoordinates",
]);

let knownRevision = 0;
let lastPersistenceError = null;
let hasUnsupportedSchema = false;

export function loadPersistentGameData() {
  const stored = readEnvelope();
  if (stored) {
    knownRevision = stored.revision;
    return stored.data;
  }

  const legacyData = loadLegacyGameData();
  if (!hasUnsupportedSchema) {
    writeEnvelope(createEnvelope(legacyData, 1), { allowNewerRevision: true });
  }
  return legacyData;
}

export function savePersistentGameData({ coins, appearance, progress, settings } = {}) {
  const patch = {};
  if (coins !== undefined) patch.coins = normalizeNonNegativeInteger(coins);
  if (appearance !== undefined) patch.appearance = appearance;
  if (progress !== undefined) patch.progress = progress;
  if (settings !== undefined) patch.settings = settings;
  return updateEnvelope(patch);
}

export function saveProgress(progress) {
  return savePersistentGameData({ progress });
}

export function saveCoins(coins) {
  return savePersistentGameData({ coins });
}

export function saveAppearance(appearance) {
  return savePersistentGameData({ appearance });
}

export function saveSetting(key, value) {
  if (!SETTINGS_KEYS.has(key)) return false;
  const current = readEnvelope()?.data || loadLegacyGameData();
  return savePersistentGameData({ settings: { ...current.settings, [key]: value } });
}

export function clearPersistentGameData() {
  let success = removeStorageItem(ROOT_STORAGE_KEY);
  Object.values(LEGACY_STORAGE_KEYS).forEach((key) => {
    success = removeStorageItem(key) && success;
  });
  if (success) {
    knownRevision = 0;
    lastPersistenceError = null;
  }
  return success;
}

export function getPersistenceStatus() {
  return { schemaVersion: SAVE_SCHEMA_VERSION, revision: knownRevision, error: lastPersistenceError };
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
  if (hasUnsupportedSchema) {
    reportPersistenceError("schema", new Error("Không thể ghi đè bản lưu thuộc phiên bản mới hơn."));
    return false;
  }
  const current = readEnvelope() || createEnvelope(loadLegacyGameData(), 0);
  if (current.revision > knownRevision) {
    reportPersistenceError("conflict", new Error("Dữ liệu đã được cập nhật ở tab khác."));
    return false;
  }
  return writeEnvelope(createEnvelope({ ...current.data, ...patch }, current.revision + 1));
}

function createEnvelope(data, revision) {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
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
    if (!isRecord(parsed) || !isRecord(parsed.data)) return null;
    if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION) return migrateEnvelope(parsed);
    return createEnvelope(parsed.data, parsed.revision);
  } catch (error) {
    reportPersistenceError("parse", error);
    return null;
  }
}

function migrateEnvelope(envelope) {
  if (envelope.schemaVersion == null && isRecord(envelope.data)) {
    return createEnvelope(envelope.data, envelope.revision);
  }
  hasUnsupportedSchema = true;
  reportPersistenceError("schema", new Error(`Schema ${envelope.schemaVersion} chưa được hỗ trợ.`));
  return null;
}

function writeEnvelope(envelope, { allowNewerRevision = false } = {}) {
  if (!allowNewerRevision && envelope.revision <= knownRevision) {
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

function loadLegacyGameData() {
  return {
    coins: normalizeNonNegativeInteger(readStorageItem(LEGACY_STORAGE_KEYS.coins)),
    appearance: parseLegacyJson(LEGACY_STORAGE_KEYS.appearance),
    progress: parseLegacyJson(LEGACY_STORAGE_KEYS.progress),
    settings: {
      sound: readStorageItem(LEGACY_STORAGE_KEYS.sound) !== "false",
      music: readStorageItem(LEGACY_STORAGE_KEYS.music) !== "false",
      soundVolume: normalizeFiniteNumber(readStorageItem(LEGACY_STORAGE_KEYS.soundVolume), 0.4),
      musicVolume: normalizeFiniteNumber(readStorageItem(LEGACY_STORAGE_KEYS.musicVolume), 0.35),
      meteorEffects: readStorageItem(LEGACY_STORAGE_KEYS.meteorEffects) !== "false",
      boardCoordinates: readStorageItem(LEGACY_STORAGE_KEYS.boardCoordinates) === "true",
    },
  };
}

function parseLegacyJson(key) {
  const value = readStorageItem(key);
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch (error) {
    reportPersistenceError("parse", error);
    return {};
  }
}

function readStorageItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    reportPersistenceError("read", error);
    return null;
  }
}

function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    reportPersistenceError("remove", error);
    return false;
  }
}

function reportPersistenceError(type, error) {
  lastPersistenceError = { type, message: error?.message || String(error) };
  console.warn(`[Persistence] ${type}: ${lastPersistenceError.message}`);
}

function normalizeNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function normalizeFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
