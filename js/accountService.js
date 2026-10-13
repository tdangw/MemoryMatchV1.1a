import { onIdTokenChanged, signInAnonymously, GoogleAuthProvider, linkWithPopup, signInWithPopup, signInWithCredential } from "firebase/auth";
import { getFirebaseBackend } from "./firebaseBackend.js";
import { encodeCloudSnapshot } from "./cloudSnapshot.js";
import { readCloudRoot, readCloudSnapshot, publishCloudSnapshot, collectCloudObjects, CloudConflictError } from "./cloudStore.js";
import { exportPersistentSnapshot, loadSyncMetadata, saveSyncMetadata, importPersistentSnapshot, getLocalRestoreBackups, loadProfileOwner, getPersistenceStatus, subscribeToLocalCommit } from "./persistence.js";
import { createGameShellLifecycle, getActiveGameScope, clearShellTimeout } from "./gameShell/gameShellLifecycle.js";
import { getAppPageScope, subscribeToAppPages } from "./appPageLifecycle.js";
import { replaceProfileSafely, waitForProfileReplacement } from "./profileOperations.js";
import { setRankingOwner } from './rankingOwner.js';

const AUTO_SYNC_INTERVAL_MS = 60000;
const MAX_RETRIES = 5;
const MAX_PENDING_HASHES = 8192;
let instance = null;
export function initializeAccountService(options = {}) {
  if (!instance) instance = createAccountService(options);
  return instance;
}
export function getAccountService() { return instance; }

