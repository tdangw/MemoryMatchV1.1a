import { getAdventureSummary, getChapterNumber, MAX_ADVENTURE_CHAPTER } from "./adventureProgress.js";
import { highestOwnedAdventureLevel, createProgressResult, keepProgressBest, sameRankingOwner, validateProgressResult, normalizeProgressMigration } from './progressRankingModel.js';

export const CHAPTER_DATABASE = "memoryMatchAdventure";
const GAME_KEYS = ["memoryMatch", "linkConnect", "tripleConnect"];
const LEVEL_KEY = /^(easy|normal|hard|superHard|challenge|endless):([1-9]\d*)$/;

export function openChapterDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CHAPTER_DATABASE, 2);
    request.onupgradeneeded = () => {
      for (const name of ["profile", "chapters", "metadata", "backups"]) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name);
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Một tab cũ đang giữ cơ sở dữ liệu. Hãy đóng tab đó rồi tải lại."));
  });
}

export async function readChapterProfile(database) {
  const transaction = database.transaction("profile", "readonly");
  return requestResult(transaction.objectStore("profile").get("active"));
}

/** Bounded, restartable migration; marker and summaries commit together with the profile. */
export async function migrateChapterLevelRankings(database, owner, expectedRevision, isCurrent = () => true, batchSize = 20) {
  if (!owner || typeof owner.profileId !== 'string' || !Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) throw new RangeError('Invalid migration batch.');
  const transaction = database.transaction(['profile', 'chapters', 'metadata'], 'readwrite');
  const complete = transactionResult(transaction);
  try {
    const profiles = transaction.objectStore('profile');
    const [previous, profileOwner] = await Promise.all([requestResult(profiles.get('active')), requestResult(transaction.objectStore('metadata').get('profile-owner'))]);
    if (!isCurrent() || profileOwner?.id !== owner.profileId || profileOwner.uid !== owner.uid) throw new Error('Migration owner changed.');
    if (!previous || previous.revision !== expectedRevision) throw new Error('Migration revision changed.');
    const marker = normalizeProgressMigration(previous.data.progress.levelRankingMigration);
    const sameOwner = marker?.version === 3 && sameRankingOwner(marker.owner, owner);
    if (sameOwner && marker.complete) { await complete; return { envelope: previous, complete: true }; }
    const stored = structuredClone(previous);
    const keys = { memoryMatch: 'memory-match', linkConnect: 'link-connect', tripleConnect: 'triple-connect' };
    function inspect(game, records) {
      const profile = stored.data.progress[game]; if (!profile) return;
      const bests = profile.levelBestsV3 ||= {};
      if (Object.values(bests).some(value => !validateProgressResult(value))) throw new Error('Invalid level ranking history.');
      const level = highestOwnedAdventureLevel(records, owner, profileOwner);
      if (level) bests.adventure = keepProgressBest(bests.adventure, createProgressResult(keys[game], 'adventure', level, owner));
    }
    if (!sameOwner) for (const game of Object.keys(keys)) inspect(game, stored.data.progress[game]?.bestByLevel);
    let afterKey = sameOwner ? marker.afterKey : null;
    let exhausted = false; let count = 0;
    await new Promise((resolve, reject) => {
      const request = transaction.objectStore('chapters').openCursor(afterKey ? IDBKeyRange.lowerBound(afterKey, true) : undefined);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) { exhausted = true; resolve(); return; }
        if (count >= batchSize) { resolve(); return; }
        try {
          const game = String(cursor.key).split(':')[0];
          if (keys[game]) inspect(game, cursor.value.bestByLevel);
          afterKey = cursor.key; count++; cursor.continue();
        } catch (error) { reject(error); }
      };
    });
    if (!isCurrent()) throw new Error('Migration cancelled.');
    stored.data.progress.levelRankingMigration = { version: 3, owner: { ...owner }, afterKey, complete: exhausted };
    stored.revision++; profiles.put(stored, 'active'); await complete;
    return { envelope: stored, complete: exhausted };
  } catch (error) {
    try { transaction.abort(); } catch (abortError) { if (abortError.name !== 'InvalidStateError') throw abortError; }
    await complete.catch(() => {}); throw error;
  }
}

