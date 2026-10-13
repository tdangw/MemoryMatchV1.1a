import { validateChapterSnapshot } from "./chapterStore.js";

export const CLOUD_CHUNK_BYTES = 65536;
export const CLOUD_SNAPSHOT_VERSION = 1;
export const MAX_CLOUD_RECORD_BYTES = 16 * 1024 * 1024;
export const MAX_CLOUD_SNAPSHOT_BYTES = 128 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;

/** Content-addressed records keep unchanged chapters out of subsequent uploads. */
export async function encodeCloudSnapshot(snapshot) {
  validateChapterSnapshot(snapshot);
  const records = new Map([["profile", { formatVersion: snapshot.profile.formatVersion, data: snapshot.profile.data }]]);
  for (const { key, value } of snapshot.chapters) records.set(`chapter:${key}`, value);
  const manifest = {};
  const objects = new Map();
  let byteLength = 0;
  for (const [key, value] of [...records].sort(([a], [b]) => a.localeCompare(b))) {
    const bytes = new TextEncoder().encode(stableJSON(value));
    byteLength += bytes.length;
    if (bytes.length > MAX_CLOUD_RECORD_BYTES || byteLength > MAX_CLOUD_SNAPSHOT_BYTES) throw new Error("Bản lưu vượt giới hạn sao lưu hiện tại; bản máy vẫn được giữ nguyên.");
    manifest[key] = [];
    for (let offset = 0; offset < bytes.length; offset += CLOUD_CHUNK_BYTES) {
      const chunk = bytes.subarray(offset, offset + CLOUD_CHUNK_BYTES);
      const hash = await digest(chunk);
      manifest[key].push(hash);
      objects.set(hash, { payload: toBase64(chunk), byteLength: chunk.length, snapshotVersion: CLOUD_SNAPSHOT_VERSION });
    }
  }
  const indexBytes = new TextEncoder().encode(stableJSON(manifest));
  if (indexBytes.length > 700000) throw new Error("Danh mục cloud vượt giới hạn một document; bản máy vẫn được giữ nguyên.");
  return { manifest, objects, byteLength, fingerprint: await digest(indexBytes) };
}

export function validateCloudManifest(manifest) {
  if (!record(manifest) || !Array.isArray(manifest.profile)) throw new Error("Chưa đọc được danh mục bản lưu cloud.");
  for (const [key, hashes] of Object.entries(manifest)) {
    if (!/^(profile|chapter:(memoryMatch|linkConnect|tripleConnect):[1-9]\d*)$/.test(key)
      || !Array.isArray(hashes) || !hashes.length || hashes.length > MAX_CLOUD_RECORD_BYTES / CLOUD_CHUNK_BYTES
      || hashes.some(hash => typeof hash !== "string" || !HASH.test(hash))) throw new Error("Danh mục cloud không hợp lệ.");
  }
  return manifest;
}

export async function decodeCloudSnapshot(manifest, loadObject) {
  validateCloudManifest(manifest);
  const cache = new Map();
  let decodedBytes = 0;
  async function readRecord(hashes) {
    const parts = [];
    for (const hash of hashes) {
      if (!cache.has(hash)) {
        const object = await loadObject(hash);
        if (object?.snapshotVersion !== CLOUD_SNAPSHOT_VERSION || !Number.isInteger(object.byteLength)
          || object.byteLength < 1 || object.byteLength > CLOUD_CHUNK_BYTES || typeof object.payload !== "string"
          || object.payload.length > 90000) throw new Error("Một phần bản lưu cloud bị thiếu hoặc không hợp lệ.");
        const bytes = fromBase64(object.payload);
        if (bytes.length !== object.byteLength || await digest(bytes) !== hash) throw new Error("Bản lưu cloud không toàn vẹn. Bản máy được giữ nguyên.");
        cache.set(hash, bytes);
      }
      parts.push(cache.get(hash));
      decodedBytes += cache.get(hash).length;
      if (decodedBytes > MAX_CLOUD_SNAPSHOT_BYTES) throw new Error("Bản lưu cloud vượt giới hạn khôi phục hiện tại.");
    }
    const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  }
  const chapters = [];
  let profile;
  for (const [key, hashes] of Object.entries(manifest)) {
    const value = await readRecord(hashes);
    if (key === "profile") profile = { ...value, revision: 0 };
    else chapters.push({ key: key.slice("chapter:".length), value });
  }
  return validateChapterSnapshot({ snapshotVersion: CLOUD_SNAPSHOT_VERSION, profile, chapters });
}

export function manifestHashes(manifest) { return new Set(Object.values(validateCloudManifest(manifest)).flat()); }
export async function fingerprintCloudManifest(manifest) {
  return digest(new TextEncoder().encode(stableJSON(validateCloudManifest(manifest))));
}
export function stableJSON(value) {
  const ancestors = new Set();
  function normalize(item, depth) {
    if (depth > 64) throw new Error("Bản lưu có cấu trúc quá sâu.");
    if (item === null || typeof item !== "object") return item;
    if (ancestors.has(item)) throw new Error("Bản lưu có tham chiếu vòng.");
    ancestors.add(item);
    const result = Array.isArray(item) ? item.map(child => normalize(child, depth + 1))
      : Object.fromEntries(Object.keys(item).sort().map(key => [key, normalize(item[key], depth + 1)]));
    ancestors.delete(item);
    return result;
  }
  return JSON.stringify(normalize(value, 0));
}
async function digest(bytes) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...hash].map(value => value.toString(16).padStart(2, "0")).join("");
}
function toBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}
function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}
function record(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
