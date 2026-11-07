import { isAppActive } from './appVisibility.js';
import { onIdTokenChanged, signInAnonymously, signOut, GoogleAuthProvider, linkWithPopup, linkWithCredential, signInWithPopup, signInWithCredential, deleteUser, reauthenticateWithPopup, reauthenticateWithCredential } from "firebase/auth";
import { isNativeGoogle, getNativeGoogleCredential, clearNativeGoogleSession } from './googleAccount.js';
import { setDoc, onSnapshot } from 'firebase/firestore';
import { clearAccountGameData, saveAccountResetMetadata } from './persistence.js';
import { operationRef, loadLocalAccountOperation, saveLocalAccountOperation, readAccountOperation, startAccountOperation, eraseAccountData } from './accountDataOperations.js';
import { getFirebaseBackend } from "./firebaseBackend.js";
import { encodeCloudSnapshot } from "./cloudSnapshot.js";
import { readCloudRoot, readCloudSnapshot, publishCloudSnapshot, collectCloudObjects, CloudConflictError, observeCloudRoot } from "./cloudStore.js";
import { exportPersistentSnapshot, loadSyncMetadata, saveSyncMetadata, updateSyncMetadata, importPersistentSnapshot, getLocalRestoreBackups, loadProfileOwner, subscribeToLocalCommit } from "./persistence.js";
import { createGameShellLifecycle, getActiveGameScope, clearShellTimeout } from "./gameShell/gameShellLifecycle.js";
import { getAppPageScope, subscribeToAppPages } from "./appPageLifecycle.js";
import { replaceProfileSafely, waitForProfileReplacement } from "./profileOperations.js";
import { setRankingOwner } from './rankingOwner.js';
import { gameState } from './gameState.js';
import { createCloudSaveEventFilter, cloudSaveEventSignature } from './cloudSaveEvents.js';