/** Consistent export of durable state; never export the optimistic gameplay object. */
export async function exportChapterSnapshot(database) {
  const transaction = database.transaction(["profile", "chapters"], "readonly");
  const complete = transactionResult(transaction);
  const chapters = transaction.objectStore("chapters");
  const [profile, keys, values] = await Promise.all([
    requestResult(transaction.objectStore("profile").get("active")),
    requestResult(chapters.getAllKeys()), requestResult(chapters.getAll()),
  ]);
  await complete;
  return { snapshotVersion: 1, profile, chapters: keys.map((key, index) => ({ key, value: values[index] })) };
}

export function validateChapterSnapshot(snapshot) {
  const profile = snapshot?.profile;
  const data = profile?.data;
  if (snapshot?.snapshotVersion !== 1 || profile?.formatVersion !== 2 || !record(data)
    || !Number.isFinite(data.coins) || data.coins < 0 || !record(data.progress) || !record(data.appearance)
    || !record(data.settings) || !Array.isArray(snapshot.chapters)) throw new Error("Bản lưu cloud không đúng định dạng hỗ trợ.");
  for (const game of GAME_KEYS) {
    const chapter = data.progress[game]?.adventure?.currentChapter;
    if (chapter !== undefined && (!Number.isSafeInteger(chapter) || chapter < 1 || chapter > MAX_ADVENTURE_CHAPTER)) throw new Error("Chặng cloud không hợp lệ.");
  }
  const seen = new Set();
  for (const entry of snapshot.chapters) {
    const match = /^(memoryMatch|linkConnect|tripleConnect):([1-9]\d*)$/.exec(entry?.key || "");
    const number = match && Number(match[2]);
    if (!match || !Number.isSafeInteger(number) || number > MAX_ADVENTURE_CHAPTER || seen.has(entry.key)
      || !record(entry.value) || !record(entry.value.bestByLevel) || !record(entry.value.claimedChests)
      || !record(entry.value.startedLevels || {})) throw new Error("Dữ liệu chặng cloud không hợp lệ.");
    seen.add(entry.key);
  }
  return snapshot;
}

/** Replace rather than merge; backup and identity change commit with the profile and all chapters. */
export async function replaceChapterSnapshot(database, snapshot, envelope, expectedRevision, metadataKey, metadata, isCurrent = () => true) {
  validateChapterSnapshot(snapshot);
  const transaction = database.transaction(["profile", "chapters", "metadata", "backups"], "readwrite");
  const complete = transactionResult(transaction);
  const profiles = transaction.objectStore("profile");
  const chapters = transaction.objectStore("chapters");
  const backups = transaction.objectStore("backups");
  try {
    const [previous, keys, values, oldBackups] = await Promise.all([
      requestResult(profiles.get("active")), requestResult(chapters.getAllKeys()),
      requestResult(chapters.getAll()), requestResult(backups.getAllKeys()),
    ]);
    if (!isCurrent()) throw new Error("Tài khoản hoặc màn hình đã thay đổi.");
    if ((previous?.revision || 0) !== expectedRevision) throw new Error("Dữ liệu đã thay đổi ở tab khác.");
    if (previous) {
      backups.put({ snapshotVersion: 1, savedAt: Date.now(), profile: previous, chapters: keys.map((key, index) => ({ key, value: values[index] })) }, previous.revision);
      // Keep the two older snapshots plus the new one.
      for (const key of oldBackups.slice(0, Math.max(0, oldBackups.length - 2))) backups.delete(key);
    }
    chapters.clear();
    for (const entry of snapshot.chapters) chapters.put(entry.value, entry.key);
    profiles.put(envelope, "active");
    if (metadataKey) {
      const store = transaction.objectStore("metadata");
      store.put(metadata, metadataKey);
      if (metadata?.profileId && metadata.uid) store.put({ id: metadata.profileId, uid: metadata.uid, firstUid: metadata.uid }, "profile-owner");
    }
    await complete;
  } catch (error) {
    try { transaction.abort(); } catch (abortError) { if (abortError.name !== "InvalidStateError") throw abortError; }
    await complete.catch(() => {});
    throw error;
  }
}

