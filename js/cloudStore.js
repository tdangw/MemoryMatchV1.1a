import { doc, getDocFromServer, writeBatch, runTransaction, serverTimestamp, onSnapshot } from "firebase/firestore";
import { CLOUD_SNAPSHOT_VERSION, decodeCloudSnapshot, manifestHashes, validateCloudManifest, fingerprintCloudManifest } from "./cloudSnapshot.js";

const STAGING_BATCH_SIZE = 300;
const CLEANUP_BATCH_SIZE = 40;
export class CloudConflictError extends Error {
  constructor(root) { super("Bản cloud đã thay đổi ở thiết bị khác."); this.name = "CloudConflictError"; this.root = root; }
}
export function cloudProfileRef(database, environment, uid) { return doc(database, "gamespaces", environment, "players", uid); }
export function observeCloudRoot(database, environment, uid, onRoot, onError) {
  return onSnapshot(cloudProfileRef(database, environment, uid), snapshot => {
    if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache || !snapshot.exists()) return;
    try { onRoot(validateRoot(snapshot.data())); } catch (error) { onError(error); }
  }, onError);
}
function objectRef(database, environment, uid, hash) { return doc(cloudProfileRef(database, environment, uid), "objects", hash); }
export async function readCloudRoot(database, environment, uid) {
  const snapshot = await getDocFromServer(cloudProfileRef(database, environment, uid));
  if (!snapshot.exists()) return null;
  const root = validateRoot(snapshot.data());
  if (await fingerprintCloudManifest(root.manifest) !== root.fingerprint) throw new Error("Danh mục cloud không toàn vẹn. Bản máy được giữ nguyên.");
  return root;
}
export async function readCloudSnapshot(database, environment, uid, root, isCurrent = () => true) {
  validateRoot(root);
  return decodeCloudSnapshot(root.manifest, async hash => {
    if (!isCurrent()) throw new Error("Tài khoản đã thay đổi.");
    const snapshot = await getDocFromServer(objectRef(database, environment, uid, hash));
    return snapshot.exists() ? snapshot.data() : null;
  });
}

/** Stage immutable payloads, then publish one CAS pointer. A failed upload cannot expose half a save. */
export async function publishCloudSnapshot({ database, environment, uid, encoded, expectedRevision, playerName, isCurrent = () => true, onStagePlan = async () => true }) {
  const previous = await readCloudRoot(database, environment, uid);
  if (!isCurrent()) throw new Error("Tài khoản đã thay đổi.");
  if ((previous?.revision || 0) !== expectedRevision) throw new CloudConflictError(previous);
  if (previous?.fingerprint === encoded.fingerprint && previous.playerName === playerName) return { root: previous, reads: 1, writes: 0 };
  const previousHashes = previous ? manifestHashes(previous.manifest) : new Set();
  const changed = [...encoded.objects].filter(([hash]) => !previousHashes.has(hash));
  const stageId = crypto.randomUUID();
  const retained = manifestHashes(encoded.manifest);
  const garbage = [...previousHashes].filter(hash => !retained.has(hash));
  const jobs = [
    ...(changed.length ? [{ id: `${stageId}:staged`, kind: "staged", stageId, hashes: changed.map(([hash]) => hash) }] : []),
    ...(previous?.updatedAt && garbage.length ? [{ id: `${stageId}:retired`, kind: "retired", cutoff: { seconds: previous.updatedAt.seconds, nanoseconds: previous.updatedAt.nanoseconds }, hashes: garbage }] : []),
  ];
  if (!await onStagePlan(jobs) || !isCurrent()) throw new Error("Chưa lưu được trạng thái phục hồi đồng bộ.");
  let writes = 0;
  let reads = 1;
  for (let offset = 0; offset < changed.length; offset += STAGING_BATCH_SIZE) {
    if (!isCurrent()) throw new Error("Tài khoản đã thay đổi.");
    const batch = writeBatch(database);
    for (const [hash, value] of changed.slice(offset, offset + STAGING_BATCH_SIZE)) batch.set(objectRef(database, environment, uid, hash), { ...value, stageId, createdAt: serverTimestamp() });
    await batch.commit(); writes += Math.min(STAGING_BATCH_SIZE, changed.length - offset);
  }
  const next = {
    snapshotVersion: CLOUD_SNAPSHOT_VERSION, formatVersion: 2, revision: expectedRevision + 1,
    manifest: encoded.manifest, fingerprint: encoded.fingerprint, byteLength: encoded.byteLength,
    playerName, updatedAt: serverTimestamp(),
  };
  await runTransaction(database, async transaction => {
    if (!isCurrent()) throw new Error("Tài khoản đã thay đổi.");
    const current = await transaction.get(cloudProfileRef(database, environment, uid)); reads += 1;
    const root = current.exists() ? validateRoot(current.data()) : null;
    if ((root?.revision || 0) !== expectedRevision) throw new CloudConflictError(root);
    transaction.set(cloudProfileRef(database, environment, uid), next);
  });
  writes += 1;
  // Refreshing a staged old hash gives it a newer createdAt. Cleanup must not delete that concurrent upload.
  let cleanupError = null;
  if (jobs.length) {
    try {
      const result = await collectCloudObjects({ database, environment, uid, jobs, isCurrent });
      reads += result.reads; writes += result.writes;
    } catch (error) { cleanupError = error.code || error.name; }
  }
  return { root: { ...next, updatedAt: null }, reads, writes, cleanupError, completedJobs: cleanupError ? [] : jobs.map(job => job.id) };
}