const AUTO_SYNC_INTERVAL_MS = 15000;
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
  let saveGeneration = 0;
  let isCloudSaveEvent = createCloudSaveEventFilter(gameState.progress, gameState.coins, gameState.appearance);
  let stopCloudObserver = null;
  let remoteRoot = null;
  let erasureTask = null;
  let logoutTask = null;
  let stopOperationObserver = null;
  scope.own(() => stopOperationObserver?.(), 'listener');
  scope.own(() => stopCloudObserver?.(), "listener");
  const publicState = () => ({ ...state, conflict: Boolean(pending), bound: metadata?.uid === state.uid && Boolean(state.uid) });
  const current = (id, uid = state.uid) => scope.active && !erasureTask && generation === id && backend?.auth.currentUser?.uid === uid;
  const notify = () => {
    if (owner) setRankingOwner({ id: owner.id, uid: metadata?.uid === state.uid ? metadata.uid : owner.uid });
    for (const listener of listeners) { try { listener(publicState()); } catch (error) { console.error("Account listener failed", error); } }
    options.onState?.(publicState());
  };
  const setPhase = (phase, message) => { state.phase = phase; state.message = message; notify(); };
  const workKey = uid => `${state.environment}:work:${uid}`;
  const eventKey = uid => `${state.environment}:events:${uid}`;
  const defaultName = uid => `Người chơi ${uid.slice(-5)}`;

  function scheduleSync(delay, manual = false) {
    if (!scope.active || erasureTask || logoutTask || loadLocalAccountOperation() || !metadata || retries >= MAX_RETRIES) return;
    const wait = delay ?? Math.max(0, AUTO_SYNC_INTERVAL_MS - (Date.now() - lastUploadAt));
    const dueAt = Date.now() + wait;
    if (scheduled && scheduled.dueAt <= dueAt) return;
    if (scheduled) clearShellTimeout(scheduled.handle);
    const handle = scope.timeout(() => {
      scheduled = null;
      if (pending) { pending.notifiedOwner = null; notifyConflict(); }
      else void syncNow({ manual }).catch(handleFailure);
    }, wait);
    scheduled = { handle, dueAt };
  }
  function handleFailure(error) {
    if (!scope.active) return;
    const localOperation = loadLocalAccountOperation();
    if (localOperation) {
      if (localOperation.kind === 'logout') setPhase('logout-pending', 'Đăng xuất chưa hoàn tất. Mở Hồ sơ để tiếp tục.');
      else setPhase('erasure-pending', 'Yêu cầu xóa chưa hoàn tất. Mở Hồ sơ để tiếp tục.');
      return;
    }
    const offline = !navigator.onLine || ["unavailable", "auth/network-request-failed", "deadline-exceeded"].includes(error.code);
    setPhase(offline ? "offline" : "error", offline ? "Đang offline. Bản máy vẫn được lưu; sẽ gửi lại khi kết nối." : "Chưa đồng bộ được. Bản máy vẫn được giữ nguyên.");
    retries += 1;
    if (navigator.onLine && retries < MAX_RETRIES) scheduleSync(Math.min(900000, AUTO_SYNC_INTERVAL_MS * 2 ** retries));
  }
  async function ensureGuest() {
    if (backend.auth.currentUser) return backend.auth.currentUser;
    const operation = loadLocalAccountOperation();
    if (operation) {
      if (operation.kind !== 'delete' || !['auth-deleting','local-erasing'].includes(operation.phase)) throw new Error('Đăng nhập lại tài khoản để hoàn tất yêu cầu xóa.');
      await clearAccountGameData();
      saveLocalAccountOperation({ ...operation, phase: 'finished' });
      location.reload();
      return null;
    }
    if (!navigator.onLine) throw Object.assign(new Error("Offline"), { code: "auth/network-request-failed" });
    if (!guestTask) guestTask = signInAnonymously(backend.auth).then(result => result.user).finally(() => { guestTask = null; });
    return guestTask;
  }
  function connectGuest() {
    const id = generation;
    void ensureGuest().catch(error => { if (scope.active && generation === id) handleFailure(error); });
  }
  async function persistMetadata(next, id) {
    if (metadata?.uid === next.uid && metadata.resetAt && !next.resetAt) next = { ...next, resetAt: metadata.resetAt };
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
    setPhase("conflict", "Đang tải tiến trình…");
    notifyConflict();
  }
  function notifyConflict() {
    const page = getAppPageScope();
    if (!pending || state.phase === "restoring" || getActiveGameScope() || !page?.active || pending.notifiedOwner === page) return;
    pending.notifiedOwner = page;
    const id = generation;
    void chooseConflict("cloud").catch(error => { if (current(id)) handleFailure(error); });
  }
  async function bindUser(user, force = false) {
    if (!scope.active) return;
    if (erasureTask) return;
    if (!force && state.uid === user.uid && metadata?.uid === user.uid && !pending) {
      state.isAnonymous = user.isAnonymous; notify(); return;
    }
    const id = ++generation;
    metadata = null;
    stopOperationObserver?.(); stopOperationObserver = null;
    stopCloudObserver?.(); stopCloudObserver = null; remoteRoot = null;
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
    const operation = await readAccountOperation(backend.database, user.uid);
    if (!current(id, user.uid)) return;
    const localOperation = loadLocalAccountOperation();
    if (operation && operation.phase !== 'reset-complete' || localOperation?.uid === user.uid) {
      saveLocalAccountOperation(localOperation?.uid === user.uid ? localOperation : { uid: user.uid, kind: operation.kind, space: operation.space, playerName: state.playerName });
      setPhase('erasure-pending', 'Yêu cầu xóa chưa hoàn tất. Mở Hồ sơ để tiếp tục.');
      return;
    }
    if (operation?.phase === 'reset-complete' && operation.space === state.environment && metadata?.resetAt !== operation.createdAt.toMillis()) {
      const localReset = { uid: user.uid, kind: 'reset', space: state.environment, playerName: state.playerName };
      saveLocalAccountOperation(localReset);
      await completeLocalReset(localReset, operation.createdAt.toMillis());
      saveLocalAccountOperation({ ...localReset, phase: 'finished' });
      location.reload();
      return;
    }
    stopOperationObserver = onSnapshot(operationRef(backend.database, user.uid), snapshot => {
      if (!current(id, user.uid) || snapshot.metadata.fromCache || !snapshot.exists()) return;
      const next = snapshot.data();
      if (next.phase !== 'reset-complete' || next.space === state.environment && metadata?.resetAt !== next.createdAt.toMillis()) {
        const binding = bindUser(user, true);
        const nextId = generation;
        void binding.then(() => observeBoundUser(user, nextId)).catch(error => { if (current(nextId, user.uid)) handleFailure(error); });
      }
    }, error => { if (current(id, user.uid)) handleFailure(error); });
    const root = await readCloudRoot(backend.database, state.environment, user.uid);
    if (!current(id, user.uid)) return;
    if(metadata?.uid===user.uid && metadata.restoreNeedsReconcile && root){await pendingConflict(root,id);return;}
    let snapshot = await exportPersistentSnapshot();
    const rewardOwner = snapshot.profile.data.appearance.spark?.ownerUid;
    if (rewardOwner && rewardOwner !== user.uid && !root) {
      if (getActiveGameScope()) throw new Error('Hãy về trang chính để đổi tài khoản. Bản máy được giữ nguyên.');
      const next = { uid:user.uid, profileId:crypto.randomUUID(), cloudRevision:0, fingerprint:null,
        playerName:defaultName(user.uid), lastSyncedLocalRevision:0 };
      const fresh = { ...snapshot, chapters:[], profile:{ ...snapshot.profile, data:{ coins:0, appearance:{},
        progress:{ gameplaySeason:snapshot.profile.data.progress.gameplaySeason }, settings:snapshot.profile.data.settings } } };
      await replaceProfileSafely(async () => {
        if (!await importPersistentSnapshot(fresh, state.environment, next, () => current(id,user.uid), {synced:false})) throw new Error('Chưa thể đổi bản lưu.');
        await options.onProfileReplaced?.();
      });
      if (!current(id,user.uid)) return;
      metadata = await loadSyncMetadata(state.environment); owner = await loadProfileOwner();
      state.playerName = next.playerName;
      snapshot = await exportPersistentSnapshot();
    }
    const encoded = await encodeCloudSnapshot(snapshot);
    const event = await loadSyncMetadata(eventKey(user.uid));
    if (!current(id, user.uid)) return;
    const dirtyEvent = metadata?.uid === user.uid && event?.profileId === owner.id && event.counter > event.savedCounter;
    if (root?.fingerprint === encoded.fingerprint && root.playerName === state.playerName) {
      if (dirtyEvent) await updateSyncMetadata(eventKey(user.uid), latest => latest?.profileId === event.profileId ? { ...latest, savedCounter: Math.max(latest.savedCounter || 0, event.counter) } : latest, () => current(id, user.uid));
      if (!current(id, user.uid)) return;
      const next = { uid: user.uid, profileId: owner.id, cloudRevision: root.revision, fingerprint: root.fingerprint, lastSyncedLocalRevision: snapshot.profile.revision, playerName: metadata?.uid === user.uid ? metadata.playerName : root.playerName };
      if (!await persistMetadata(next, id)) throw new Error("Chưa lưu được liên kết tài khoản.");
      if (!current(id, user.uid)) return;
      state.playerName = next.playerName; state.lastSavedAt = root.updatedAt?.toMillis?.() || Date.now();
      setPhase("synced", "Đã sao lưu.");
    } else if (!root || metadata?.uid === user.uid && (metadata.cloudRevision === root.revision )) {
      if (root && !dirtyEvent) {
        const cloud = await readCloudSnapshot(backend.database, state.environment, user.uid, { ...root, manifest: { profile: root.manifest.profile } }, () => current(id, user.uid));
        if (!current(id, user.uid)) return;
        if (root.playerName === state.playerName && cloudSaveEventSignature(snapshot.profile.data) === cloudSaveEventSignature(cloud.profile.data)) {
          setPhase("synced", "Đã lưu tiến trình");
          return;
        }
      }
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
    if (!work?.jobs?.length) return {reads:0,writes:0};
    const collected = await collectCloudObjects({ database: backend.database, environment: state.environment, uid, jobs: work.jobs, isCurrent: () => current(id, uid) });
    if (current(id, uid)) await saveSyncMetadata(workKey(uid), { jobs: [] }, () => current(id, uid));
    return collected;
  }

  async function syncNow({ manual = false, force = false } = {}) {
    if (erasureTask || loadLocalAccountOperation()) return false;
    if (networkTask) { await networkTask; return syncNow({manual, force}); }
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
    if (!force && Date.now() - lastUploadAt < minimum) {
      const remaining = minimum - (Date.now() - lastUploadAt);
      if (manual) setPhase("waiting", `Thay đổi đã lưu trên máy; sẽ đồng bộ trong ${Math.ceil(remaining / 1000)} giây.`);
      scheduleSync(remaining, manual); return false;
    }
    const id = generation;
    const uid = state.uid;
    const operation = async () => {
      const snapshotSaveGeneration = saveGeneration;
      const snapshotEvent = await loadSyncMetadata(eventKey(uid));
      if (!current(id, uid)) return false;
      const durableMetadata = await loadSyncMetadata(state.environment);
      if(durableMetadata?.restoreNeedsReconcile){await pendingConflict(await readCloudRoot(backend.database,state.environment,uid),id);return false;}
      setPhase("syncing", "Đang sao lưu…");
      await clearWork(uid, id);
      const snapshot = await exportPersistentSnapshot();
      const encoded = await encodeCloudSnapshot(snapshot);
      if (!current(id, uid)) return false;
      const result = await publishCloudSnapshot({
        rewardRevision: snapshot.profile.data.appearance.spark?.state?.revision || 0,
        economyRevision: snapshot.profile.data.appearance.spark?.economyRevision || 0,
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
      if (snapshotEvent?.profileId === owner.id) await updateSyncMetadata(eventKey(uid), event => event?.profileId === snapshotEvent.profileId ? { ...event, savedCounter: Math.max(event.savedCounter || 0, snapshotEvent.counter) } : event, () => current(id, uid));
      const next = { ...metadata, cloudRevision: result.root.revision, fingerprint: result.root.fingerprint, lastSyncedLocalRevision: snapshot.profile.revision, playerName: state.playerName };
      if (!await persistMetadata(next, id)) throw new Error("Cloud đã lưu nhưng chưa xác nhận được trên máy. Hãy kết nối lại để kiểm tra.");
      if (!result.cleanupError) await saveSyncMetadata(workKey(uid), { jobs: [] }, () => current(id, uid));
      if (!current(id, uid)) return false;
      state.lastSavedAt = result.root.updatedAt?.toMillis?.() || Date.now(); state.operations = { reads: result.reads, writes: result.writes, bytes: encoded.byteLength };
      const changed = saveGeneration !== snapshotSaveGeneration || state.playerName !== result.root.playerName;
      setPhase(changed ? "waiting" : "synced", changed ? "Đã lưu một bản; các thay đổi mới đang chờ gửi." : "Đã sao lưu.");
      if (changed || result.cleanupError) scheduleSync();
      return true;
    };
    networkTask = operation().catch(async error => {
      if (!current(id, uid)) return false;
      if (error instanceof CloudConflictError) {
        await pendingConflict(error.root, id);
      }
      else handleFailure(error);
      return false;
    }).finally(() => { networkTask = null; refreshRemote(); });
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
      isCloudSaveEvent = createCloudSaveEventFilter(gameState.progress, gameState.coins, gameState.appearance);
      pending = null; state.playerName = next.playerName; state.lastSavedAt = latest.updatedAt?.toMillis?.() || Date.now();
      setPhase("synced", "Đã dùng bản cloud. Bản máy trước đó vẫn có thể phục hồi.");
      return true;
      });
    } else {
      if(metadata.restoreNeedsReconcile)throw new Error('Bản phục hồi cần được đối chiếu với tiến trình đã đồng bộ.');
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
    if (logoutTask || erasureTask) throw new Error('Hãy đợi thao tác tài khoản hoàn tất.');
    if (loadLocalAccountOperation()) throw new Error('Hãy hoàn tất yêu cầu xóa trước.');
    if (!backend) throw new Error("Chưa có kết nối. Hãy thử lại.");
    if (["connecting", "restoring", "syncing", "conflict"].includes(state.phase)) throw new Error("Hãy hoàn tất đồng bộ hoặc chọn bản lưu trước.");
    const user = await ensureGuest();
    if (!user) return;
    if (metadata?.uid !== user.uid) await bindUser(user);
    if (pending) throw new Error("Hãy chọn bản lưu trước khi liên kết Google.");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const nativeCredential = isNativeGoogle() ? await getNativeGoogleCredential() : null;
      let result;
      try {
        result = nativeCredential
          ? user.isAnonymous ? await linkWithCredential(user, nativeCredential) : await signInWithCredential(backend.auth, nativeCredential)
          : user.isAnonymous ? await linkWithPopup(user, provider) : await signInWithPopup(backend.auth, provider);
      } catch (error) {
        if (!nativeCredential || !['auth/credential-already-in-use', 'auth/email-already-in-use'].includes(error.code)) throw error;
        result = await signInWithCredential(backend.auth, nativeCredential);
      }
      if (state.uid === result.user.uid) { state.isAnonymous = result.user.isAnonymous; notify(); }
    } catch (error) {
      if (error.code !== "auth/credential-already-in-use" && error.code !== "auth/email-already-in-use") throw error;
      const credential = GoogleAuthProvider.credentialFromError(error);
      if (!credential) throw error;
      // The auth callback offers a save choice for the other UID; resources and old public entries are not merged.
      await service.acceptGoogleCredential(credential);
    }
  }
  async function completeLocalReset(operation, resetAt) {
    await clearAccountGameData();
    const freshOwner = await loadProfileOwner();
    await saveAccountResetMetadata(state.environment, { uid: operation.uid, profileId: freshOwner.id, playerName: operation.playerName, resetAt, cloudRevision: 0, fingerprint: null, lastSyncedLocalRevision: 0 });
  }
  async function finishLogout(operation) {
    generation += 1;
    if (scheduled) { clearShellTimeout(scheduled.handle); scheduled = null; }
    stopCloudObserver?.(); stopCloudObserver = null;
    stopOperationObserver?.(); stopOperationObserver = null;
    pending = null; remoteRoot = null;
    setPhase('signing-out', 'Đang đăng xuất…');
    if (networkTask) await networkTask;
    await waitForProfileReplacement();
    await clearNativeGoogleSession();
    await signOut(backend.auth);
    await clearAccountGameData();
    saveLocalAccountOperation({ ...operation, phase: 'finished' });
    location.reload();
  }
  function logout() {
    if (logoutTask) return logoutTask;
    logoutTask = performLogout().finally(() => { logoutTask = null; });
    return logoutTask;
  }
  async function performLogout() {
    if (erasureTask) return erasureTask;
    const previous = loadLocalAccountOperation();
    if (previous && previous.kind !== 'logout') throw new Error('Hãy hoàn tất yêu cầu xóa trước.');
    if (!backend || getActiveGameScope()) throw new Error('Hãy về trang chính trước khi đăng xuất.');
    const user = backend.auth.currentUser;
    if (!previous && (!user || user.isAnonymous || !navigator.onLine || pending)) throw new Error('Kết nối mạng và đợi lưu tiến trình trước khi đăng xuất.');
    if (!previous) {
      if (!await syncNow({ manual: true, force: true }) || state.phase !== 'synced') throw new Error('Chưa lưu xong tiến trình. Hãy thử lại khi có kết nối.');
      saveLocalAccountOperation({ kind: 'logout', uid: user.uid, space: state.environment });
    }
    const operation = previous || loadLocalAccountOperation();
    erasureTask = finishLogout(operation);
    try { return await erasureTask; }
    catch (error) { setPhase('logout-pending', 'Đăng xuất chưa hoàn tất. Hãy tiếp tục để bảo vệ dữ liệu.'); throw error; }
    finally { erasureTask = null; }
  }
  async function eraseCurrentAccount(kind) {
    if (logoutTask) throw new Error('Hãy đợi đăng xuất hoàn tất.');
    if (erasureTask) return erasureTask;
    if (!['delete', 'reset'].includes(kind) || getActiveGameScope()) throw new Error('Hãy về trang chính trước khi xóa.');
    const user = backend?.auth.currentUser;
    if (!user || !navigator.onLine) throw new Error('Cần kết nối mạng và đăng nhập để tiếp tục.');
    const uid = user.uid;
    const previousPhase = state.phase;
    const execute = async () => {
      if (!user.isAnonymous) {
        if (isNativeGoogle()) await reauthenticateWithCredential(user, await getNativeGoogleCredential());
        else await reauthenticateWithPopup(user, new GoogleAuthProvider());
      }
      if (backend.auth.currentUser?.uid !== uid) throw new Error('Tài khoản đã thay đổi.');
      const previous = await readAccountOperation(backend.database, uid);
      const local = loadLocalAccountOperation();
      if (previous?.phase === 'reset-complete' && local?.uid === uid && local.kind === 'reset') {
        if (previous.space === state.environment && metadata?.resetAt !== previous.createdAt.toMillis()) await completeLocalReset(local, previous.createdAt.toMillis());
        saveLocalAccountOperation({ ...local, phase: 'finished' });
        location.reload();
        return;
      }
      const operation = previous && previous.phase !== 'reset-complete' ? { uid, ...previous, playerName: local?.playerName || state.playerName } : { uid, kind, space: state.environment, playerName: state.playerName };
      saveLocalAccountOperation(operation);
      generation += 1;
      if (scheduled) { clearShellTimeout(scheduled.handle); scheduled = null; }
      stopCloudObserver?.(); stopCloudObserver = null; pending = null; remoteRoot = null;
      setPhase('erasing', operation.kind === 'delete' ? 'Đang xóa tài khoản…' : 'Đang xóa dữ liệu…');
      if (networkTask) await networkTask;
      await waitForProfileReplacement();
      const owns = () => scope.active && backend.auth.currentUser?.uid === uid;
      if (!previous || previous.phase === 'reset-complete') await startAccountOperation(backend.database, operation);
      if (!previous || previous.phase === 'reset-complete' || previous.phase === 'erasing') await eraseAccountData(backend.database, uid, operation, owns);
      if (!owns()) throw new Error('Tài khoản đã thay đổi.');
      if (operation.kind === 'delete') {
        if (previous?.phase !== 'deleted') await setDoc(operationRef(backend.database, uid), { phase: 'deleted' }, { merge: true });
        saveLocalAccountOperation({ ...operation, phase: 'auth-deleting' });
        await deleteUser(user);
        await clearAccountGameData();
      } else {
        const record = await readAccountOperation(backend.database, uid);
        await completeLocalReset(operation, record.createdAt.toMillis());
        await setDoc(operationRef(backend.database, uid), { phase: 'reset-complete' }, { merge: true });
      }
      saveLocalAccountOperation({ ...operation, phase: 'finished' });
      location.reload();
    };
    erasureTask = execute();
    try { return await erasureTask; }
    catch (error) { setPhase(loadLocalAccountOperation() ? 'erasure-pending' : previousPhase, 'Chưa hoàn tất yêu cầu xóa. Kiểm tra kết nối rồi thử lại.'); throw error; }
    finally { erasureTask = null; }
  }
  async function setPlayerName(value) {
    if (logoutTask || erasureTask) throw new Error('Hãy đợi thao tác tài khoản hoàn tất.');
    if (loadLocalAccountOperation()) throw new Error('Hãy hoàn tất yêu cầu xóa trước.');
    const name = String(value).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (!name || [...name].length > 20) throw new Error("Tên hiển thị cần từ 1–20 ký tự.");
    if (!metadata || metadata.uid !== state.uid || ["connecting", "syncing", "restoring", "conflict"].includes(state.phase)) throw new Error("Hãy đợi đồng bộ hoàn tất trước khi đổi tên.");
    const id = generation;
    const next = { ...metadata, playerName: name };
    if (!await persistMetadata(next, id)) return false;
    if (!current(id, next.uid)) return false;
    saveGeneration += 1;
    state.playerName = name; setPhase("waiting", "Tên mới đã lưu trên máy, đang chờ đồng bộ."); markSaveEvent();
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
    const currentSnapshot = await exportPersistentSnapshot();
    if(currentSnapshot.profile.data.appearance.spark?.state || backup.profile.data.appearance.spark?.state){
      if(!navigator.onLine)throw new Error('Kết nối tài khoản để đối chiếu bản phục hồi. Bản máy vẫn được giữ nguyên.');
      const root=await readCloudRoot(backend.database,state.environment,uid);
      const restored=await encodeCloudSnapshot(backup);
      if(root && restored.fingerprint!==root.fingerprint)throw Object.assign(new Error('Bản phục hồi cũ hơn kho đã đồng bộ. Bản này vẫn được giữ để đối chiếu; ví hiện tại không thay đổi.'),{code:'rewards/stale-backup'});
    }
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
    const localOperation = loadLocalAccountOperation();
    if (localOperation?.kind === 'logout') {
      state.uid = localOperation.uid;
      await logout();
      return;
    }
    scope.own(onIdTokenChanged(backend.auth, user => {
      if (!scope.active || erasureTask) return;
      if (user) {
        const binding = bindUser(user);
        const id = generation;
        void binding.then(() => observeBoundUser(user, id)).catch(error => { if (current(id, user.uid)) handleFailure(error); });
      }
      else connectGuest();
    }, handleFailure), "listener");
    scope.own(subscribeToLocalCommit(({ patch }) => {
      if (!metadata || metadata.uid !== state.uid) return;
      if (!isCloudSaveEvent(patch)) return;
      // A new local event cannot resolve a conflicting cloud revision. Keep the backup path.
      saveGeneration += 1;
      if (state.phase === "synced") setPhase("waiting", "Các thay đổi mới đã lưu trên máy, đang chờ gửi.");
      markSaveEvent();
    }), "listener");
    scope.own(subscribeToAppPages(() => { queueMicrotask(() => { if (scope.active) { notifyConflict(); refreshRemote(); } }); }), "listener");
    scope.listen(window, "online", () => {
      retries = 0;
      if (pending) { pending.notifiedOwner = null; notifyConflict(); return; }
      if (!backend.auth.currentUser) connectGuest();
      else {
        const user = backend.auth.currentUser;
        const binding = bindUser(user, true);
        const id = generation;
        void binding.then(() => observeBoundUser(user, id)).catch(error => { if (current(id, user.uid)) handleFailure(error); });
      }
    });
    scope.listen(document, "appvisibilitychange", () => {
      if (isAppActive()) notifyConflict();
    });
    scope.listen(window, "pagehide", event => { if (!event.persisted) service.dispose(); });
    notify();
  }
  function observeBoundUser(user, id) {
    if (!current(id, user.uid) || loadLocalAccountOperation() || stopCloudObserver) return;
    stopCloudObserver = observeCloudRoot(backend.database, state.environment, user.uid, root => {
      if (!current(id, user.uid) || root.revision <= (metadata?.cloudRevision || 0)) return;
      remoteRoot = root;
      refreshRemote();
    }, error => { if (current(id, user.uid)) handleFailure(error); });
  }
  function markSaveEvent() {
    const id = generation; const uid = state.uid; const profileId = owner.id;
    const ownsProfile = () => current(id, uid) && owner.id === profileId && metadata?.profileId === profileId;
    void updateSyncMetadata(eventKey(uid), event => ({ profileId, counter: (event?.profileId === profileId ? event.counter || 0 : 0) + 1, savedCounter: event?.profileId === profileId ? event.savedCounter || 0 : 0 }), ownsProfile)
      .then(() => { if (ownsProfile()) scheduleSync(); })
      .catch(error => { if (ownsProfile()) handleFailure(error); });
  }
  function refreshRemote() {
    if (!remoteRoot || pending || scheduled || networkTask || getActiveGameScope() || !getAppPageScope()?.active) return;
    const root = remoteRoot; remoteRoot = null;
    if (root.revision > (metadata?.cloudRevision || 0)) {
      const id = generation; const uid = state.uid;
      void pendingConflict(root, id).catch(error => { if (current(id, uid)) handleFailure(error); });
    }
  }
  async function runRewardOperation(operation) {
    if (erasureTask || loadLocalAccountOperation()) throw new Error('Hãy hoàn tất yêu cầu xóa trước.');
    if (networkTask) await networkTask;
    if (!backend || !metadata || metadata.uid !== state.uid || pending || getActiveGameScope()) throw new Error('Hãy hoàn tất đồng bộ trước khi nhận thưởng.');
    const id = generation, uid = state.uid, profileId = metadata.profileId;
    const owns = () => current(id, uid) && metadata?.profileId === profileId && !pending && !getActiveGameScope();
    const task = replaceProfileSafely(async () => {
      if (!owns()) throw new Error('Tài khoản đã thay đổi.');
      const durableMetadata=await loadSyncMetadata(state.environment);
      if(durableMetadata?.restoreNeedsReconcile)throw new Error('Bản phục hồi cần được đối chiếu trước khi nhận thưởng.');
      const cleanupOperations = await clearWork(uid,id);
      const result = await operation({ backend, cleanupOperations, identity: service.getIdentity(), metadata: { ...metadata }, isCurrent: owns });
      if (result.root && owns()) {
        const next = { ...metadata, cloudRevision: result.root.revision, fingerprint: result.root.fingerprint, lastSyncedLocalRevision: 0 };
        if (!await persistMetadata(next, id)) throw new Error('Quà đã lưu. Hãy tải lại tiến độ.');
        lastUploadAt = Date.now(); state.operations = result.operations || null;
        setPhase('synced', 'Đã sao lưu.');
      }
      return result;
    });
    networkTask = task;
    try { return await task; }
    catch (error) { if (owns() && error instanceof CloudConflictError) await pendingConflict(error.root, id); throw error; }
    finally { if (networkTask === task) networkTask = null; refreshRemote(); }
  }
  const service = {
    ready: null,
    getState: publicState,
    getIdentity: () => !['connecting', 'restoring', 'erasing', 'erasure-pending', 'signing-out', 'logout-pending'].includes(state.phase) && !erasureTask && !logoutTask && !loadLocalAccountOperation() && metadata?.uid === state.uid && state.uid && backend.auth.currentUser?.uid === state.uid ? { uid: state.uid, profileId: metadata.profileId, firstUid: owner?.firstUid || owner?.uid || state.uid, playerName: state.playerName, environment: state.environment, createdAt: Date.parse(backend.auth.currentUser.metadata.creationTime) || null } : null,
    subscribe(listener) { listeners.add(listener); listener(publicState()); return () => listeners.delete(listener); },
    runRewardOperation, syncNow, chooseConflict, requestGoogleLogin, setPlayerName, restoreLocalBackup, eraseCurrentAccount, logout,
    acceptGoogleCredential: credential => signInWithCredential(backend.auth, credential),
    dispose() { scope.dispose(); listeners.clear(); if (instance === service) instance = null; },
  };
  service.ready = bootstrap().catch(handleFailure);
  return service;
}
