import { getAdventureSummary, getChapterNumber } from "./adventureProgress.js";

export const CHAPTER_DATABASE = "memoryMatchAdventure";
const GAME_KEYS = ["memoryMatch", "linkConnect", "tripleConnect"];
const LEVEL_KEY = /^(easy|normal|hard|superHard|challenge|endless):([1-9]\d*)$/;

export function openChapterDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CHAPTER_DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("profile");
      request.result.createObjectStore("chapters");
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