/** Persisted cleanup jobs survive interrupted staging and never delete newer staging or committed references. */
export async function collectCloudObjects({ database, environment, uid, jobs, isCurrent = () => true }) {
  let reads = 0;
  let writes = 0;
  for (const job of jobs) {
    for (let offset = 0; offset < job.hashes.length; offset += CLEANUP_BATCH_SIZE) {
      if (!isCurrent()) throw new Error("Tài khoản đã thay đổi.");
      const group = job.hashes.slice(offset, offset + CLEANUP_BATCH_SIZE);
      const removed = await runTransaction(database, async transaction => {
        if (!isCurrent()) throw new Error("Tài khoản đã thay đổi.");
        const current = await transaction.get(cloudProfileRef(database, environment, uid)); reads += 1;
        const protectedHashes = current.exists() ? manifestHashes(validateRoot(current.data()).manifest) : new Set();
        const targets = group.filter(hash => !protectedHashes.has(hash));
        const objects = await Promise.all(targets.map(hash => transaction.get(objectRef(database, environment, uid, hash)))); reads += objects.length;
        let deleted = 0;
        for (const [index, object] of objects.entries()) {
          const value = object.exists() && object.data();
          if (value && (job.kind === "staged" ? value.stageId === job.stageId : atOrBefore(value.createdAt, job.cutoff))) {
            transaction.delete(objectRef(database, environment, uid, targets[index])); deleted += 1;
          }
        }
        return deleted;
      });
      writes += removed;
    }
  }
  return { reads, writes };
}

export function validateRoot(root) {
  if (root?.snapshotVersion !== CLOUD_SNAPSHOT_VERSION || root.formatVersion !== 2 || !Number.isSafeInteger(root.revision)
    || root.revision < 1 || typeof root.fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(root.fingerprint)
    || typeof root.playerName !== "string" || !root.playerName.trim() || root.playerName.length > 40
    || !Number.isSafeInteger(root.byteLength) || root.byteLength < 1) throw new Error("Bản cloud không đúng phiên bản hỗ trợ; bản máy được giữ nguyên.");
  validateCloudManifest(root.manifest);
  return root;
}
function atOrBefore(first, second) {
  return first && second && (first.seconds < second.seconds || first.seconds === second.seconds && first.nanoseconds <= second.nanoseconds);
}