export async function readChapterMetadata(database, key) {
  return requestResult(database.transaction("metadata", "readonly").objectStore("metadata").get(key));
}
export async function updateChapterMetadata(database, key, update, isCurrent = () => true) {
  const transaction = database.transaction('metadata', 'readwrite');
  const complete = transactionResult(transaction);
  const store = transaction.objectStore('metadata');
  try {
    const previous = await requestResult(store.get(key));
    if (!isCurrent()) { transaction.abort(); await complete.catch(() => {}); return null; }
    const next = update(previous);
    if (next !== previous) store.put(next, key);
    await complete;
    return next;
  } catch (error) {
    try { transaction.abort(); } catch (abortError) { if (abortError.name !== 'InvalidStateError') throw abortError; }
    await complete.catch(() => {});
    throw error;
  }
}
export async function writeChapterMetadata(database, key, value) {
  const transaction = database.transaction("metadata", "readwrite");
  const complete = transactionResult(transaction);
  const store = transaction.objectStore("metadata");
  const owner = await requestResult(store.get("profile-owner"));
  store.put(value, key);
  if (value?.profileId && value.uid && value.profileId === owner?.id) store.put({ ...owner, uid: value.uid, firstUid: owner.firstUid || owner.uid || value.uid }, "profile-owner");
  await complete;
}
export async function updateChapterMetadataPair(database, keys, update, isCurrent = () => true) {
  const transaction = database.transaction('metadata', 'readwrite');
  const complete = transactionResult(transaction); const store = transaction.objectStore('metadata');
  try {
    const values = await Promise.all(keys.map(key => requestResult(store.get(key))));
    if (!isCurrent()) { transaction.abort(); await complete.catch(() => {}); return null; }
    const next = update(values);
    for (let index = 0; index < keys.length; index++) store.put(next[index], keys[index]);
    await complete; return next;
  } catch (error) {
    try { transaction.abort(); } catch (abortError) { if (abortError.name !== 'InvalidStateError') throw abortError; }
    await complete.catch(() => {}); throw error;
  }
}
export async function ensureChapterProfileOwner(database) {
  const transaction = database.transaction("metadata", "readwrite");
  const complete = transactionResult(transaction);
  const store = transaction.objectStore("metadata");
  let owner = await requestResult(store.get("profile-owner"));
  if (!owner) { owner = { id: crypto.randomUUID(), uid: null, createdAt: Date.now() }; store.put(owner, "profile-owner"); }
  await complete;
  return owner;
}
export async function readChapterBackups(database) {
  return requestResult(database.transaction("backups", "readonly").objectStore("backups").getAll());
}
function record(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }

/** A profile and all changed chapter records share one durability boundary. */
export async function writeChapterProfile(database, envelope, expectedRevision, { migration = false } = {}) {
  const transaction = database.transaction(["profile", "chapters"], "readwrite");
  const complete = transactionResult(transaction);
  const profiles = transaction.objectStore("profile");
  const chapters = transaction.objectStore("chapters");
  try {
    const previous = await requestResult(profiles.get("active"));
    if ((previous?.revision || 0) !== expectedRevision) throw new Error("Dữ liệu đã được cập nhật ở tab khác.");
    const stored = structuredClone(envelope);
    const updated = new Map();
    for (const game of GAME_KEYS) {
      const progress = stored.data.progress[game];
      if (!progress) continue;
      const original = previous?.data.progress[game] || {};
      const groups = splitResults(progress.bestByLevel);
      const claims = splitClaims(progress.claimedChests);
      const starts = splitResults(progress.startedLevels);
      if (migration) {
        for (const [number, records] of groups) {
          const values = starts.get(number) || {};
          for (const key of Object.keys(records)) values[key] = true;
          starts.set(number, values);
        }
        for (const session of Object.values(progress.sessionsByMode || {})) {
          if (!session || !Number.isSafeInteger(session.level) || session.level < 1) continue;
          const number = getChapterNumber(session.level);
          const values = starts.get(number) || {};
          values[`${session.mode}:${session.level}`] = true;
          starts.set(number, values);
        }
      }
      for (const number of new Set([...groups.keys(), ...claims.keys(), ...starts.keys()])) {
        const key = `${game}:${number}`;
        const oldChapter = await requestResult(chapters.get(key)) || { bestByLevel: {}, claimedChests: {} };
        const chapter = {
          bestByLevel: { ...oldChapter.bestByLevel, ...groups.get(number) },
          claimedChests: { ...oldChapter.claimedChests, ...claims.get(number) },
          startedLevels: { ...oldChapter.startedLevels, ...starts.get(number) },
        };
        chapters.put(chapter, key);
        updated.set(key, chapter);
      }
      let currentChapter = migration ? 1 : original.adventure?.currentChapter || 1;
      let summary;
      // Only consecutive completed chapters advance the frontier. Sparse imported records do not skip holes.
      for (;;) {
        const key = `${game}:${currentChapter}`;
        const chapter = updated.get(key) || await requestResult(chapters.get(key));
        summary = getAdventureSummary(chapter?.bestByLevel || {}, currentChapter);
        if (summary.currentChapter === currentChapter) break;
        currentChapter += 1;
      }
      stored.data.progress[game] = { ...original, ...progress, adventure: summary };
      delete stored.data.progress[game].bestByLevel;
      delete stored.data.progress[game].claimedChests;
      delete stored.data.progress[game].startedLevels;
    }
    profiles.put(stored, "active");
    await complete;
    return stored;
  } catch (error) {
    try { transaction.abort(); } catch (abortError) {
      if (abortError.name !== "InvalidStateError") throw abortError;
    }
    await complete.catch(() => {});
    throw error;
  }
}

