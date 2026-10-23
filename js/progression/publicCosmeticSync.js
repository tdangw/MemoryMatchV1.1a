import { gameState } from '../gameState.js';
import { getFirebaseBackend } from '../firebaseBackend.js';
import { getAccountService } from '../accountService.js';
import { loadPersistentGameData, loadSyncMetadata, saveSyncMetadata, subscribeToLocalCommit } from '../persistence.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { publishPublicCosmetics } from './publicCosmeticStore.js';
import { publicCosmeticSelection, publicCosmeticFingerprint } from './publicCosmeticModel.js';
let instance = null;
export const getPublicCosmeticSync = () => instance;
export function initializePublicCosmeticSync() {
  if (instance) return instance;
  const scope = createGameShellLifecycle(), listeners = new Set();
  let backend = null, task = null, timer = null, retries = 0, message = '';
  const notify = value => { message = value; for (const listener of listeners) listener({ message }); };
  const schedule = (delay = 0) => {
    if (!scope.active || timer !== null || retries >= 5) return;
    timer = scope.timeout(() => { timer = null; void service.syncNow(); }, delay);
  };
  const service = { ready: null, getState: () => ({ message }),
    subscribe(listener) { listeners.add(listener); listener({ message }); return () => listeners.delete(listener); },
    async syncNow() {
      if (task) return task;
      const account = getAccountService(), identity = account?.getIdentity();
      if (!scope.active || !backend || !identity || !account.getState().bound || account.getState().conflict || !navigator.onLine) {
        if (identity && !navigator.onLine) notify('Đã lưu trên thiết bị. Sẽ đồng bộ khi có kết nối.');
        return false;
      }
      const current = () => scope.active && account.getIdentity()?.uid === identity.uid
        && account.getIdentity()?.profileId === identity.profileId && !account.getState().conflict && backend.auth.currentUser?.uid === identity.uid;
      let submitted = null;
      task = (async () => {
        const stored = await loadPersistentGameData();
        if (!current()) return false;
        const selection = publicCosmeticSelection(stored.appearance), fingerprint = publicCosmeticFingerprint(selection);
        submitted = fingerprint;
        const receiptKey = `publicCosmetics:${backend.environment}:${identity.uid}`;
        const receipt = await loadSyncMetadata(receiptKey);
        if (!current()) return false;
        if (receipt?.profileId === identity.profileId && receipt.fingerprint === fingerprint) { notify('Trang trí hồ sơ đã đồng bộ.'); return true; }
        notify('Đang đồng bộ trang trí hồ sơ…');
        if (!await publishPublicCosmetics({ database: backend.database, environment: backend.environment, uid: identity.uid, selection, isCurrent: current }) || !current()) return false;
        if (!await saveSyncMetadata(receiptKey, { profileId: identity.profileId, fingerprint }, current)) {
          if (!current()) return false;
          throw new Error('Cosmetic acknowledgment could not be saved.');
        }
        retries = 0; notify('Trang trí hồ sơ đã đồng bộ.'); return true;
      })().catch(error => {
        if (current()) { retries++; notify('Đã lưu trên thiết bị. Chưa đồng bộ được trang trí hồ sơ.'); schedule(Math.min(240000, 5000 * 2 ** retries)); }
        if (error.name !== 'AbortError') console.warn('Public cosmetic sync unavailable', error.code || error.name);
        return false;
      }).finally(() => {
        task = null;
        if (!scope.active) return;
        if (account.getIdentity()?.uid !== identity.uid || account.getIdentity()?.profileId !== identity.profileId) { retries = 0; schedule(); }
        else if (current() && retries === 0 && submitted !== publicCosmeticFingerprint(publicCosmeticSelection(gameState.appearance))) schedule();
      });
      return task;
    },
    dispose() { scope.dispose(); listeners.clear(); if (instance === service) instance = null; },
  };
  instance = service;
  service.ready = getFirebaseBackend().then(value => {
    backend = value; if (!backend || !scope.active) return;
    scope.own(subscribeToLocalCommit(({ patch }) => { if (patch.appearance || patch.restored) { retries = 0; schedule(); } }), 'listener');
    scope.own(getAccountService().subscribe(state => { if (state.bound && !state.conflict) { retries = 0; schedule(); } }), 'listener');
    scope.listen(window, 'online', () => { retries = 0; schedule(); });
    scope.listen(window, 'pagehide', event => { if (!event.persisted) service.dispose(); });
    return service.syncNow();
  }).catch(error => { notify('Chưa đồng bộ được trang trí hồ sơ.'); console.warn('Public cosmetic startup unavailable', error.code || error.name); });
  return service;
}