function createAccountService(options) {
  const scope = createGameShellLifecycle();
  const listeners = new Set();
  const state = { phase: "connecting", uid: null, isAnonymous: true, playerName: "", environment: "local", message: "Đang kết nối tài khoản…", lastSavedAt: null, operations: null };
  let backend = null;
  let metadata = null;
  let owner = null;
  let generation = 0;
  let pending = null;
  let networkTask = null;
  let guestTask = null;
  let scheduled = null;
  let lastUploadAt = 0;
  let retries = 0;
  const publicState = () => ({ ...state, conflict: Boolean(pending), bound: metadata?.uid === state.uid && Boolean(state.uid) });
  const current = (id, uid = state.uid) => scope.active && generation === id && backend?.auth.currentUser?.uid === uid;
  const notify = () => {
    if (owner) setRankingOwner({ id: owner.id, uid: metadata?.uid === state.uid ? metadata.uid : owner.uid });
    for (const listener of listeners) { try { listener(publicState()); } catch (error) { console.error("Account listener failed", error); } }
    options.onState?.(publicState());
  };
  const setPhase = (phase, message) => { state.phase = phase; state.message = message; notify(); };
  const workKey = uid => `${state.environment}:work:${uid}`;
  const defaultName = uid => `Người chơi ${uid.slice(-5)}`;

  function scheduleSync(delay, manual = false) {
    if (!scope.active || !metadata || pending || retries >= MAX_RETRIES) return;
    const wait = delay ?? Math.max(0, AUTO_SYNC_INTERVAL_MS - (Date.now() - lastUploadAt));
    const dueAt = Date.now() + wait;
    if (scheduled && scheduled.dueAt <= dueAt) return;
    if (scheduled) clearShellTimeout(scheduled.handle);
    const handle = scope.timeout(() => { scheduled = null; void syncNow({ manual }).catch(handleFailure); }, wait);
    scheduled = { handle, dueAt };
  }
  function handleFailure(error) {
    if (!scope.active) return;
    const offline = !navigator.onLine || ["unavailable", "auth/network-request-failed", "deadline-exceeded"].includes(error.code);
    setPhase(offline ? "offline" : "error", offline ? "Đang offline. Bản máy vẫn được lưu; sẽ gửi lại khi kết nối." : "Chưa đồng bộ được. Bản máy vẫn được giữ nguyên.");
    retries += 1;
    if (offline && navigator.onLine && retries < MAX_RETRIES) scheduleSync(Math.min(900000, AUTO_SYNC_INTERVAL_MS * 2 ** retries));
  }
  async function ensureGuest() {
    if (backend.auth.currentUser) return backend.auth.currentUser;
    if (!navigator.onLine) throw Object.assign(new Error("Offline"), { code: "auth/network-request-failed" });
    if (!guestTask) guestTask = signInAnonymously(backend.auth).then(result => result.user).finally(() => { guestTask = null; });
    return guestTask;
  }
  function connectGuest() {
    const id = generation;
    void ensureGuest().catch(error => { if (scope.active && generation === id) handleFailure(error); });
  }
  async function persistMetadata(next, id) {
    if (!current(id)) return false;
    if (!await saveSyncMetadata(state.environment, next, () => current(id))) return false;
    if (!current(id)) return false;
    metadata = next;
    if (owner?.id === next.profileId) owner = { ...owner, uid: next.uid, firstUid: owner.firstUid || owner.uid || next.uid };
    return true;
  }
  async function pendingConflict(root, id) {
    if (!current(id)) return;
    // Only the profile chunks are needed for a concrete comparison; archive reads wait for a cloud choice.
    const preview = root ? await readCloudSnapshot(backend.database, state.environment, state.uid, { ...root, manifest: { profile: root.manifest.profile } }, () => current(id)) : null;
    if (!current(id)) return;
    pending = { root, preview, notifiedOwner: null };
    setPhase("conflict", "Bản máy và bản cloud khác nhau. Hãy chọn một bản, không cộng Xu hoặc vật phẩm.");
    notifyConflict();
  }
  function notifyConflict() {
    const page = getAppPageScope();
    if (!pending || state.phase === "restoring" || getActiveGameScope() || !page?.active || pending.notifiedOwner === page) return;
    pending.notifiedOwner = page;
    const id = generation;
    options.onConflict?.({ root: pending.root, cloud: pending.preview?.profile.data || null, choose: choice => current(id) ? chooseConflict(choice) : false });
  }
  async function bindUser(user) {
    if (!scope.active) return;
    if (state.uid === user.uid && metadata?.uid === user.uid && !pending) {
      state.isAnonymous = user.isAnonymous; notify(); return;
    }
    const id = ++generation;
    pending = null;
    options.onConflictCleared?.();
    if (scheduled !== null) { clearShellTimeout(scheduled.handle); scheduled = null; }
    state.uid = user.uid; state.isAnonymous = user.isAnonymous;
    setPhase("connecting", "Đang kiểm tra bản sao lưu…");
    if (networkTask) await networkTask.catch(() => {});
    await waitForProfileReplacement();
    if (!current(id, user.uid)) return;
    const loadedOwner = await loadProfileOwner();
    const loadedMetadata = await loadSyncMetadata(state.environment);
    if (!current(id, user.uid)) return;
    owner = loadedOwner; metadata = loadedMetadata;
    state.playerName = metadata?.uid === user.uid ? metadata.playerName : defaultName(user.uid);
    const root = await readCloudRoot(backend.database, state.environment, user.uid);
    if (!current(id, user.uid)) return;
    const snapshot = await exportPersistentSnapshot();
    const encoded = await encodeCloudSnapshot(snapshot);
    if (!current(id, user.uid)) return;
    if (root?.fingerprint === encoded.fingerprint) {
      const next = { uid: user.uid, profileId: owner.id, cloudRevision: root.revision, fingerprint: root.fingerprint, lastSyncedLocalRevision: snapshot.profile.revision, playerName: metadata?.uid === user.uid ? metadata.playerName : root.playerName };
      if (!await persistMetadata(next, id)) throw new Error("Chưa lưu được liên kết tài khoản.");
      if (!current(id, user.uid)) return;
      state.playerName = next.playerName; state.lastSavedAt = root.updatedAt?.toMillis?.() || Date.now();
      setPhase("synced", "Đã sao lưu.");
      scheduleSync();
    } else if (!root || metadata?.uid === user.uid && metadata.cloudRevision === root.revision) {
      const next = { uid: user.uid, profileId: owner.id, cloudRevision: root?.revision || 0, fingerprint: root?.fingerprint || null, lastSyncedLocalRevision: metadata?.uid === user.uid ? metadata.lastSyncedLocalRevision || 0 : 0, playerName: metadata?.uid === user.uid ? metadata.playerName : root?.playerName || defaultName(user.uid) };
      if (!await persistMetadata(next, id)) throw new Error("Chưa lưu được liên kết tài khoản.");
      if (!current(id, user.uid)) return;
      state.playerName = next.playerName;
      setPhase("waiting", "Bản máy sẵn sàng để sao lưu.");
      scheduleSync(0);
    } else {
      await pendingConflict(root, id);
    }
  }

  async function clearWork(uid, id) {
    const work = await loadSyncMetadata(workKey(uid));
    if (!work?.jobs?.length) return;
    await collectCloudObjects({ database: backend.database, environment: state.environment, uid, jobs: work.jobs, isCurrent: () => current(id, uid) });
    if (current(id, uid)) await saveSyncMetadata(workKey(uid), { jobs: [] }, () => current(id, uid));
  }

  async function syncNow({ manual = false } = {}) {
    if (networkTask) return networkTask;
    if (!navigator.onLine) { setPhase("offline", "Đang offline. Bản máy vẫn được lưu; sẽ gửi lại khi kết nối."); return false; }
    if (manual && backend && !backend.auth.currentUser) {
      const id = generation;
      try { await ensureGuest(); } catch (error) { if (scope.active && generation === id) handleFailure(error); }
      return false;
    }
    if (manual && backend?.auth.currentUser && metadata?.uid !== backend.auth.currentUser.uid && !pending) {
      const user = backend.auth.currentUser;
      const binding = bindUser(user);
      const id = generation;
      try { await binding; } catch (error) { if (current(id, user.uid)) handleFailure(error); }
      return false;
    }
    if (!backend || !state.uid || metadata?.uid !== state.uid || pending) { notifyConflict(); return false; }
    if (manual) retries = 0;
    const minimum = manual ? 15000 : AUTO_SYNC_INTERVAL_MS;
    if (Date.now() - lastUploadAt < minimum) {
      const remaining = minimum - (Date.now() - lastUploadAt);
      if (manual) setPhase("waiting", `Thay đổi đã lưu trên máy; sẽ đồng bộ trong ${Math.ceil(remaining / 1000)} giây.`);
      scheduleSync(remaining, manual); return false;
    }
    const id = generation;
    const uid = state.uid;
    const operation = async () => {
      setPhase("syncing", "Đang sao lưu…");
      await clearWork(uid, id);
      const snapshot = await exportPersistentSnapshot();
      const encoded = await encodeCloudSnapshot(snapshot);
      if (!current(id, uid)) return false;
      const result = await publishCloudSnapshot({
        database: backend.database, environment: state.environment, uid, encoded,
        expectedRevision: metadata.cloudRevision, playerName: state.playerName,
        isCurrent: () => current(id, uid),
        onStagePlan: async jobs => {
          if (jobs.reduce((sum, job) => sum + job.hashes.length, 0) > MAX_PENDING_HASHES) throw new Error("Lượt sao lưu vượt giới hạn phục hồi.");
          return saveSyncMetadata(workKey(uid), { jobs }, () => current(id, uid));
        },
      });
      if (!current(id, uid)) return false;
      lastUploadAt = Date.now(); retries = 0;
      const next = { ...metadata, cloudRevision: result.root.revision, fingerprint: result.root.fingerprint, lastSyncedLocalRevision: snapshot.profile.revision, playerName: state.playerName };
      if (!await persistMetadata(next, id)) throw new Error("Cloud đã lưu nhưng chưa xác nhận được trên máy. Hãy kết nối lại để kiểm tra.");
      if (!result.cleanupError) await saveSyncMetadata(workKey(uid), { jobs: [] }, () => current(id, uid));
      if (!current(id, uid)) return false;
      state.lastSavedAt = result.root.updatedAt?.toMillis?.() || Date.now(); state.operations = { reads: result.reads, writes: result.writes, bytes: encoded.byteLength };
      const changed = getPersistenceStatus().revision !== snapshot.profile.revision || state.playerName !== result.root.playerName;
      setPhase(changed ? "waiting" : "synced", changed ? "Đã lưu một bản; các thay đổi mới đang chờ gửi." : "Đã sao lưu.");
      if (changed || result.cleanupError) scheduleSync();
      return true;
    };
    networkTask = operation().catch(async error => {
      if (!current(id, uid)) return false;
      if (error instanceof CloudConflictError) {
        try { await pendingConflict(error.root, id); }
        catch (previewError) { if (current(id, uid)) handleFailure(previewError); }
      }
      else handleFailure(error);
      return false;
    }).finally(() => { networkTask = null; });
    return networkTask;
  }

  async function applyConflictChoice(choice) {
    if (!pending || getActiveGameScope() || !["local", "cloud"].includes(choice)) return false;
    const id = generation;
    const selected = pending;
    const uid = state.uid;
    const latest = await readCloudRoot(backend.database, state.environment, uid);
    if (!current(id, uid) || getActiveGameScope()) return false;
    if ((latest?.revision || 0) !== (selected.root?.revision || 0)) { await pendingConflict(latest, id); return false; }
    const next = { uid, profileId: choice === "cloud" ? crypto.randomUUID() : owner.id, cloudRevision: latest?.revision || 0, fingerprint: latest?.fingerprint || null, playerName: latest?.playerName || defaultName(uid), lastSyncedLocalRevision: 0 };
    if (choice === "cloud") {
      if (!latest) return false;
      return replaceProfileSafely(async () => {
      setPhase("restoring", "Đang khôi phục bản cloud; bản máy được giữ làm bản phục hồi…");
      const snapshot = await readCloudSnapshot(backend.database, state.environment, uid, latest, () => current(id, uid));
      if (!current(id, uid) || getActiveGameScope()) return false;
      const verified = await readCloudRoot(backend.database, state.environment, uid);
      if (verified?.revision !== latest.revision) { await pendingConflict(verified, id); return false; }
      if (!await importPersistentSnapshot(snapshot, state.environment, next, () => current(id, uid) && !getActiveGameScope())) return false;
      if (current(id, uid)) { pending = null; options.onConflictCleared?.(); }
      await options.onProfileReplaced?.();
      if (!current(id, uid)) return true;
      const restoredMetadata = await loadSyncMetadata(state.environment);
      const restoredOwner = await loadProfileOwner();
      if (!current(id, uid)) return true;
      metadata = restoredMetadata; owner = restoredOwner;
      pending = null; state.playerName = next.playerName; state.lastSavedAt = latest.updatedAt?.toMillis?.() || Date.now();
      setPhase("synced", "Đã dùng bản cloud. Bản máy trước đó vẫn có thể phục hồi.");
      return true;
      });
    } else {
      if (!await persistMetadata(next, id)) return false;
      if (!current(id, uid)) return false;
      pending = null; options.onConflictCleared?.(); state.playerName = next.playerName;
      setPhase("waiting", "Đã chọn bản máy; sẽ sao lưu bản này.");
      lastUploadAt = 0; scheduleSync(0);
    }
    return true;
  }
  async function chooseConflict(choice) {
    const id = generation;
    try { return await applyConflictChoice(choice); }
    catch (error) {
      if (!current(id)) return false;
      if (pending) setPhase("conflict", "Chưa áp dụng được lựa chọn. Bản máy vẫn được giữ nguyên.");
      else handleFailure(error);
      throw error;
    }
  }

  async function requestGoogleLogin() {
    if (!backend) throw new Error("Chưa kết nối được Firebase.");
    if (["connecting", "restoring", "syncing", "conflict"].includes(state.phase)) throw new Error("Hãy hoàn tất đồng bộ hoặc chọn bản lưu trước.");
    const user = await ensureGuest();
    if (metadata?.uid !== user.uid) await bindUser(user);
    if (pending) throw new Error("Hãy chọn bản lưu trước khi liên kết Google.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const result = user.isAnonymous ? await linkWithPopup(user, provider) : await signInWithPopup(backend.auth, provider);
      if (state.uid === result.user.uid) { state.isAnonymous = result.user.isAnonymous; notify(); }
    } catch (error) {
      if (error.code !== "auth/credential-already-in-use" && error.code !== "auth/email-already-in-use") throw error;
      const credential = GoogleAuthProvider.credentialFromError(error);
      if (!credential) throw error;
      // The auth callback offers a save choice for the other UID; resources and old public entries are not merged.
      await service.acceptGoogleCredential(credential);
    }
  }
  async function setPlayerName(value) {
    const name = String(value).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (!name || [...name].length > 20) throw new Error("Tên hiển thị cần từ 1–20 ký tự.");
    if (!metadata || metadata.uid !== state.uid || ["connecting", "syncing", "restoring", "conflict"].includes(state.phase)) throw new Error("Hãy đợi đồng bộ hoàn tất trước khi đổi tên.");
    const id = generation;
    const next = { ...metadata, playerName: name };
    if (!await persistMetadata(next, id)) return false;
    if (!current(id, next.uid)) return false;
    state.playerName = name; setPhase("waiting", "Tên mới đã lưu trên máy, đang chờ đồng bộ."); scheduleSync();
    return true;
  }
  async function applyLocalBackup() {
    if (getActiveGameScope() || pending || !metadata || metadata.uid !== state.uid) return false;
    const id = generation;
    const uid = state.uid;
    const sourceMetadata = { ...metadata };
    const backups = await getLocalRestoreBackups();
    const backup = backups.at(-1);
    if (!backup || !current(id, uid) || pending || getActiveGameScope()) return false;
    return replaceProfileSafely(async () => {
    if (!current(id, uid) || pending || getActiveGameScope()) return false;
    setPhase("restoring", "Đang phục hồi bản máy trước đó…");
    const next = { ...sourceMetadata, profileId: crypto.randomUUID() };
    if (!await importPersistentSnapshot(backup, state.environment, next, () => current(id, uid) && !getActiveGameScope(), { synced: false })) return false;
    await options.onProfileReplaced?.();
    if (!current(id, uid)) return true;
    const restoredMetadata = await loadSyncMetadata(state.environment);
    const restoredOwner = await loadProfileOwner();
    if (!current(id, uid)) return true;
    metadata = restoredMetadata; owner = restoredOwner;
    setPhase("waiting", "Đã phục hồi bản máy. Bản phục hồi này đang chờ sao lưu.");
    lastUploadAt = 0; scheduleSync(0);
    return true;
    });
  }
  async function restoreLocalBackup() {
    const id = generation;
    const uid = state.uid;
    try { return await applyLocalBackup(); }
    catch (error) { if (current(id, uid)) handleFailure(error); throw error; }
  }

  async function bootstrap() {
    owner = await loadProfileOwner();
    if (!scope.active) return;
    backend = await getFirebaseBackend();
    if (!scope.active) return;
    if (!backend || !owner) { setPhase("disabled", "Bản máy vẫn hoạt động. Sao lưu cloud chưa khả dụng ở môi trường này."); return; }
    state.environment = backend.environment;
    scope.own(onIdTokenChanged(backend.auth, user => {
      if (!scope.active) return;
      if (user) {
        const binding = bindUser(user);
        const id = generation;
        void binding.catch(error => { if (current(id, user.uid)) handleFailure(error); });
      }
      else connectGuest();
    }, handleFailure), "listener");
    scope.own(subscribeToLocalCommit(() => {
      if (!metadata || pending) return;
      if (state.phase === "synced") setPhase("waiting", "Các thay đổi mới đã lưu trên máy, đang chờ gửi.");
      scheduleSync();
    }), "listener");
    scope.own(subscribeToAppPages(() => { queueMicrotask(() => { if (scope.active) notifyConflict(); }); }), "listener");
    scope.listen(window, "online", () => {
      retries = 0;
      if (!backend.auth.currentUser) connectGuest();
      else if (metadata?.uid !== state.uid) {
        const user = backend.auth.currentUser;
        const binding = bindUser(user);
        const id = generation;
        void binding.catch(error => { if (current(id, user.uid)) handleFailure(error); });
      }
      else scheduleSync(0, true);
    });
    scope.listen(document, "visibilitychange", () => {
      if (document.hidden && !pending) void syncNow({ manual: true }).catch(handleFailure);
      else if (!document.hidden) notifyConflict();
    });
    scope.listen(window, "pagehide", event => { if (!event.persisted) service.dispose(); });
    notify();
  }
  const service = {
    ready: null,
    getState: publicState,
    getIdentity: () => metadata?.uid === state.uid && state.uid ? { uid: state.uid, profileId: metadata.profileId, firstUid: owner?.firstUid || owner?.uid || state.uid, playerName: state.playerName, environment: state.environment } : null,
    subscribe(listener) { listeners.add(listener); listener(publicState()); return () => listeners.delete(listener); },
    syncNow, chooseConflict, requestGoogleLogin, setPlayerName, restoreLocalBackup,
    acceptGoogleCredential: credential => signInWithCredential(backend.auth, credential),
    dispose() { scope.dispose(); listeners.clear(); if (instance === service) instance = null; },
  };
  service.ready = bootstrap().catch(handleFailure);
  return service;
}