export async function readChapter(database, game, number) {
  if (!GAME_KEYS.includes(game) || !Number.isSafeInteger(number) || number < 1) throw new RangeError("Invalid chapter identity.");
  return await requestResult(database.transaction("chapters", "readonly").objectStore("chapters").get(`${game}:${number}`))
    || { bestByLevel: {}, claimedChests: {}, startedLevels: {} };
}

export async function resetChapterProfile(database, envelope, expectedRevision) {
  const transaction = database.transaction(["profile", "chapters"], "readwrite");
  const complete = transactionResult(transaction);
  const store = transaction.objectStore("profile");
  const previous = await requestResult(store.get("active"));
  if ((previous?.revision || 0) !== expectedRevision) {
    transaction.abort();
    await complete.catch(() => {});
    throw new Error("Dữ liệu đã được cập nhật ở tab khác.");
  }
  transaction.objectStore("chapters").clear();
  store.put(envelope, "active");
  await complete;
}

/** At startup keep the frontier and the at most six resumable-mode chapters per game. */
export async function hydrateChapterProfile(database, envelope) {
  const data = structuredClone(envelope.data);
  for (const game of GAME_KEYS) {
    const progress = data.progress[game];
    if (!progress) continue;
    const numbers = new Set([progress.adventure?.currentChapter || 1]);
    for (const session of Object.values(progress.sessionsByMode || {})) {
      if (session && Number.isSafeInteger(session.level) && session.level > 0) numbers.add(getChapterNumber(session.level));
    }
    progress.bestByLevel = {};
    progress.claimedChests = {};
    progress.startedLevels = {};
    for (const number of numbers) {
      const chapter = await readChapter(database, game, number);
      Object.assign(progress.bestByLevel, chapter.bestByLevel);
      Object.assign(progress.claimedChests, chapter.claimedChests);
      Object.assign(progress.startedLevels, chapter.startedLevels);
    }
  }
  return data;
}

function splitResults(results = {}) {
  const groups = new Map();
  for (const [key, result] of Object.entries(results || {})) {
    const match = LEVEL_KEY.exec(key);
    const level = match ? Number(match[2]) : NaN;
    if (!Number.isSafeInteger(level) || level < 1) continue;
    const number = getChapterNumber(level);
    if (!groups.has(number)) groups.set(number, {});
    groups.get(number)[key] = result;
  }
  return groups;
}

function splitClaims(claims = {}) {
  const groups = new Map();
  for (const [key, claim] of Object.entries(claims || {})) {
    const number = Number(key);
    if (!Number.isSafeInteger(number) || number < 1) continue;
    const chapter = Math.floor((number - 1) / 10) + 1;
    if (!groups.has(chapter)) groups.set(chapter, {});
    groups.get(chapter)[key] = claim;
  }
  return groups;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function transactionResult(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted."));
  });
}
